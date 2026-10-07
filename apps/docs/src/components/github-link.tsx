import {Link} from "@peakui/react";
import {buttonVariants} from "@peakui/styles";

import {siteConfig} from "@/config/site";
import {GitHubIcon} from "@/icons/github";
import {cn} from "@/utils/cn";

/**
 * Icon-only link to the source repository, used in the docs and home headers.
 *
 * `size-9` and the radius restate the `md` button on purpose. `.link` declares
 * `h-fit w-fit rounded-xl`, and link.css is imported after button.css in @peakui/styles, so at
 * equal specificity it overrides the button's own box AND its 24px radius — link.css has a
 * `&.button` block for this combination, but it resets only the gap and the underline. Left alone,
 * this link renders 24x12 with a 12px radius: a small rounded square beside two circles. The
 * utility layer wins over both component classes, which is what makes these two work.
 *
 * The radius is re-asserted through the button's own `--button-radius` handle rather than
 * `rounded-full`, so a theme that shrinks the radius scale moves this link with every other button
 * instead of pinning it to a circle.
 */
export function GitHubLinkSmall({className}: {className?: string}) {
  return (
    <Link
      aria-label="GitHub repository"
      href={siteConfig.githubUrl}
      rel="noopener noreferrer"
      target="_blank"
      className={buttonVariants({
        class: cn("size-9 rounded-(--button-radius) border-none", className),
        isIconOnly: true,
        size: "md",
        variant: "tertiary",
      })}
    >
      <GitHubIcon className="size-4" />
    </Link>
  );
}
