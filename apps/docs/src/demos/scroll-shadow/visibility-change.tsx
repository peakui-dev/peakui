"use client";

import {ScrollShadow} from "@peakui/react";
import {useState} from "react";

const paragraphs = Array.from({length: 6}, (_, idx) => (
  <p key={`scroll-shadow-lorem-content-${idx}`}>
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam pulvinar risus non risus
    hendrerit venenatis. Pellentesque sit amet hendrerit risus, sed porttitor quam.
  </p>
));

export function VisibilityChange() {
  const [state, setState] = useState<string>("none");

  return (
    <div className="flex w-full flex-col gap-4 sm:max-w-sm">
      <p className="rounded-lg bg-surface-secondary p-4 text-sm font-semibold">
        Shadow State: {state}
      </p>
      <ScrollShadow
        className="max-h-[240px] p-4"
        onVisibilityChange={(visibility) => setState(visibility)}
      >
        <div className="space-y-4">{paragraphs}</div>
      </ScrollShadow>
    </div>
  );
}
