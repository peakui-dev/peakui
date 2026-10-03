import fs from "node:fs/promises";
import path from "node:path";

import * as React from "react";

import {getDemo} from "@/demos";
import {cn} from "@/utils/cn";

import {CodeBlock} from "./codeblock";

export async function ComponentSource({
  className,
  collapsible = true,
  language,
  name,
  showCodeTitle = false,
  showLineNumbers = true,
  title,
}: React.ComponentProps<"div"> & {
  name?: string;
  title?: string;
  language?: string;
  showCodeTitle?: boolean;
  showLineNumbers?: boolean;
  collapsible?: boolean;
}) {
  if (!name) {
    return null;
  }

  const src = getDemo(name)?.file;
  let code: string | undefined;

  if (src) {
    try {
      const file = await fs.readFile(path.join(process.cwd(), "src", "demos", src), "utf-8");

      code = file;
    } catch {
      // The demo file could not be read: render nothing rather than break the page.
      return null;
    }
  }

  if (!code) {
    return null;
  }

  const lang = language ?? title?.split(".").pop() ?? "tsx";

  return (
    <div className={cn("relative", className)}>
      <CodeBlock
        code={code}
        collapsible={collapsible}
        lang={lang}
        showLineNumbers={showLineNumbers}
        title={showCodeTitle ? title : undefined}
      />
    </div>
  );
}
