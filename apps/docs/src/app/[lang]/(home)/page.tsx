import type {Metadata} from "next";
import type {ReactNode} from "react";

import {buttonVariants} from "@peakui/styles";
import LinkRoot from "fumadocs-core/link";
import {notFound} from "next/navigation";

import {Footer} from "@/components/footer";
import {siteConfig} from "@/config/site";
import {GitHubIcon} from "@/icons/github";
import {getDictionary, hasLocale} from "@/lib/dictionaries";
import {i18n} from "@/lib/i18n";
import {source} from "@/lib/source";
import {currentVersion} from "@/utils/version";

import {CopyCode} from "./components/copy-code";
import {HomeHero} from "./components/home-hero";
import {KeyboardProof} from "./components/keyboard-proof";

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

/* The quick start's three snippets, word for word from the Quick Start page. */
const INSTALL = "npm install @peakui/react @peakui/styles react-aria-components @react-aria/utils";

const STYLES = `@import "tailwindcss";
@import "@peakui/styles/css";`;

const USAGE = `import {Button, Input, Label, TextField} from "@peakui/react";

export function SignUp() {
  return (
    <form className="flex w-64 flex-col gap-3">
      <TextField isRequired name="email" type="email">
        <Label>Email</Label>
        <Input placeholder="jane@example.com" />
      </TextField>
      <Button type="submit">Sign up</Button>
    </form>
  );
}`;

/* A restyle through the component's own handles: both variables are declared in button.css. */
const OVERRIDE = `.button--primary {
  --button-bg: var(--color-success);
  --button-radius: 0.5rem;
}`;

/* The tokens the theme proof paints, each with the foreground the engine pairs it with. */
const PROOF_TOKENS: [name: string, className: string][] = [
  ["accent", "bg-accent text-accent-foreground"],
  ["accent-soft", "bg-accent-soft text-accent-soft-foreground"],
  ["default", "bg-default text-default-foreground"],
  ["success", "bg-success text-success-foreground"],
  ["danger", "bg-danger text-danger-foreground"],
];

/* One claim of the sheet: what it is in a sentence, then the thing itself as proof. */
function Feature({body, children, title}: {body: string; children: ReactNode; title: string}) {
  return (
    <div className="flex flex-col gap-6 bg-background p-6 sm:p-10">
      <div className="flex flex-col gap-2">
        <h3 className="text-xl font-semibold tracking-tight text-foreground">{title}</h3>
        <p className="max-w-[52ch] leading-relaxed text-muted">{body}</p>
      </div>
      {children}
    </div>
  );
}

export default async function HomePage({params}: {params: Promise<{lang: string}>}) {
  const {lang} = await params;

  if (!hasLocale(lang)) notFound();

  const dict = await getDictionary(lang);
  const {home} = dict;
  const {features, start} = home;

  // Counted from the published pages, so the claim cannot drift from the docs.
  const componentCount = source
    .getPages(lang)
    .filter(
      ({slugs}) => slugs[0] === "react" && slugs[1] === "components" && slugs.length > 2,
    ).length;

  const steps: [title: string, code: string][] = [
    [start.install, INSTALL],
    [start.styles, STYLES],
    [start.use, USAGE],
  ];

  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-col">
      {/* The plates share the navigation's width and gutter, so their edges meet the logo's. */}
      <div className="mx-auto flex w-full max-w-(--fd-layout-width) flex-col gap-3 px-3 py-3 sm:px-6">
        <HomeHero
          version={currentVersion}
          copy={{
            brands: home.brands,
            description: home.description.replace("{count}", String(componentCount)),
            getStarted: home.getStarted,
            title: home.title,
            viewComponents: home.viewComponents,
          }}
        />
        <section
          aria-labelledby="home-features"
          className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-separator bg-separator md:grid-cols-2"
        >
          <h2
            className="bg-background px-6 pt-8 pb-6 text-3xl font-semibold tracking-tight text-foreground sm:px-10 sm:pt-10 sm:text-4xl md:col-span-2"
            id="home-features"
          >
            {features.title}
          </h2>
          <Feature body={features.accessible.body} title={features.accessible.title}>
            <KeyboardProof hint={features.accessible.try} />
          </Feature>
          <Feature body={features.theme.body} title={features.theme.title}>
            <div className="flex flex-col gap-3">
              <ul className="grid grid-cols-5 gap-px overflow-hidden rounded-xl border border-separator bg-separator">
                {PROOF_TOKENS.map(([token, className]) => (
                  <li key={token} className="bg-surface">
                    <div
                      className={`flex h-20 flex-col justify-between p-2.5 text-xs font-medium ${className}`}
                    >
                      <span className="truncate">{token}</span>
                      <span aria-hidden="true" className="text-lg leading-none font-semibold">
                        Aa
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="text-sm text-muted">{features.theme.caption}</p>
            </div>
          </Feature>
          <Feature body={features.css.body} title={features.css.title}>
            <CopyCode code={OVERRIDE} />
          </Feature>
          <Feature body={features.agents.body} title={features.agents.title}>
            <ul className="flex flex-col divide-y divide-separator rounded-xl border border-separator text-sm">
              {(
                [
                  [features.agents.index, "/llms.txt"],
                  [features.agents.markdown, "/docs/react/components/button.md"],
                  [features.agents.json, "/api/components"],
                ] as const
              ).map(([label, href]) => (
                <li key={href}>
                  <a
                    className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-3 hover:bg-default-soft"
                    href={href}
                  >
                    <span className="font-medium text-foreground">{label}</span>
                    <span className="font-mono text-xs text-muted">{href}</span>
                  </a>
                </li>
              ))}
            </ul>
          </Feature>
        </section>
        <section
          aria-labelledby="home-start"
          className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-separator bg-separator lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]"
        >
          <div className="flex flex-col items-start justify-between gap-8 bg-background p-6 sm:p-10">
            <h2
              className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
              id="home-start"
            >
              {start.title}
            </h2>
            <div className="flex flex-col items-start gap-4">
              <LinkRoot
                className={buttonVariants({variant: "primary"})}
                href="/docs/react/getting-started/quick-start"
              >
                {start.more}
              </LinkRoot>
              <a
                className="flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
                href={siteConfig.githubUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                <GitHubIcon className="size-4" />
                <span>{home.sourceOnGithub}</span>
              </a>
            </div>
          </div>
          <ol className="flex flex-col gap-8 bg-background p-6 sm:p-10">
            {steps.map(([title, code], index) => (
              <li key={title} className="flex flex-col gap-3">
                <h3 className="flex items-baseline gap-3 font-medium text-foreground">
                  <span aria-hidden="true" className="text-muted tabular-nums">
                    {index + 1}
                  </span>
                  {title}
                </h3>
                <CopyCode code={code} />
              </li>
            ))}
          </ol>
        </section>
      </div>
      <Footer dict={dict.footer} />
    </main>
  );
}
