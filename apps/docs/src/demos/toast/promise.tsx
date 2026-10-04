"use client";

import {Button, toast} from "@peakui/react";

const uploadFile = (): Promise<{filename: string; size: number}> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve({filename: "document.pdf", size: 1024}), 2000);
  });
};

const createEvent = (): Promise<never> => {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Network error. Please try again.")), 2000);
  });
};

export function PromiseDemo() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4">
      <Button
        size="sm"
        variant="secondary"
        onPress={() => {
          toast.promise(uploadFile(), {
            error: "Failed to upload file",
            loading: "Uploading file...",
            success: (data) => `File ${data.filename} uploaded (${data.size}KB)`,
          });
        }}
      >
        Upload file
      </Button>
      <Button
        size="sm"
        variant="secondary"
        onPress={() => {
          toast.promise(createEvent(), {
            error: (err) => err.message,
            loading: "Creating event...",
            success: "Event created",
          });
        }}
      >
        Create event (error)
      </Button>
      <Button
        size="sm"
        variant="secondary"
        onPress={() => {
          const loadingId = toast("Saving changes...", {
            isLoading: true,
            timeout: 0,
          });

          setTimeout(() => {
            toast.update(loadingId, "Failed to save", {
              description: "Please try again",
              timeout: 4000,
              variant: "danger",
            });
          }, 2000);
        }}
      >
        Manual loading
      </Button>
    </div>
  );
}
