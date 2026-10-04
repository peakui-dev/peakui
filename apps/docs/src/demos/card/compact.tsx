import {Card} from "@peakui/react";

export function Compact() {
  return (
    <div className="flex flex-wrap gap-4">
      <Card className="w-[200px] gap-2">
        <img
          alt="Indie Hackers community"
          className="aspect-square w-14 rounded-2xl object-cover"
          loading="lazy"
          src="https://picsum.photos/seed/peakui-card-indie/112/112"
        />
        <Card.Header>
          <Card.Title>Indie Hackers</Card.Title>
          <Card.Description>148 members</Card.Description>
        </Card.Header>
        <Card.Footer className="flex gap-2">
          <img
            alt="Martha's avatar"
            className="size-5 rounded-full object-cover"
            loading="lazy"
            src="https://picsum.photos/seed/peakui-card-martha/40/40"
          />
          <span className="text-xs">By Martha</span>
        </Card.Footer>
      </Card>
      <Card className="w-[200px] gap-2">
        <img
          alt="AI Builders community"
          className="aspect-square w-14 rounded-2xl object-cover"
          loading="lazy"
          src="https://picsum.photos/seed/peakui-card-ai/112/112"
        />
        <Card.Header>
          <Card.Title>AI Builders</Card.Title>
          <Card.Description>362 members</Card.Description>
        </Card.Header>
        <Card.Footer className="flex gap-2">
          <img
            alt="John's avatar"
            className="size-5 rounded-full object-cover"
            loading="lazy"
            src="https://picsum.photos/seed/peakui-card-john/40/40"
          />
          <span className="text-xs">By John</span>
        </Card.Footer>
      </Card>
    </div>
  );
}
