"use client";

import type {ReactNode} from "react";

import {Button, ButtonGroup, Description, Dropdown, Label, toast} from "@peakui/react";
import {useMemo, useState} from "react";

import {ChevronDown} from "@/components/fumadocs/ui/icons";
import {useDictionary} from "@/hooks/use-dictionary";
import {ClaudeIcon, MarkdownIcon, OpenAIIcon} from "@/icons/dev";
import {cn} from "@/utils/cn";

import {Iconify} from "../iconify";

interface PageAction {
  description: string;
  external?: boolean;
  href: string;
  icon: ReactNode;
  key: string;
  title: string;
}

const cache = new Map<string, string>();

/**
 * "Copy Markdown" plus a menu of ways to open the page elsewhere.
 *
 * `markdownUrl` is the page's `.md` route, the same output agents receive.
 */
export function ViewOptions({markdownUrl}: {markdownUrl: string}) {
  const dict = useDictionary().pageActions;
  const [isLoading, setLoading] = useState(false);
  const [isOpen, setOpen] = useState(false);

  const items = useMemo<PageAction[]>(() => {
    const fullMarkdownUrl =
      typeof window === "undefined"
        ? markdownUrl
        : new URL(markdownUrl, window.location.origin).href;
    const query = dict.askWithUrl.replace("{url}", fullMarkdownUrl);

    return [
      {
        description: dict.items.markdown.description,
        href: markdownUrl,
        icon: <MarkdownIcon size={18} />,
        key: "markdown",
        title: dict.items.markdown.title,
      },
      {
        description: dict.items.chatgpt.description,
        external: true,
        href: `https://chatgpt.com/?${new URLSearchParams({hints: "search", q: query})}`,
        icon: <OpenAIIcon size={16} />,
        key: "chatgpt",
        title: dict.items.chatgpt.title,
      },
      {
        description: dict.items.claude.description,
        external: true,
        href: `https://claude.ai/new?${new URLSearchParams({q: query})}`,
        icon: <ClaudeIcon size={16} />,
        key: "claude",
        title: dict.items.claude.title,
      },
    ];
  }, [markdownUrl, dict]);

  const handleCopy = async () => {
    setLoading(true);

    try {
      let content = cache.get(markdownUrl);

      if (!content) {
        const res = await fetch(markdownUrl);

        if (!res.ok) throw new Error(`Failed to fetch content: ${res.statusText}`);

        content = await res.text();
        cache.set(markdownUrl, content);
      }

      await navigator.clipboard.writeText(content);
      toast.success(dict.copied);
    } catch (error) {
      console.error("Failed to copy markdown:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ButtonGroup>
      <Button
        className={cn(isLoading && "animate-pulse")}
        isDisabled={isLoading}
        size="md"
        variant="tertiary"
        onPress={() => void handleCopy()}
      >
        <Iconify icon="copy" />
        {dict.copyMarkdown}
      </Button>
      <Dropdown isOpen={isOpen} onOpenChange={setOpen}>
        <Button isIconOnly aria-label={dict.moreOptions} size="md" variant="tertiary">
          <ButtonGroup.Separator />
          <ChevronDown
            className={cn(
              "text-fd-muted-foreground size-3.5 transition-transform",
              isOpen && "rotate-180",
            )}
          />
        </Button>
        <Dropdown.Popover placement="bottom end">
          <Dropdown.Menu>
            {items.map((item) => (
              <Dropdown.Item
                key={item.key}
                href={item.href}
                id={item.key}
                rel="noreferrer noopener"
                target="_blank"
                textValue={item.title}
              >
                {item.icon}
                <span className="flex w-full flex-col">
                  <Label>{item.title}</Label>
                  <Description>{item.description}</Description>
                </span>
                {item.external ? (
                  <Iconify className="text-foreground/70" icon="arrow-up-right-from-square" />
                ) : null}
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    </ButtonGroup>
  );
}
