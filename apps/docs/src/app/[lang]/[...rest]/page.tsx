import {notFound} from "next/navigation";

/*
 * The router's catch-all: any path under a locale that no page matches renders the
 * not-found page through this route instead of relying on the host's unmatched-route
 * behavior. Next handles unmatched routes natively, but the Workers deployment answers
 * them from the asset layer with a plain-text 404; an explicit route behaves identically
 * on both hosts.
 */
export default function CatchAllPage() {
  notFound();
}
