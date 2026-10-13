"use client";

import {Button} from "@peakui/react";
import {useEffect, useState} from "react";

/** A code block with its copy button; the button names what it did for two seconds. */
export function CopyCode({code}: {code: string}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;

    const timer = window.setTimeout(() => setCopied(false), 2000);

    return () => window.clearTimeout(timer);
  }, [copied]);

  return (
    <div className="relative">
      {/* Long lines wrap instead of scrolling, so nothing slides under the button. */}
      <pre className="rounded-xl bg-default p-4 pe-20 font-mono text-[13px] leading-relaxed wrap-anywhere whitespace-pre-wrap text-default-foreground">
        <code className="border-none p-0">{code}</code>
      </pre>
      <Button
        className="absolute end-2 top-2"
        size="sm"
        variant="ghost"
        onPress={() => {
          void navigator.clipboard?.writeText(code).then(() => setCopied(true));
        }}
      >
        <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
      </Button>
    </div>
  );
}
