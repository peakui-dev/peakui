import type {StatusChipStatus} from "@/components/status-chip";
import type {Metadata} from "next";

import {createRelativeLink} from "fumadocs-ui/mdx";
import {notFound} from "next/navigation";

import {ViewOptions} from "@/components/ai/page-actions";
import {ComponentLinks} from "@/components/component-links";
import {ComponentsCategory} from "@/components/components-category";
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "@/components/fumadocs/layouts/notebook/page";
import {LocaleLink} from "@/components/locale-link";
import {StatusChip} from "@/components/status-chip";
import {siteConfig} from "@/config/site";
import {source} from "@/lib/source";
import {getMDXComponents} from "@/mdx-components";

const componentStatusIcons = ["preview", "new", "updated"];

export default async function Page(props: {params: Promise<{lang: string; slug?: string[]}>}) {
  const params = await props.params;

  const page = source.getPage(params.slug, params.lang);

  if (!page) notFound();

  const MDXContent = page.data.body;
  const isComponentStatusIcon = page.data.icon && componentStatusIcons.includes(page.data.icon);

  return (
    <DocsPage
      full={page.data.full}
      toc={page.data.toc}
      tableOfContent={{
        style: "normal",
      }}
    >
      <section className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <DocsTitle className="flex items-center gap-2">
            {page.data.title}
            {!!isComponentStatusIcon && (
              <StatusChip className="w-fit" status={page.data.icon as StatusChipStatus} />
            )}
          </DocsTitle>
          {page.data.toc.length > 0 && (
            <div className="flex flex-wrap items-center justify-start gap-2">
              <ViewOptions markdownUrl={`${page.url}.md`} />
            </div>
          )}
        </div>
        <DocsDescription className="text-md mt-2 mb-4">{page.data.description}</DocsDescription>
        {!!page.data.links && <ComponentLinks links={page.data.links} />}
      </section>
      <DocsBody className="prose-sm">
        <MDXContent
          components={getMDXComponents({
            ComponentsCategory: (props) => <ComponentsCategory {...props} locale={params.lang} />,

            // this allows you to link to other pages with relative file paths
            a: createRelativeLink(source, page, LocaleLink),
          })}
        />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateMetadata(props: {
  params: Promise<{lang: string; slug?: string[]}>;
}): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug, params.lang);

  if (!page) notFound();

  const {description, title} = page.data;

  return {
    // `page.url` carries the locale prefix (`/en/docs/...`), which is the URL actually served.
    alternates: {canonical: page.url},
    description,
    openGraph: {
      description,
      siteName: siteConfig.name,
      title,
      url: page.url,
    },
    title,
  };
}

export async function generateStaticParams() {
  return source
    .generateParams("slug", "lang")
    .filter((param) => param.slug && param.slug.length > 0);
}
