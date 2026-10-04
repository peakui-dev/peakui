import {Button, EmptyState} from "@peakui/react";

export function WithAction() {
  return (
    <EmptyState className="flex max-w-sm flex-col items-center gap-3 py-8 text-center">
      <p className="text-sm font-medium text-foreground">No projects yet</p>
      <p>Create the first project to get started</p>
      <Button variant="secondary">Create project</Button>
    </EmptyState>
  );
}
