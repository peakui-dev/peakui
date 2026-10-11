import type {TaskDefinition} from "../src/types.ts";

import {brandPrimaryButton} from "./brand-primary-button/task.ts";
import {customButtonVariant} from "./custom-button-variant/task.ts";
import {destructiveActions} from "./destructive-actions/task.ts";
import {firstSetupAction} from "./first-setup-action/task.ts";
import {firstTimeSetup} from "./first-time-setup/task.ts";
import {linkAsButton} from "./link-as-button/task.ts";
import {pendingButton} from "./pending-button/task.ts";
import {prefixedField} from "./prefixed-field/task.ts";
import {pressStateLabel} from "./press-state-label/task.ts";
import {profileSettings} from "./profile-settings/task.ts";
import {sectionGroupRender} from "./section-group-render/task.ts";
import {serverPageAction} from "./server-page-action/task.ts";
import {signInForm} from "./sign-in-form/task.ts";
import {teamMembers} from "./team-members/task.ts";
import {unstyledSharedBadge} from "./unstyled-shared-badge/task.ts";

export const tasks: TaskDefinition[] = [
  signInForm,
  pendingButton,
  customButtonVariant,
  destructiveActions,
  pressStateLabel,
  linkAsButton,
  prefixedField,
  sectionGroupRender,
  unstyledSharedBadge,
  brandPrimaryButton,
  firstTimeSetup,
  serverPageAction,
  profileSettings,
  teamMembers,
  firstSetupAction,
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
