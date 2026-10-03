import {spawn} from "node:child_process";

export interface ExecResult {
  exitCode: number | null;
  stdout: string;
  stderr: string;
  durationMs: number;
  timedOut: boolean;
  /** Either stream hit the output cap; the stream then reads head, an omission line, tail, marker. */
  truncated: boolean;
}

export interface ExecOptions {
  cwd: string;
  env?: NodeJS.ProcessEnv;
  timeoutMs: number;
  /** Per stream; default 8 MiB. The child keeps running; of its output the first and the last half are kept. */
  maxOutputBytes?: number;
  /** After the timeout's first signal (SIGTERM) the group is killed with SIGKILL; default 2000. */
  killGraceMs?: number;
  /** After the child exits, how long to wait for its pipes to close before giving up; default 250. */
  exitGraceMs?: number;
}

const DEFAULT_MAX_OUTPUT_BYTES = 8 * 1024 * 1024;
const DEFAULT_KILL_GRACE_MS = 2000;
const DEFAULT_EXIT_GRACE_MS = 250;

/** Bytes of a UTF-8 sequence that is cut off at the end of `bytes`. */
function incompleteTail(bytes: Buffer): number {
  for (let back = 1; back <= Math.min(3, bytes.length); back += 1) {
    const byte = bytes[bytes.length - back]!;

    if (byte >= 0xc0) {
      const needed = byte >= 0xf0 ? 4 : byte >= 0xe0 ? 3 : 2;

      return back < needed ? back : 0;
    }
    if (byte < 0x80) return 0;
  }

  return 0;
}

/** Continuation bytes at the start of `bytes`: the rest of a character whose beginning was cut off. */
function orphanHead(bytes: Buffer): number {
  let count = 0;

  while (count < 3 && count < bytes.length && (bytes[count]! & 0xc0) === 0x80) count += 1;

  return count;
}

/**
 * One output stream, held as bytes and decoded once at the end, so a multi-byte character that
 * arrives in two chunks is never split. Within the cap everything is kept; beyond it the first and
 * the last half are, because a command's failure is usually at its tail.
 */
class Capture {
  total = 0;
  private head: Buffer[] = [];
  private headBytes = 0;
  private tail: Buffer[] = [];
  private tailBytes = 0;
  private readonly headLimit: number;
  private readonly tailLimit: number;

  private readonly cap: number;

  constructor(cap: number) {
    this.cap = cap;
    this.headLimit = Math.ceil(cap / 2);
    this.tailLimit = cap - this.headLimit;
  }

  get truncated(): boolean {
    return this.total > this.cap;
  }

  push(chunk: Buffer): void {
    this.total += chunk.length;

    let rest = chunk;

    if (this.headBytes < this.headLimit) {
      const taken = rest.subarray(0, this.headLimit - this.headBytes);

      this.head.push(taken);
      this.headBytes += taken.length;
      rest = rest.subarray(taken.length);
    }

    if (rest.length === 0) return;

    this.tail.push(rest);
    this.tailBytes += rest.length;

    // Drop whole chunks from the front while the tail still holds enough without them.
    while (this.tail.length > 1 && this.tailBytes - this.tail[0]!.length >= this.tailLimit) {
      this.tailBytes -= this.tail.shift()!.length;
    }
  }

  text(): string {
    const head = Buffer.concat(this.head);
    let tail = Buffer.concat(this.tail);

    if (!this.truncated) return Buffer.concat([head, tail]).toString("utf8");

    tail = tail.subarray(Math.max(0, tail.length - this.tailLimit));

    const keptHead = head.subarray(0, head.length - incompleteTail(head));
    const keptTail = tail.subarray(orphanHead(tail));
    const omitted = this.total - keptHead.length - keptTail.length;

    return `${keptHead.toString("utf8")}\n[${omitted} bytes omitted]\n${keptTail.toString("utf8")}`;
  }
}

function signalGroup(pid: number | undefined, signal: NodeJS.Signals): void {
  if (pid === undefined) return;
  try {
    process.kill(-pid, signal);
  } catch {
    // The group is already gone.
  }
}

export function runCommand(argv: string[], options: ExecOptions): Promise<ExecResult> {
  return new Promise((resolve) => {
    const started = Date.now();
    const [command, ...args] = argv;
    let extraStderr = "";
    let timedOut = false;
    let settled = false;
    const cap = options.maxOutputBytes ?? DEFAULT_MAX_OUTPUT_BYTES;
    const out = new Capture(cap);
    const err = new Capture(cap);

    function finish(exitCode: number | null) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      clearTimeout(escalation);
      clearTimeout(exitTimer);
      // Whatever is still running in the child's group (a grandchild holding the pipes) is killed:
      // nothing outlives the command.
      signalGroup(child.pid, "SIGKILL");
      child.stdout?.destroy();
      child.stderr?.destroy();

      const marker = `\n[output truncated at ${cap} bytes]`;

      resolve({
        durationMs: Date.now() - started,
        exitCode,
        stderr: err.text() + extraStderr + (err.truncated ? marker : ""),
        stdout: out.text() + (out.truncated ? marker : ""),
        timedOut,
        truncated: out.truncated || err.truncated,
      });
    }

    if (!command) {
      resolve({
        durationMs: 0,
        exitCode: null,
        stderr: "empty command",
        stdout: "",
        timedOut: false,
        truncated: false,
      });

      return;
    }

    let escalation: NodeJS.Timeout | undefined;
    let exitTimer: NodeJS.Timeout | undefined;

    const child = spawn(command, args, {
      cwd: options.cwd,
      detached: true,
      env: options.env ?? process.env,
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
    });

    const timer = setTimeout(() => {
      timedOut = true;
      signalGroup(child.pid, "SIGTERM");
      escalation = setTimeout(
        () => signalGroup(child.pid, "SIGKILL"),
        options.killGraceMs ?? DEFAULT_KILL_GRACE_MS,
      );
    }, options.timeoutMs);

    child.stdout.on("data", (chunk: Buffer) => {
      out.push(chunk);
    });
    child.stderr.on("data", (chunk: Buffer) => {
      err.push(chunk);
    });
    child.on("error", (error) => {
      extraStderr += error.message;
      finish(null);
    });
    // `exit` fires when the process ends; `close` only when every holder of its pipes has let go,
    // and a grandchild can hold them for as long as it lives. Wait a short grace for the stream
    // tail, then settle without it.
    child.on("exit", (code) => {
      exitTimer = setTimeout(() => finish(code), options.exitGraceMs ?? DEFAULT_EXIT_GRACE_MS);
    });
    child.on("close", (code) => {
      finish(code);
    });
  });
}
