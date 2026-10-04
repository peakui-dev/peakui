import {Separator} from "@peakui/react";

const items = [
  {
    subtitle: "Receive account activity updates",
    title: "Set Up Notifications",
  },
  {
    subtitle: "Connect your browser to your account",
    title: "Set up Browser Extension",
  },
  {
    subtitle: "Create your first collectible",
    title: "Mint Collectible",
  },
];

export function WithContent() {
  return (
    <div className="max-w-md space-y-4">
      {items.map((item, index) => (
        <div key={item.title}>
          <div className="flex items-center gap-3">
            <div className="flex-1 space-y-0">
              <h4 className="text-sm font-medium">{item.title}</h4>
              <p className="text-sm text-muted">{item.subtitle}</p>
            </div>
          </div>
          {index < items.length - 1 && <Separator className="my-4" />}
        </div>
      ))}
    </div>
  );
}
