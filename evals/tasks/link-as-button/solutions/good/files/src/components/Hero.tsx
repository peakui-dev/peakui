import {buttonVariants} from "@peakui/react";

export function Hero() {
  return (
    <section className="flex flex-col items-start gap-3 rounded-xl bg-neutral-100 p-6">
      <h2 className="text-xl font-semibold">Upgrade your workspace</h2>
      <p className="text-sm text-neutral-600">More seats, longer history and priority support.</p>
      <a className={buttonVariants({variant: "secondary"})} href="/pricing">
        View pricing
      </a>
    </section>
  );
}
