import {Button, Card, CloseButton} from "@peakui/react";

export function Gallery() {
  return (
    <div className="flex w-full flex-col gap-4 sm:max-w-md">
      <Card className="flex items-stretch sm:flex-row">
        <img
          alt="Cherries"
          className="pointer-events-none h-24 w-24 rounded-2xl object-cover select-none"
          loading="lazy"
          src="https://picsum.photos/seed/peakui-card-cherries/240/240"
        />
        <div className="flex flex-1 flex-col gap-2 ps-4">
          <Card.Header className="gap-1">
            <Card.Title className="pe-8">Become an ACME Creator!</Card.Title>
            <Card.Description>Only 10 spots — submission ends Oct 10.</Card.Description>
            <CloseButton aria-label="Close banner" className="absolute end-3 top-3" />
          </Card.Header>
          <Card.Footer className="mt-auto">
            <Button size="sm" variant="secondary">
              Apply Now
            </Button>
          </Card.Footer>
        </div>
      </Card>
      <Card className="relative min-h-[160px] overflow-hidden rounded-3xl">
        <img
          alt="Home robot"
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
          src="https://picsum.photos/seed/peakui-card-neo2/480/480"
        />
        <Card.Footer className="mt-auto">
          <div>
            <div className="text-sm font-medium">Available soon</div>
            <div className="text-xs text-muted">Get notified</div>
          </div>
        </Card.Footer>
      </Card>
      <Card className="flex flex-row gap-3 p-1" variant="transparent">
        <img
          alt="Futuristic robot"
          className="aspect-square h-16 w-16 shrink-0 rounded-xl object-cover select-none"
          loading="lazy"
          src="https://picsum.photos/seed/peakui-card-robot/160/160"
        />
        <div className="flex flex-1 flex-col justify-center gap-1">
          <Card.Title className="text-sm">Bridging the Future</Card.Title>
          <Card.Description className="text-xs">Today, 6:30 PM</Card.Description>
        </div>
      </Card>
    </div>
  );
}
