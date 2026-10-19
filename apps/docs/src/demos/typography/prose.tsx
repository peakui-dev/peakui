import {Prose} from "@peakui/react";

export function ProseDemo() {
  return (
    <Prose className="max-w-md">
      <h3>Prose</h3>
      <p>
        Styles the elements inside it, such as <a href="#top">a link</a>, <code>code</code> and{" "}
        <strong>strong</strong> text.
      </p>
      <ul>
        <li>A list item</li>
        <li>Another list item</li>
      </ul>
    </Prose>
  );
}
