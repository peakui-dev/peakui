import {Link} from "@peakui/react";
import {buttonVariants} from "@peakui/styles";

import {siteConfig} from "@/config/site";
import {GitHubIcon} from "@/icons/github";
import {cn} from "@/utils/cn";

/** Icon-only link to the source repository, used in the docs and home headers. */
export function GitHubLinkSmall({className}: {className?: string}) {
  return (
    <Link
      aria-label="GitHub repository"
      href={siteConfig.githubUrl}
      rel="noopener noreferrer"
      target="_blank"
      className={buttonVariants({
        class: cn("size-[34px] border-none", className),
        isIconOnly: true,
        size: "sm",
        variant: "tertiary",
      })}
    >
      <GitHubIcon className="size-4" />
    </Link>
  );
}
