import {DemoComponents} from "@/components/demo";

/** The framed component wall under the hero. */
export function DemoShowcase() {
  return (
    <div className="mx-auto mt-10 flex w-full max-w-[1200px] flex-1 flex-col pb-8 md:mt-14">
      <div className="flex min-h-[420px] flex-1 justify-center rounded-2xl border border-border/50 bg-background py-8">
        <div className="my-auto">
          <DemoComponents />
        </div>
      </div>
    </div>
  );
}
