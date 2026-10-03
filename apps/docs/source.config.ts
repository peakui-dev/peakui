import {rehypeCodeDefaultOptions} from "fumadocs-core/mdx-plugins";
import {defineConfig, defineDocs, frontmatterSchema} from "fumadocs-mdx/config";
import {z} from "zod";

export const docs = defineDocs({
  dir: "content/docs",
  docs: {
    schema: frontmatterSchema.extend({
      // Source, style and upstream links shown under the page title and served by the
      // components index. See `src/utils/extract-links.ts` for how each becomes a URL.
      links: z
        .object({
          rac: z.string().optional(),
          source: z.string().optional(),
          styles: z.string().optional(),
        })
        .optional(),
    }),
  },
});

export default defineConfig({
  mdxOptions: {
    providerImportSource: "@/mdx-components",
    rehypeCodeOptions: {
      ...rehypeCodeDefaultOptions,
    },
    remarkNpmOptions: {
      persist: {
        id: "package-manager",
      },
    },
  },
});
