"use client";

import type {Dictionary} from "@/lib/dictionaries";
import type {ReactNode} from "react";

import {Toast} from "@peakui/react";
import {i18nProvider} from "fumadocs-ui/i18n";
import {RootProvider} from "fumadocs-ui/provider/next";

import {LocaleLink} from "@/components/locale-link";
import {DictionaryProvider} from "@/hooks/use-dictionary";
import {translations} from "@/lib/layout.shared";

export function CustomRootProvider({
  children,
  dict,
  lang,
}: {
  children: ReactNode;
  dict: Dictionary;
  lang: string;
}) {
  return (
    <DictionaryProvider dict={dict}>
      <RootProvider components={{Link: LocaleLink}} i18n={i18nProvider(translations, lang)}>
        {children}
        {/* The toast region: renders nothing until a toast is queued (e.g. by page actions). */}
        <Toast.Provider />
      </RootProvider>
    </DictionaryProvider>
  );
}
