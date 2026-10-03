import {spawn} from "node:child_process";

export interface ExecResult {
  exitCode: number | null;
  stdout: string;
  stderr: string;
  durationMs: number;
  timedOut: boolean;
  /** Either stream hit the output cap; the stream ends with a marker line. */
  truncated: boolean;
}

export interface ExecOptions {
  cwd: string;
  env?: NodeJS.ProcessEnv;
  timeoutMs: number;
  /** Per stream; default 8 MiB. The child keeps running and its excess output is dropped. */
  maxOutputBytes?: number;
}

const DEFAULT_MAX_OUTPUT_BYTES = 8 * 1024 * 1024;

export function runCommand(argv: string[], options: ExecOptions): Promise<ExecResult> {
  return new Promise((resolve) => {
    const started = Date.now();
    const [command, ...args] = argv;
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let settled = false;
    let stdoutBytes = 0;
    let stderrBytes = 0;
    let truncated = false;
    const cap = options.maxOutputBytes ?? DEFAULT_MAX_OUTPUT_BYTES;

    // Returns the text to keep of a chunk, given how many bytes the stream already holds.
    function keep(chunk: Buffer, held: number): string {
      if (held >= cap) {
        truncated = true;

        return "";
      }

      if (held + chunk.length <= cap) return chunk.toString("utf8");

      truncated = true;

      return chunk.subarray(0, cap - held).toString("utf8");
    }

    function finish(exitCode: number | null) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);

      const marker = `\n[output truncated at ${cap} bytes]`;

      resolve({
        durationMs: Date.now() - started,
        exitCode,
        stderr: stderrBytes > cap ? stderr + marker : stderr,
        stdout: stdoutBytes > cap ? stdout + marker : stdout,
        timedOut,
        truncated,
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

    const child = spawn(command, args, {
      cwd: options.cwd,
      detached: true,
      env: options.env ?? process.env,
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
    });

    const timer = setTimeout(() => {
      timedOut = true;
      try {
        if (child.pid !== undefined) process.kill(-child.pid, "SIGKILL");
      } catch {
        child.kill("SIGKILL");
      }
    }, options.timeoutMs);

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += keep(chunk, stdoutBytes);
      stdoutBytes += chunk.length;
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += keep(chunk, stderrBytes);
      stderrBytes += chunk.length;
    });
    child.on("error", (error) => {
      stderr += error.message;
      finish(null);
    });
    child.on("close", (code) => {
      finish(code);
    });
  });
}
