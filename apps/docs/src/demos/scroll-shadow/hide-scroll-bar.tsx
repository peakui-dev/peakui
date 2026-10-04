import {ScrollShadow} from "@peakui/react";

const paragraphs = Array.from({length: 6}, (_, idx) => (
  <p key={`scroll-shadow-lorem-content-${idx}`}>
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam pulvinar risus non risus
    hendrerit venenatis. Pellentesque sit amet hendrerit risus, sed porttitor quam.
  </p>
));

export function HideScrollBar() {
  return (
    <div className="w-full sm:max-w-sm">
      <ScrollShadow hideScrollBar className="max-h-[240px] p-4">
        <div className="space-y-4">{paragraphs}</div>
      </ScrollShadow>
    </div>
  );
}
