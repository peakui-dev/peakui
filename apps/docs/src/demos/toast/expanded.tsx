"use client";

import {Button, Toast, ToastQueue} from "@peakui/react";

const queue = new ToastQueue();

export function Expanded() {
  return (
    <div className="flex flex-col items-center gap-6">
      <Toast.Provider
        isExpanded
        aria-label="Expanded notifications"
        placement="bottom"
        queue={queue}
      />
      <Button
        size="sm"
        variant="secondary"
        onPress={() => {
          queue.add({
            title: "Simple message",
            variant: "default",
          });
          setTimeout(() => {
            queue.add({
              title: "Operation completed",
              variant: "success",
            });
          }, 400);
          setTimeout(() => {
            queue.add({
              title: "New update available",
              variant: "accent",
            });
          }, 800);
        }}
      >
        Show 3 toasts
      </Button>
    </div>
  );
}
