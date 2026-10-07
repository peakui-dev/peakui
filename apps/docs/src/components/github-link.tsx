import {Link} from "@peakui/react";
import {buttonVariants} from "@peakui/styles";

import {siteConfig} from "@/config/site";
import {GitHubIcon} from "@/icons/github";
import {cn} from "@/utils/cn";

/**
 * Icon-only link to the source repository, used in the docs and home headers.
 *
 * `size-9` restates the `md` box on purpose. `.link` declares `h-fit w-fit`, and link.css is
 * imported after button.css in @peakui/styles, so at equal specificity it collapses the button's
 * own height and width — link.css has a `&.button` block for this combination, but it only resets
 * the gap and the underline, not the box. The utility layer wins over both, which is what makes
 * this work. 36px is the height of an icon-only Button at `md` and of SegmentedControl at `md`, so
 * the header row is uniform.
 */
export function GitHubLinkSmall({className}: {className?: string}) {
  return (
    <Link
      aria-label="GitHub repository"
      href={siteConfig.githubUrl}
      rel="noopener noreferrer"
      target="_blank"
      className={buttonVariants({
        class: cn("size-9 border-none", className),
        isIconOnly: true,
        size: "md",
        variant: "tertiary",
      })}
    >
      <GitHubIcon className="size-4" />
    </Link>
  );
}
