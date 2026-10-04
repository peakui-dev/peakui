import {Button, ScrollShadow, Surface} from "@peakui/react";

const paragraphs = Array.from({length: 6}, (_, idx) => (
  <p key={`scroll-shadow-lorem-content-${idx}`}>
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam pulvinar risus non risus
    hendrerit venenatis. Pellentesque sit amet hendrerit risus, sed porttitor quam.
  </p>
));

export function WithSurface() {
  return (
    <Surface className="flex w-full max-w-[400px] flex-col gap-4 rounded-3xl p-6">
      <h3 className="text-base font-semibold">Terms and Conditions</h3>
      <p className="text-sm text-muted">Please review before proceeding</p>
      <ScrollShadow className="h-[300px] px-4" size={80}>
        <div className="space-y-4">{paragraphs}</div>
      </ScrollShadow>
      <div className="flex flex-row gap-2">
        <Button className="w-full" variant="secondary">
          Cancel
        </Button>
        <Button className="w-full">Accept</Button>
      </div>
    </Surface>
  );
}
