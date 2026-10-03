import LinkRoot from "fumadocs-core/link";
import {HomeLayout} from "fumadocs-ui/layouts/home";

import {Footer} from "@/components/footer";
import {getDictionary} from "@/lib/dictionaries";
import {i18n} from "@/lib/i18n";

import {getHomeLayoutLinks} from "./(home)/home-layout-links";
import {baseOptions} from "./layout.config";

export default async function NotFound() {
  const dict = await getDictionary("en");
  const {notFound} = dict;

  return (
    <HomeLayout
      {...baseOptions}
      links={getHomeLayoutLinks(dict)}
      themeSwitch={{
        mode: "light-dark-system",
      }}
    >
      <div className="mt-12 flex h-full flex-col items-center justify-center text-center md:mt-24">
        <h2 className="text-4xl font-bold">{notFound.title}</h2>
        <p className="mt-2 max-w-sm text-balance text-muted">{notFound.description}</p>
        <LinkRoot
          className="button button--md button--tertiary mt-4"
          href={`/${i18n.defaultLanguage}`}
        >
          {notFound.returnHome}
        </LinkRoot>
      </div>
      <Footer dict={dict.footer} />
    </HomeLayout>
  );
}
