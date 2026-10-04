import {Card} from "@peakui/react";

export function Variants() {
  return (
    <div className="flex flex-col gap-4">
      <Card className="w-[320px]" variant="transparent">
        <Card.Header>
          <Card.Title>Transparent</Card.Title>
          <Card.Description>No background of its own, for nested cards</Card.Description>
        </Card.Header>
      </Card>
      <Card className="w-[320px]">
        <Card.Header>
          <Card.Title>Default</Card.Title>
          <Card.Description>Standard card appearance (bg-surface)</Card.Description>
        </Card.Header>
      </Card>
      <Card className="w-[320px]" variant="secondary">
        <Card.Header>
          <Card.Title>Secondary</Card.Title>
          <Card.Description>Medium prominence (bg-surface-secondary)</Card.Description>
        </Card.Header>
      </Card>
      <Card className="w-[320px]" variant="tertiary">
        <Card.Header>
          <Card.Title>Tertiary</Card.Title>
          <Card.Description>Higher prominence (bg-surface-tertiary)</Card.Description>
        </Card.Header>
      </Card>
    </div>
  );
}
