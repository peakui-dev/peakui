import type {TaskDefinition} from "../src/types.ts";

import {customButtonVariant} from "./custom-button-variant/task.ts";
import {destructiveActions} from "./destructive-actions/task.ts";
import {linkAsButton} from "./link-as-button/task.ts";
import {pendingButton} from "./pending-button/task.ts";
import {pressStateLabel} from "./press-state-label/task.ts";
import {signInForm} from "./sign-in-form/task.ts";

export const tasks: TaskDefinition[] = [
  signInForm,
  pendingButton,
  customButtonVariant,
  destructiveActions,
  pressStateLabel,
  linkAsButton,
];

export function getTask(id: string): TaskDefinition {
  const task = tasks.find((candidate) => candidate.id === id);

  if (!task) {
    throw new Error(
      `unknown task "${id}"; known: ${tasks.map((candidate) => candidate.id).join(", ")}`,
    );
  }

  return task;
}
