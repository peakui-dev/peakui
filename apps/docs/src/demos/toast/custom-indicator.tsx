"use client";

import {Star} from "@gravity-ui/icons";
import {Button, toast} from "@peakui/react";

export function CustomIndicator() {
  return (
    <Button
      size="sm"
      variant="secondary"
      onPress={() =>
        toast("Custom icon indicator", {
          indicator: <Star />,
        })
      }
    >
      Custom indicator
    </Button>
  );
}
