"use client";

import {Button, toast} from "@peakui/react";

export function Simple() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4">
      <Button size="sm" variant="secondary" onPress={() => toast("Simple message")}>
        Default
      </Button>
      <Button size="sm" variant="secondary" onPress={() => toast.success("Operation completed")}>
        Success
      </Button>
      <Button size="sm" variant="secondary" onPress={() => toast.info("New update available")}>
        Info
      </Button>
      <Button
        size="sm"
        variant="secondary"
        onPress={() => toast.warning("Please check your settings")}
      >
        Warning
      </Button>
      <Button size="sm" variant="secondary" onPress={() => toast.danger("Something went wrong")}>
        Error
      </Button>
    </div>
  );
}
