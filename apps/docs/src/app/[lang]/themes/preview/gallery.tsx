"use client";

import {
  Alert,
  Button,
  Card,
  Checkbox,
  Chip,
  Input,
  Kbd,
  Label,
  Link,
  Radio,
  RadioGroup,
  SegmentedControl,
  Separator,
  Skeleton,
  Slider,
  Spinner,
  Switch,
  Tabs,
  TextField,
  Tooltip,
} from "@peakui/react";

const VARIANTS = [
  "primary",
  "secondary",
  "tertiary",
  "danger",
  "danger-soft",
  "ghost",
  "outline",
] as const;

const SIZES = ["sm", "md"] as const;

function Section({
  children,
  className,
  title,
}: {
  children: React.ReactNode;
  className?: string;
  title: string;
}) {
  return (
    <section className={`flex flex-col gap-4 border-t border-separator pt-4 ${className ?? ""}`}>
      <h3 className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted">{title}</h3>
      {children}
    </section>
  );
}

/*
 * The sheet's thesis: the theme's own palette, painted from its live tokens — semantic colors
 * on the left, the neutral ramp on the right.
 */
function PaletteSection() {
  const semantic: [string, string][] = [
    ["Accent", "var(--accent)"],
    ["Success", "var(--success)"],
    ["Warning", "var(--warning)"],
    ["Danger", "var(--danger)"],
  ];
  const neutrals: [string, string][] = [
    ["Background", "var(--background)"],
    ["Surface", "var(--surface)"],
    ["Control", "var(--default)"],
    ["Border", "var(--border)"],
    ["Muted", "var(--muted)"],
    ["Foreground", "var(--foreground)"],
  ];

  const swatch = (name: string, color: string) => (
    <div key={name} className="flex flex-col items-start gap-1.5">
      <span
        aria-hidden="true"
        className="size-10 w-14 rounded-field border border-separator"
        style={{background: color}}
      />
      <span className="text-[10px] text-muted">{name}</span>
    </div>
  );

  return (
    <Section className="sm:col-span-2 xl:col-span-3" title="Palette">
      <div className="flex flex-wrap items-start gap-x-10 gap-y-4">
        <div className="flex flex-wrap items-start gap-4">
          {semantic.map(([n, c]) => swatch(n, c))}
        </div>
        <Separator className="hidden h-14 self-center sm:block" orientation="vertical" />
        <div className="flex flex-wrap items-start gap-4">
          {neutrals.map(([n, c]) => swatch(n, c))}
        </div>
      </div>
    </Section>
  );
}

function ButtonsSection() {
  return (
    <Section title="Buttons">
      {SIZES.map((size) => (
        <div key={size} className="flex items-center gap-2">
          <span className="w-6 shrink-0 text-[10px] text-muted">{size}</span>
          <div className="flex flex-wrap gap-2">
            {VARIANTS.map((variant) => (
              <Button key={variant} size={size} variant={variant}>
                {variant}
              </Button>
            ))}
          </div>
        </div>
      ))}
      <Tooltip delay={0}>
        <Button variant="outline">Hover me</Button>
        <Tooltip.Content showArrow>
          <Tooltip.Arrow />
          <p>Themed by the builder</p>
        </Tooltip.Content>
      </Tooltip>
    </Section>
  );
}

function ChipsSection() {
  return (
    <Section title="Chips & keys">
      <div className="flex flex-wrap items-center gap-2">
        {["New", "Beta", "Stable", "Deprecated", "Internal"].map((label) => (
          <Chip key={label}>{label}</Chip>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted">
        <span className="flex items-center gap-1.5">
          <Kbd>
            <Kbd.Abbr keyValue="command" />
            <Kbd.Content>K</Kbd.Content>
          </Kbd>
          Search
        </span>
        <span className="flex items-center gap-1.5">
          <Kbd>
            <Kbd.Abbr keyValue="command" />
            <Kbd.Content>E</Kbd.Content>
          </Kbd>
          Export
        </span>
        <span className="flex items-center gap-1.5">
          <Kbd>
            <Kbd.Abbr keyValue="command" />
            <Kbd.Content>P</Kbd.Content>
          </Kbd>
          Preview
        </span>
      </div>
    </Section>
  );
}

function InputsSection() {
  return (
    <Section title="Inputs">
      <TextField className="w-full">
        <Label>Email</Label>
        <Input placeholder="you@company.com" type="email" />
      </TextField>
      <TextField className="w-full">
        <Label>Project name</Label>
        <Input placeholder="Aurora" type="text" />
      </TextField>
      <TextField className="w-full">
        <Label>Workspace</Label>
        <Input placeholder="acme-inc" type="text" />
      </TextField>
    </Section>
  );
}

function SelectionSection() {
  return (
    <Section title="Selection">
      <Checkbox defaultSelected name="builder-updates">
        <Checkbox.Content>
          <Checkbox.Control>
            <Checkbox.Indicator />
          </Checkbox.Control>
          Product updates
        </Checkbox.Content>
      </Checkbox>
      <Checkbox defaultSelected name="builder-tips">
        <Checkbox.Content>
          <Checkbox.Control>
            <Checkbox.Indicator />
          </Checkbox.Control>
          Usage tips
        </Checkbox.Content>
      </Checkbox>
      <Separator />
      <RadioGroup defaultValue="weekly">
        <Label>Digest frequency</Label>
        {(["daily", "weekly", "monthly"] as const).map((value) => (
          <Radio key={value} value={value}>
            <Radio.Content>
              <Radio.Control>
                <Radio.Indicator />
              </Radio.Control>
              {value}
            </Radio.Content>
          </Radio>
        ))}
      </RadioGroup>
      <Separator />
      <Switch defaultSelected>
        <Switch.Content>
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
          Public profile
        </Switch.Content>
      </Switch>
      <Switch>
        <Switch.Content>
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
          Two-factor authentication
        </Switch.Content>
      </Switch>
    </Section>
  );
}

function ControlsSection() {
  return (
    <Section title="Controls">
      <Slider defaultValue={45}>
        <Label>Cache size</Label>
        <Slider.Output />
        <Slider.Track>
          <Slider.Fill />
          <Slider.Thumb />
        </Slider.Track>
      </Slider>
      <SegmentedControl aria-label="View" defaultSelectedKey="grid" size="md">
        <SegmentedControl.Item id="grid">Grid</SegmentedControl.Item>
        <SegmentedControl.Item id="list">List</SegmentedControl.Item>
        <SegmentedControl.Item id="table">Table</SegmentedControl.Item>
      </SegmentedControl>
    </Section>
  );
}

function TabsSection() {
  return (
    <Section title="Tabs">
      <Tabs defaultSelectedKey="overview">
        <Tabs.ListContainer>
          <Tabs.List aria-label="Sections">
            {(["overview", "activity", "settings"] as const).map((id) => (
              <Tabs.Tab key={id} id={id}>
                {id}
                <Tabs.Indicator />
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs.ListContainer>
      </Tabs>
    </Section>
  );
}

function AlertsSection() {
  return (
    <Section title="Feedback">
      <Alert>
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>Deploy scheduled</Alert.Title>
          <Alert.Description>
            The release window opens in 20 minutes. All checks passed.
          </Alert.Description>
        </Alert.Content>
      </Alert>
      <div className="flex items-center gap-4">
        <span className="w-24 text-[10px] uppercase tracking-[0.12em] text-muted">
          Loading state
        </span>
        <Spinner aria-label="Loading" />
        <div className="w-40">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="mt-2 h-4 w-1/2" />
        </div>
      </div>
    </Section>
  );
}

function LoginSection() {
  return (
    <Section className="sm:col-span-2 xl:col-span-2" title="Sign in">
      <Card className="w-full">
        <Card.Header>
          <Card.Title>Welcome back</Card.Title>
          <Card.Description>Sign in to continue to your workspace.</Card.Description>
        </Card.Header>
        <div className="flex flex-col gap-4 px-6">
          <TextField className="w-full">
            <Label>Email</Label>
            <Input placeholder="you@company.com" type="email" />
          </TextField>
          <TextField className="w-full">
            <Label>Password</Label>
            <Input placeholder="Password" type="password" />
          </TextField>
        </div>
        <Card.Footer>
          <Button variant="primary">Sign in</Button>
          <Link href="#reset">Forgot password?</Link>
        </Card.Footer>
      </Card>
    </Section>
  );
}

/** A live gallery of core components; every section is themed by the preview container's CSS. */
export function PreviewGallery() {
  return (
    <div className="grid items-start gap-x-8 gap-y-10 p-8 sm:grid-cols-2 xl:grid-cols-3">
      <PaletteSection />
      <LoginSection />
      <ButtonsSection />
      <SelectionSection />
      <InputsSection />
      <ControlsSection />
      <AlertsSection />
      <ChipsSection />
      <TabsSection />
    </div>
  );
}
