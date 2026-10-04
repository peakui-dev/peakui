"use client";

import {Button, Toast, ToastQueue} from "@peakui/react";

export function CustomQueue() {
  const notificationQueue = new ToastQueue({maxVisibleToasts: 2});
  const errorQueue = new ToastQueue({maxVisibleToasts: 3});
  const successQueue = new ToastQueue({maxVisibleToasts: 1});

  return (
    <div className="flex flex-wrap items-center justify-center gap-4">
      {/* Notification Queue */}
      <Toast.Provider placement="bottom" queue={notificationQueue} />
      <Button
        size="sm"
        variant="secondary"
        onPress={() => {
          notificationQueue.add({
            description: "You have a new message",
            title: "New notification",
            variant: "default",
          });
        }}
      >
        Add notification (max 2)
      </Button>

      {/* Error Queue */}
      <Toast.Provider placement="top" queue={errorQueue} />
      <Button
        size="sm"
        variant="danger-soft"
        onPress={() => {
          errorQueue.add({
            description: "Failed to save changes",
            title: "Error occurred",
            variant: "danger",
          });
        }}
      >
        Add error (max 3)
      </Button>

      {/* Success Queue */}
      <Toast.Provider placement="bottom end" queue={successQueue} />
      <Button
        className="text-success"
        size="sm"
        variant="secondary"
        onPress={() => {
          successQueue.add({
            description: "All changes applied",
            title: "Success!",
            variant: "success",
          });
        }}
      >
        Add success (max 1)
      </Button>
    </div>
  );
}
