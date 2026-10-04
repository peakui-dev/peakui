"use client";

import type {ToastContentValue} from "@peakui/react";

import {
  Button,
  Toast,
  ToastContent,
  ToastDescription,
  ToastIndicator,
  ToastQueue,
  ToastTitle,
} from "@peakui/react";

const queue = new ToastQueue();

export function CustomToast() {
  return (
    <div className="flex flex-col items-center gap-6">
      <Toast.Provider placement="bottom" queue={queue}>
        {({toast: toastItem}) => {
          const content = toastItem.content as ToastContentValue;

          return (
            <Toast
              className="rounded-xl border border-border"
              toast={toastItem}
              variant={content.variant}
            >
              <ToastContent>
                <div className="flex items-center gap-2">
                  <ToastIndicator className="text-accent" variant={content.variant} />
                  <div className="flex flex-col pe-6">
                    {content.title ? (
                      <ToastTitle className="text-accent">{content.title}</ToastTitle>
                    ) : null}
                    {content.description ? (
                      <ToastDescription>{content.description}</ToastDescription>
                    ) : null}
                  </div>
                </div>
              </ToastContent>
              <Toast.CloseButton className="absolute end-2 top-1/2 -translate-y-1/2 border-none bg-transparent opacity-100 [&>svg]:size-4" />
            </Toast>
          );
        }}
      </Toast.Provider>
      <Button
        size="sm"
        variant="secondary"
        onPress={() => {
          queue.add({
            description: "This uses a custom render function",
            title: "Custom layout toast",
            variant: "default",
          });
        }}
      >
        Custom toast
      </Button>
    </div>
  );
}
