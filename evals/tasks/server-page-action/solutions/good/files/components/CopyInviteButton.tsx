"use client";

import {Button} from "@peakui/react";

export function CopyInviteButton() {
  return (
    <Button onPress={() => void navigator.clipboard.writeText("https://acme.example/invite/team")}>
      Copy invite link
    </Button>
  );
}
