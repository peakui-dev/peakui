"use client";

import {Persons} from "@gravity-ui/icons";
import {Button, toast} from "@peakui/react";

export function Basic() {
  return (
    <Button
      size="sm"
      variant="secondary"
      onPress={() => {
        const id = toast("You have been invited to join a team", {
          actionProps: {
            children: "Dismiss",
            onPress: () => toast.close(id),
            variant: "tertiary",
          },
          description: "Bob sent you an invitation to join the team",
          indicator: <Persons />,
          variant: "default",
        });
      }}
    >
      Show toast
    </Button>
  );
}
