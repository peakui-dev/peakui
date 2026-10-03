import type {ComponentProps, Ref} from "react";

import gravityIcons from "@iconify-json/gravity-ui/icons.json";

interface IconData {
  body: string;
  height?: number;
  width?: number;
}

const icons: Record<string, IconData> = gravityIcons.icons;

const FALLBACK_ICON = "square";

/** Gravity UI icons are drawn on a 16px grid unless an icon says otherwise. */
const DEFAULT_SIZE = 16;

export interface IconifyProps extends Omit<ComponentProps<"svg">, "ref"> {
  /** Name of a Gravity UI icon, with or without the `gravity-ui:` prefix. */
  icon: string;
  ref?: Ref<SVGSVGElement>;
}

/**
 * Renders an icon from the bundled Gravity UI set as inline SVG. The data is local, so the icon
 * is identical on the server and the client and no request leaves the page.
 */
export function Iconify({height = "1em", icon, ref, width = "1em", ...props}: IconifyProps) {
  const iconData = icons[icon.replace(/^gravity-ui:/, "")] ?? icons[FALLBACK_ICON];

  if (!iconData) return null;

  const viewBox = `0 0 ${iconData.width ?? DEFAULT_SIZE} ${iconData.height ?? DEFAULT_SIZE}`;

  return (
    <svg
      ref={ref}
      aria-hidden="true"
      height={height}
      viewBox={viewBox}
      width={width}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
      dangerouslySetInnerHTML={{__html: iconData.body}}
    />
  );
}
