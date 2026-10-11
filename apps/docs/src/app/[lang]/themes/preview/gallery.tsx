"use client";

import {
  Alert,
  Button,
  Card,
  Checkbox,
  Chip,
  Input,
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

function Section({children, title}: {children: React.ReactNode; title: string}) {
  return (
    <section className="flex flex-col gap-4 border border-border p-5">
      <h3 className="text-xs font-medium text-muted">{title}</h3>
      {children}
    </section>
  );
}

function ButtonsSection() {
  return (
    <Section title="Buttons">
      {SIZES.map((size) => (
        <div key={size} className="flex flex-wrap gap-2">
          {VARIANTS.map((variant) => (
            <Button key={variant} size={size} variant={variant}>
              {variant}
            </Button>
          ))}
        </div>
      ))}
    </Section>
  );
}

function ChipsSection() {
  return (
    <Section title="Chips">
      <div className="flex flex-wrap gap-2">
        {["New", "Beta", "Stable", "Deprecated", "Internal"].map((label) => (
          <Chip key={label}>{label}</Chip>
        ))}
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
    <Section title="Sign in">
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
            <Input placeholder="••••••••" type="password" />
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

function TooltipSection() {
  return (
    <Section title="Overlay">
      <Tooltip delay={0}>
        <Button variant="secondary">Hover me</Button>
        <Tooltip.Content showArrow>
          <Tooltip.Arrow />
          <p>Themed by the builder</p>
        </Tooltip.Content>
      </Tooltip>
    </Section>
  );
}

/** A live gallery of core components; every section is themed by the preview container's CSS. */
export function PreviewGallery() {
  return (
    <div className="grid items-start gap-6 p-6 sm:grid-cols-2 xl:grid-cols-3">
      <ButtonsSection />
      <ChipsSection />
      <InputsSection />
      <SelectionSection />
      <ControlsSection />
      <TabsSection />
      <AlertsSection />
      <LoginSection />
      <TooltipSection />
    </div>
  );
}
