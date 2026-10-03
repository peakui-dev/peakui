import type {JSX} from "react";

export type Status = "active" | "paused" | "archived";

export interface StatusBadgeProps {
  status: Status;
}

export declare function StatusBadge(props: StatusBadgeProps): JSX.Element;
