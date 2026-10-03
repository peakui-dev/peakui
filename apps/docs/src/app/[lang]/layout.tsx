import type {Metadata, Viewport} from "next";
import type {ReactNode} from "react";

import {NextProvider} from "fumadocs-core/framework/next";
import {TreeContextProvider} from "fumadocs-ui/contexts/tree";
import {Inter} from "next/font/google";
import {notFound} from "next/navigation";

import {siteConfig} from "@/config/site";
import {getDictionary, hasLocale} from "@/lib/dictionaries";
import {i18n} from "@/lib/i18n";
import {source} from "@/lib/source";
import {__BASE_URL__} from "@/utils/env";

import {CustomRootProvider} from "../custom-root-provider";

import "../global.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

/*
 * next-themes marks the dark theme with `.dark` on <html>, which is what fumadocs-ui styles
 * follow. The PeakUI tokens follow `.default-dark` / `.default-light` instead, so this script
 * mirrors one onto the other. It runs before first paint and on every later class change, so
 * there is no flash and no second source of truth for the theme.
 */
const THEME_BRIDGE_SCRIPT = `(function(){var d=document.documentElement;function s(){var k=d.classList.contains("dark");d.classList.toggle("default-dark",k);d.classList.toggle("default-light",!k)}s();new MutationObserver(s).observe(d,{attributes:true,attributeFilter:["class"]})})()`;

export default async function Layout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{lang: string}>;
}) {
  const {lang} = await params;

  if (!hasLocale(lang)) notFound();

  const dict = await getDictionary(lang);

  return (
    <html suppressHydrationWarning className={inter.variable} lang={lang}>
      <head>
        <script dangerouslySetInnerHTML={{__html: THEME_BRIDGE_SCRIPT}} />
      </head>
      <body className="flex min-h-screen flex-col font-sans">
        <NextProvider>
          <TreeContextProvider tree={source.getPageTree(lang)}>
            <CustomRootProvider dict={dict} lang={lang}>
              {children}
            </CustomRootProvider>
          </TreeContextProvider>
        </NextProvider>
      </body>
    </html>
  );
}

export function generateStaticParams() {
  return i18n.languages.map((lang) => ({lang}));
}

export const metadata: Metadata = {
  description: siteConfig.description,
  keywords: [
    "React",
    "PeakUI",
    "React Aria",
    "Tailwind CSS",
    "React components",
    "UI components",
    "accessible React components",
    "design system",
  ],
  metadataBase: __BASE_URL__,
  openGraph: {
    description: siteConfig.description,
    locale: "en_US",
    siteName: siteConfig.name,
    type: "website",
    url: __BASE_URL__.toString(),
  },
  robots: {
    follow: true,
    index: true,
  },
  title: {
    default: siteConfig.fullName,
    template: `%s | ${siteConfig.name}`,
  },
};

export const viewport: Viewport = {
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    {color: "#f4f4f5", media: "(prefers-color-scheme: light)"},
    {color: "#111111", media: "(prefers-color-scheme: dark)"},
  ],
  width: "device-width",
};
