import {EmptyState} from "@peakui/react";
import {HomeLayout} from "fumadocs-ui/layouts/home";

import {Footer} from "@/components/footer";
import {ThemeToggleSystem} from "@/components/fumadocs/ui/theme-toggle";
import {NotFoundActions} from "@/components/not-found-actions";
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
      /*
       * Same reason as (home)/layout.tsx: without the slot HomeLayout renders the upstream fumadocs
       * ThemeSwitch, and a visitor who lands on a 404 would get a third, different control.
       */
      slots={{
        themeSwitch: ThemeToggleSystem,
      }}
    >
      {/*
       * EmptyState is a client component; the children below are server-rendered elements,
       * which cross the boundary safely as a ReactNode prop.
       */}
      <EmptyState className="mt-12 flex h-full flex-col items-center justify-center text-center md:mt-24">
        <h2 className="text-4xl font-bold">{notFound.title}</h2>
        <p className="mt-2 max-w-sm text-balance text-muted">{notFound.description}</p>
        <NotFoundActions href={`/${i18n.defaultLanguage}`} label={notFound.returnHome} />
      </EmptyState>
      <Footer dict={dict.footer} />
    </HomeLayout>
  );
}
