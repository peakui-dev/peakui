import {Button, Card} from "@peakui/react";

export function Horizontal() {
  return (
    <Card className="w-full max-w-md items-stretch sm:flex-row">
      <img
        alt="Sports car"
        className="pointer-events-none aspect-square w-full rounded-3xl object-cover select-none sm:max-w-[136px]"
        loading="lazy"
        src="https://picsum.photos/seed/peakui-card-car/272/272"
      />
      <div className="flex flex-1 flex-col gap-3">
        <Card.Header className="gap-1">
          <Card.Title>Golden edition</Card.Title>
          <Card.Description>
            Experience unmatched luxury and performance — sleek design meets pure driving thrill.
          </Card.Description>
        </Card.Header>
        <Card.Footer className="mt-auto flex w-full items-center justify-between">
          <div className="flex flex-col">
            <span className="text-sm font-medium">$36,799</span>
            <span className="text-xs text-muted">11 available</span>
          </div>
          <Button>Buy Now</Button>
        </Card.Footer>
      </div>
    </Card>
  );
}
