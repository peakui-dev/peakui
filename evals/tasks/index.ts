import type {TaskDefinition} from "../src/types.ts";

import {signInForm} from "./sign-in-form/task.ts";

export const tasks: TaskDefinition[] = [signInForm];

export function getTask(id: string): TaskDefinition {
  const task = tasks.find((candidate) => candidate.id === id);

  if (!task) {
    throw new Error(
      `unknown task "${id}"; known: ${tasks.map((candidate) => candidate.id).join(", ")}`,
    );
  }

  return task;
}
