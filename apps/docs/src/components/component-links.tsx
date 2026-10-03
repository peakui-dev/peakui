"use client";

import type {ComponentLinksType} from "@/utils/extract-links";

import {useDictionary} from "@/hooks/use-dictionary";
import {GithubIcon, ReactAriaIcon} from "@/icons/dev";
import {generateComponentLinks} from "@/utils/extract-links";
import {docsButtonVariants} from "@/utils/variants";

export interface ComponentLinksProps {
  links?: ComponentLinksType;
}

const ButtonLink = ({
  children,
  href,
  startContent,
  ...props
}: React.HTMLProps<HTMLAnchorElement> & {
  startContent?: React.ReactNode;
}) => {
  return (
    <a
      className={docsButtonVariants()}
      href={href}
      rel="noopener noreferrer"
      target="_blank"
      {...props}
    >
      {startContent}
      {children}
    </a>
  );
};

export const ComponentLinks = ({links}: ComponentLinksProps) => {
  const dict = useDictionary().componentLinks;
  const componentLinks = generateComponentLinks(links || null);

  if (!componentLinks) {
    return null;
  }

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {componentLinks.rac ? (
        <ButtonLink
          href={componentLinks.rac}
          startContent={<ReactAriaIcon className="text-lg text-[#6733FF]" />}
        >
          React Aria
        </ButtonLink>
      ) : null}
      {componentLinks.source ? (
        <ButtonLink href={componentLinks.source} startContent={<GithubIcon size={20} />}>
          {dict.source}
        </ButtonLink>
      ) : null}
      {componentLinks.styles ? (
        <ButtonLink href={componentLinks.styles} startContent={<GithubIcon size={20} />}>
          {dict.stylesSource}
        </ButtonLink>
      ) : null}
    </div>
  );
};
