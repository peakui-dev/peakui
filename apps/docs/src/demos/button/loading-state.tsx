"use client";

import {Button, Spinner} from "@peakui/react";
import {useState} from "react";

export function LoadingState() {
  const [isPending, setIsPending] = useState(false);

  const handlePress = () => {
    setIsPending(true);
    setTimeout(() => setIsPending(false), 2000);
  };

  return (
    <Button isPending={isPending} onPress={handlePress}>
      {({isPending}) => (
        <>
          {isPending ? <Spinner aria-hidden color="current" size="sm" /> : null}
          {isPending ? "Saving" : "Save changes"}
        </>
      )}
    </Button>
  );
}
