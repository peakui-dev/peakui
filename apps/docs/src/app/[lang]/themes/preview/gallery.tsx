"use client";

import type {ReactNode} from "react";

import {Heart, Pin, Star} from "@gravity-ui/icons";
import {
  Alert,
  Breadcrumbs,
  Button,
  Card,
  Checkbox,
  Chip,
  Disclosure,
  Dropdown,
  Input,
  Kbd,
  Label,
  Link,
  NumberField,
  Radio,
  RadioGroup,
  SearchField,
  SegmentedControl,
  Separator,
  Skeleton,
  Slider,
  Spinner,
  Switch,
  Tabs,
  TextArea,
  TextField,
  ToggleButton,
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
  children: ReactNode;
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
        className="h-10 w-14 rounded-field border border-separator"
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

function LoginSection() {
  return (
    <Section title="Sign in">
      <Card className="w-full">
        <Card.Header>
          <Card.Title>Welcome back</Card.Title>
          <Card.Description>Sign in to continue to your workspace.</Card.Description>
        </Card.Header>
        <div className="flex flex-col gap-4 px-6 pb-2">
          <TextField className="w-full">
            <Label>Email</Label>
            <Input placeholder="you@company.com" type="email" />
          </TextField>
          <TextField className="w-full">
            <Label>Password</Label>
            <Input placeholder="At least 8 characters" type="password" />
          </TextField>
          <div className="flex items-center justify-between">
            <Checkbox name="keep-signed-in">
              <Checkbox.Content>
                <Checkbox.Control>
                  <Checkbox.Indicator />
                </Checkbox.Control>
                Keep me signed in
              </Checkbox.Content>
            </Checkbox>
            <Link className="text-xs" href="#reset">
              Forgot password?
            </Link>
          </div>
        </div>
        <Card.Footer className="flex flex-col items-stretch gap-3">
          <Button className="w-full" variant="primary">
            Sign in
          </Button>
          <p className="text-center text-xs text-muted">
            No account yet? <Link href="#signup">Create one</Link>
          </p>
        </Card.Footer>
      </Card>
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
      <div className="flex flex-wrap gap-2">
        <ToggleButton>
          <Heart />
          Like
        </ToggleButton>
        <ToggleButton defaultSelected>
          <Star />
          Starred
        </ToggleButton>
        <ToggleButton variant="ghost">
          <Pin />
          Pinned
        </ToggleButton>
      </div>
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

function TextFieldsSection() {
  return (
    <Section title="Text fields">
      <TextField className="w-full">
        <Label>Email</Label>
        <Input placeholder="you@company.com" type="email" />
      </TextField>
      <SearchField className="w-full" name="search">
        <Label>Search</Label>
        <SearchField.Group>
          <SearchField.SearchIcon />
          <SearchField.Input placeholder="Search components…" />
          <SearchField.ClearButton />
        </SearchField.Group>
      </SearchField>
      <NumberField defaultValue={24} minValue={0} name="cache">
        <Label>Cache, MB</Label>
        <NumberField.Group>
          <NumberField.DecrementButton />
          <NumberField.Input className="w-full" />
          <NumberField.IncrementButton />
        </NumberField.Group>
      </NumberField>
      <TextArea aria-label="Notes" className="w-full" placeholder="Notes for the team…" />
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

function MenusSection() {
  return (
    <Section title="Menus">
      <Dropdown>
        <Button variant="secondary">Actions</Button>
        <Dropdown.Popover>
          <Dropdown.Menu onAction={() => undefined}>
            <Dropdown.Section>
              <Dropdown.Item id="new" textValue="New file">
                <Label>New file</Label>
              </Dropdown.Item>
              <Dropdown.Item id="copy" textValue="Copy link">
                <Label>Copy link</Label>
              </Dropdown.Item>
              <Dropdown.Item id="delete" textValue="Delete">
                <Label>Delete</Label>
              </Dropdown.Item>
            </Dropdown.Section>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
      <Disclosure defaultExpanded>
        <Disclosure.Heading>
          <Button slot="trigger" variant="outline">
            Search options
            <Disclosure.Indicator />
          </Button>
        </Disclosure.Heading>
        <Disclosure.Content>
          <Disclosure.Body className="rounded-2xl bg-surface p-4 text-sm text-muted">
            Case sensitivity, whole words, regular expressions — all of it themed.
          </Disclosure.Body>
        </Disclosure.Content>
      </Disclosure>
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
      <SegmentedControl aria-label="Density" defaultSelectedKey="cozy" size="md">
        <SegmentedControl.Item id="compact">Compact</SegmentedControl.Item>
        <SegmentedControl.Item id="cozy">Cozy</SegmentedControl.Item>
        <SegmentedControl.Item id="comfortable">Comfortable</SegmentedControl.Item>
      </SegmentedControl>
    </Section>
  );
}

function FeedbackSection() {
  return (
    <Section title="Status & feedback">
      <Alert>
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>Deploy scheduled</Alert.Title>
          <Alert.Description>
            The release window opens in 20 minutes. All checks passed.
          </Alert.Description>
        </Alert.Content>
      </Alert>
      <div className="flex flex-wrap items-center gap-2">
        {["New", "Beta", "Stable", "Deprecated"].map((label) => (
          <Chip key={label}>{label}</Chip>
        ))}
      </div>
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

function NavigationSection() {
  return (
    <Section title="Navigation">
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
      <Breadcrumbs>
        <Breadcrumbs.Item href="#">Home</Breadcrumbs.Item>
        <Breadcrumbs.Item href="#">Components</Breadcrumbs.Item>
        <Breadcrumbs.Item>Theme Builder</Breadcrumbs.Item>
      </Breadcrumbs>
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

/** A live gallery of core components; the whole page is themed by the mounted theme. */
export function PreviewGallery() {
  return (
    <div className="grid items-start gap-x-8 gap-y-10 p-8 sm:grid-cols-2 xl:grid-cols-3">
      <PaletteSection />
      <LoginSection />
      <ButtonsSection />
      <TextFieldsSection />
      <SelectionSection />
      <MenusSection />
      <ControlsSection />
      <FeedbackSection />
      <NavigationSection />
    </div>
  );
}
