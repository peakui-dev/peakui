"use client";

import {CloseButton} from "@peakui/react";
import {useState} from "react";

export function Interactive() {
  const [count, setCount] = useState(0);

  return (
    <div className="flex flex-col items-center gap-4">
      <CloseButton
        aria-label={`Close (clicked ${count} times)`}
        onPress={() => setCount(count + 1)}
      />
      <span className="text-sm">Clicked: {count} times</span>
    </div>
  );
}
