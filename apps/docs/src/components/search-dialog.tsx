"use client";

import type {SortedResult} from "fumadocs-core/search";
import type {SharedProps} from "fumadocs-ui/contexts/search";
import type {KeyboardEvent, ReactNode} from "react";

import {ListBox, Modal, SearchField, Spinner} from "@peakui/react";
import {useDocsSearch} from "fumadocs-core/search/client";
import {useI18n} from "fumadocs-ui/contexts/i18n";
import {useRouter} from "next/navigation";
import {useRef} from "react";

/*
 * The documentation-site search dialog, assembled from PeakUI components. The engine keeps
 * everything below the chrome: the search index behind `/api/search`, the query debounce
 * (`useDocsSearch`), the ⌘K shortcut, the open state and the localized UI strings. This component
 * is registered as `search={{SearchDialog}}` on the RootProvider in `app/custom-root-provider.tsx`.
 */

/** Splits indexed content into plain fragments and `<mark>`-wrapped highlighted fragments. */
function parseHighlights(content: string): ReactNode[] {
  return content.split(/(<mark>.*?<\/mark>)/g).map((fragment, index) => {
    if (fragment.startsWith("<mark>") && fragment.endsWith("</mark>")) {
      return (
        <mark key={index} className="bg-accent-soft text-accent-soft-foreground">
          {fragment.slice(6, -7)}
        </mark>
      );
    }

    return fragment;
  });
}

export default function SearchDialog({onOpenChange, open}: SharedProps) {
  const {locale, text} = useI18n();
  const router = useRouter();
  const {query, search, setSearch} = useDocsSearch({locale, type: "fetch"});
  const listRef = useRef<HTMLDivElement>(null);

  const results = Array.isArray(query.data) ? query.data : [];
  const hasQuery = search.trim().length > 0;

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);

    // Reopening starts from an empty query, as in the reference dialog.
    if (!isOpen) setSearch("");
  };

  const select = (item: SortedResult) => {
    router.push(item.url);
    onOpenChange(false);
  };

  /*
   * Keyboard handoff between the input and the results. Arrow keys move focus into the list —
   * the first or last option directly; from there the ListBox owns arrow navigation and Enter.
   * Escape closes on the first press: RAC search fields spend the first Escape on clearing the
   * text and stop its propagation, while this dialog must close like the engine's default one.
   */
  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      onOpenChange(false);

      return;
    }

    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    if (results.length === 0) return;

    event.preventDefault();

    const options = listRef.current?.querySelectorAll<HTMLElement>('[role="option"]');
    const option = event.key === "ArrowDown" ? options?.[0] : options?.[options.length - 1];

    option?.focus();
  };

  return (
    <Modal.Backdrop isOpen={open} onOpenChange={handleOpenChange}>
      <Modal.Container placement="top" size="lg">
        <Modal.Dialog
          aria-label={text.search}
          className="gap-0 overflow-hidden p-0 sm:max-w-[640px]"
        >
          <div className="flex items-center border-b border-separator p-3 pe-12">
            <SearchField
              aria-label={text.search}
              className="min-w-0 flex-1"
              value={search}
              onChange={setSearch}
              onSubmit={() => {
                if (results[0]) select(results[0]);
              }}
            >
              <SearchField.Group>
                <SearchField.SearchIcon />
                <SearchField.Input autoFocus placeholder={text.search} onKeyDown={onInputKeyDown} />
                <SearchField.ClearButton />
              </SearchField.Group>
            </SearchField>
            <Modal.CloseTrigger aria-label={text.searchClose} />
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {query.isLoading ? (
              <div className="flex items-center justify-center py-10" data-loading="">
                <Spinner size="sm" />
              </div>
            ) : results.length > 0 ? (
              <ListBox
                ref={listRef}
                aria-label={text.search}
                items={results}
                onAction={(key) => {
                  const item = results.find((result) => result.id === key);

                  if (item) select(item);
                }}
              >
                {(item) => (
                  <ListBox.Item id={item.id} textValue={item.content}>
                    <div className="flex min-w-0 flex-col gap-0.5">
                      {item.breadcrumbs && item.breadcrumbs.length > 0 ? (
                        <span className="text-muted truncate text-xs">
                          {item.breadcrumbs.join(" / ")}
                        </span>
                      ) : null}
                      <span className="truncate text-sm">{parseHighlights(item.content)}</span>
                    </div>
                  </ListBox.Item>
                )}
              </ListBox>
            ) : hasQuery ? (
              <p className="text-muted p-3 py-10 text-center text-sm" data-empty="">
                {text.searchNoResult}
              </p>
            ) : null}
          </div>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
