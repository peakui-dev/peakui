import type {Metadata} from "next";

import {buttonVariants} from "@peakui/styles";
import LinkRoot from "fumadocs-core/link";
import {notFound} from "next/navigation";

import {Footer} from "@/components/footer";
import {siteConfig} from "@/config/site";
import {GitHubIcon} from "@/icons/github";
import {getDictionary, hasLocale} from "@/lib/dictionaries";
import {i18n} from "@/lib/i18n";
import {currentVersion} from "@/utils/version";

import {DemoShowcase} from "./components/demo-showcase";

export const dynamic = "force-static";
export const revalidate = false;

export function generateStaticParams() {
  return i18n.languages.map((lang) => ({lang}));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{lang: string}>;
}): Promise<Metadata> {
  const {lang} = await params;
  const dict = await getDictionary(hasLocale(lang) ? lang : "en");
  const {metaDescription: description, metaTitle: title} = dict.home;

  return {
    alternates: {canonical: "/"},
    description,
    openGraph: {
      description,
      locale: "en_US",
      siteName: siteConfig.name,
      title,
      type: "website",
      url: "/",
    },
    title: {absolute: title},
  };
}

export default async function HomePage({params}: {params: Promise<{lang: string}>}) {
  const {lang} = await params;

  if (!hasLocale(lang)) notFound();

  const dict = await getDictionary(lang);
  const {home} = dict;

  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-col">
      <section className="z-10 flex min-h-0 flex-1 flex-col items-center px-4 pt-12 text-center">
        <div className="mx-auto flex max-w-2xl flex-col items-center justify-center">
          <span className="inline-flex items-center rounded-full bg-default px-3 py-1 text-xs font-medium text-muted">
            @peakui/react v{currentVersion}
          </span>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:mt-4 lg:text-5xl">
            {home.titleMain} <span className="block text-muted/70">{home.titleMuted}</span>
          </h1>
          <p className="mt-3 text-balance text-muted md:text-lg">{home.description}</p>
          <div className="mt-4 flex gap-3">
            <LinkRoot
              className={buttonVariants({variant: "primary"})}
              href="/docs/react/getting-started"
            >
              {home.getStarted}
            </LinkRoot>
            <LinkRoot
              className={buttonVariants({variant: "outline"})}
              href="/docs/react/components"
            >
              {home.viewComponents}
            </LinkRoot>
          </div>
          <a
            className="mt-2 flex items-center justify-around gap-2 text-xs text-muted transition-colors hover:text-foreground lg:mt-4"
            href={siteConfig.githubUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            <GitHubIcon className="size-4" />
            <span>{home.sourceOnGithub}</span>
          </a>
          <section aria-labelledby="peakui-overview" className="sr-only">
            <h2 id="peakui-overview">{home.overviewTitle}</h2>
            <p>{home.overview}</p>
            <h3>{home.agentsTitle}</h3>
            <p>{home.agents}</p>
          </section>
        </div>
        <DemoShowcase />
      </section>
      <Footer dict={dict.footer} />
    </main>
  );
}
