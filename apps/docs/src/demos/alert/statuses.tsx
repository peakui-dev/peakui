import {Alert} from "@peakui/react";

const STATUSES = [
  {description: "General information for the reader.", status: "default", title: "New features"},
  {description: "A new version is available.", status: "accent", title: "Update available"},
  {description: "Your payment has been processed.", status: "success", title: "Payment successful"},
  {
    description: "You're using 90% of your storage quota.",
    status: "warning",
    title: "Storage almost full",
  },
  {
    description: "We're experiencing connection issues.",
    status: "danger",
    title: "Unable to connect",
  },
] as const;

export function Statuses() {
  return (
    <div className="flex w-full max-w-xl flex-col gap-4">
      {STATUSES.map(({description, status, title}) => (
        <Alert key={status} status={status}>
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{title}</Alert.Title>
            <Alert.Description>{description}</Alert.Description>
          </Alert.Content>
        </Alert>
      ))}
    </div>
  );
}
