import type {Dictionary} from "@/lib/dictionaries";

export function Footer({dict}: {dict: Dictionary["footer"]}) {
  return (
    <footer className="mt-auto flex w-full flex-row flex-wrap items-center justify-center gap-2 py-3 text-muted">
      <p className="text-sm">
        &copy; {new Date().getFullYear()} PeakUI. {dict.tagline}
      </p>
    </footer>
  );
}
