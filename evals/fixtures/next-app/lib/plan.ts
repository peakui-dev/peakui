import {readFile} from "node:fs/promises";
import {join} from "node:path";

export interface Plan {
  name: string;
  seats: number;
}

export async function getPlan(): Promise<Plan> {
  const raw = await readFile(join(process.cwd(), "data", "plan.json"), "utf8");

  return JSON.parse(raw) as Plan;
}
