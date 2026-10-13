"use client";

import type {ReactNode} from "react";

import {Heart, Pin, Star} from "@gravity-ui/icons";
import {
  Alert,
  Breadcrumbs,
  Button,
  Checkbox,
  Chip,
  Description,
  Disclosure,
  Dropdown,
  FieldError,
  Input,
  Kbd,
  Label,
  ListBox,
  NumberField,
  Radio,
  RadioGroup,
  SearchField,
  SegmentedControl,
  Skeleton,
  Slider,
  Spinner,
  Switch,
  Tabs,
  Tag,
  TagGroup,
  TextArea,
  TextField,
  ToggleButton,
  Tooltip,
} from "@peakui/react";

import {WorkspaceCard} from "@/components/demo/workspace-card";

/*
 * The tokens beside the accent, each under its own name — the one a developer writes — and
 * painted with the foreground the engine pairs it with. The accent's soft tint leads its row
 * at triple width; the status colours follow, then the neutral ramp from page to text.
 */
const TOKENS: [token: string, className: string][] = [
  ["accent-soft", "bg-accent-soft text-accent-soft-foreground"],
  ["success", "bg-success text-success-foreground"],
  ["warning", "bg-warning text-warning-foreground"],
  ["danger", "bg-danger text-danger-foreground"],
  ["background", "bg-background text-foreground"],
  ["surface", "bg-surface text-surface-foreground"],
  ["default", "bg-default text-default-foreground"],
  ["border", "bg-border text-foreground"],
  ["muted", "bg-muted text-background"],
  ["foreground", "bg-foreground text-background"],
];

const VARIANTS = [
  ["primary", "Primary", "Save"],
  ["secondary", "Secondary", "Duplicate"],
  ["tertiary", "Tertiary", "Cancel"],
  ["outline", "Outline", "Preview"],
  ["ghost", "Ghost", "Skip"],
  ["danger", "Danger", "Delete"],
  ["danger-soft", "Danger soft", "Remove"],
] as const;

/*
 * The columns give way from the right: the cell hides the disabled state first, then the large
 * size, once the matrix no longer fits.
 */
const SIZES = [
  ["sm", "Small", "col-start-2"],
  ["md", "Medium", "col-start-3"],
  ["lg", "Large", "col-start-4 @max-md/cell:hidden"],
] as const;

const DISABLED_COLUMN = "col-start-5 @max-[32rem]/cell:hidden";

/*
 * One cell of the ruled sheet. The sheet draws its rules with a 1px gap over the separator
 * colour, so a cell only has to paint the page background.
 */
function Cell({
  children,
  className,
  title,
}: {
  children: ReactNode;
  className?: string;
  title: string;
}) {
  return (
    <section
      className={`@container/cell flex flex-col gap-5 bg-background p-5 @3xl:p-7 ${className ?? ""}`}
    >
      <h3 className="text-xs font-medium text-muted">{title}</h3>
      {children}
    </section>
  );
}

/*
 * The page's thesis, on one plate: the theme's name set large on its own accent — the one
 * colour the visitor picks — with the tokens derived from it alongside. The name is read in
 * `accent-foreground`, so the plate is also the first proof of the contrast guarantee.
 */
function Specimen({accent, name}: {accent: string; name: string}) {
  return (
    <header className="grid gap-px overflow-hidden rounded-2xl border border-separator bg-separator @5xl:grid-cols-2">
      <div className="flex min-h-56 flex-col justify-between gap-10 bg-accent p-5 text-accent-foreground @3xl:p-7">
        <div className="flex items-baseline justify-between gap-4 text-xs font-medium">
          <span>accent</span>
          <span className="truncate font-mono">{accent}</span>
        </div>
        <div className="flex flex-col gap-4">
          <h2
            aria-live="polite"
            className="text-[clamp(3rem,10cqi,5.5rem)] leading-[0.9] font-semibold tracking-[-0.045em]"
          >
            {name}
          </h2>
          <p className="max-w-[40ch] text-sm leading-snug">
            Every component on this page is drawn from this theme. Tune it, and they follow.
          </p>
        </div>
      </div>
      <ul className="grid auto-rows-fr grid-cols-3 gap-px @xl:grid-cols-6">
        {TOKENS.map(([token, className], index) => (
          <li key={token} className={`bg-surface ${index === 0 ? "col-span-3" : ""}`}>
            <div className={`h-full min-h-[4.5rem] p-3 text-xs font-medium ${className}`}>
              {token}
            </div>
          </li>
        ))}
      </ul>
    </header>
  );
}

/*
 * The one composed scene: a card inset in its cell, its corners running alongside the sheet's
 * own. The card itself is the site's shared scene, the same one the home page themes.
 */
function WorkspaceCell({className}: {className: string}) {
  return (
    <section
      aria-label="A form on a surface"
      className={`flex bg-background p-3 @3xl:p-4 ${className}`}
    >
      <WorkspaceCard />
    </section>
  );
}

function ButtonsCell({className}: {className: string}) {
  return (
    <Cell className={className} title="Buttons">
      <div className="grid grid-cols-[auto_repeat(4,max-content)] items-center justify-start gap-x-4 gap-y-3">
        {/* Holds the corner, so auto-placement starts the first variant on the second row. */}
        <span className="col-start-1 row-start-1" />
        {SIZES.map(([size, label, column]) => (
          <span key={size} className={`row-start-1 text-xs text-muted ${column}`}>
            {label}
          </span>
        ))}
        <span className={`row-start-1 text-xs text-muted ${DISABLED_COLUMN}`}>Disabled</span>
        {VARIANTS.map(([variant, name, action]) => (
          <div key={variant} className="contents">
            <span className="col-start-1 pe-2 text-xs text-muted">{name}</span>
            {SIZES.map(([size, , column]) => (
              <Button key={size} className={`w-fit ${column}`} size={size} variant={variant}>
                {action}
              </Button>
            ))}
            <Button isDisabled className={`w-fit ${DISABLED_COLUMN}`} variant={variant}>
              {action}
            </Button>
          </div>
        ))}
      </div>
    </Cell>
  );
}

function FieldsCell({className}: {className: string}) {
  return (
    <Cell className={className} title="Fields">
      <TextField isInvalid className="w-full" defaultValue="sam@acme">
        <Label>Email</Label>
        <Input type="email" />
        <FieldError>Add the domain ending, like .com.</FieldError>
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
    </Cell>
  );
}

function SelectionCell({className}: {className: string}) {
  return (
    <Cell className={className} title="Selection">
      <div className="flex flex-col gap-3">
        <Checkbox defaultSelected name="builder-updates">
          <Checkbox.Content>
            <Checkbox.Control>
              <Checkbox.Indicator />
            </Checkbox.Control>
            Product updates
          </Checkbox.Content>
        </Checkbox>
        <Checkbox name="builder-tips">
          <Checkbox.Content>
            <Checkbox.Control>
              <Checkbox.Indicator />
            </Checkbox.Control>
            Usage tips
          </Checkbox.Content>
        </Checkbox>
      </div>
      <RadioGroup defaultValue="weekly">
        <Label>Digest frequency</Label>
        {(["Daily", "Weekly", "Monthly"] as const).map((value) => (
          <Radio key={value} value={value.toLowerCase()}>
            <Radio.Content>
              <Radio.Control>
                <Radio.Indicator />
              </Radio.Control>
              {value}
            </Radio.Content>
          </Radio>
        ))}
      </RadioGroup>
      <div className="flex flex-col gap-3">
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
      </div>
    </Cell>
  );
}

function TogglesCell({className}: {className: string}) {
  return (
    <Cell className={className} title="Sliders and toggles">
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
      <div className="flex flex-wrap gap-2">
        <ToggleButton>
          <Heart />
          Like
        </ToggleButton>
        <ToggleButton defaultSelected>
          <Star />
          Star
        </ToggleButton>
        <ToggleButton variant="ghost">
          <Pin />
          Pin
        </ToggleButton>
      </div>
      <TagGroup aria-label="Topics" defaultSelectedKeys={["design"]} selectionMode="multiple">
        <TagGroup.List>
          <Tag id="design">Design</Tag>
          <Tag id="engineering">Engineering</Tag>
          <Tag id="research">Research</Tag>
        </TagGroup.List>
      </TagGroup>
    </Cell>
  );
}

function FeedbackCell({className}: {className: string}) {
  return (
    <Cell className={className} title="Feedback">
      <Alert status="accent">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>Deploy scheduled</Alert.Title>
          <Alert.Description>
            The release window opens in 20 minutes. All checks passed.
          </Alert.Description>
        </Alert.Content>
      </Alert>
      <Alert status="success">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>Backup complete</Alert.Title>
          <Alert.Description>2.4 GB saved to the Frankfurt region.</Alert.Description>
        </Alert.Content>
      </Alert>
      <Alert status="danger">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>Payment failed</Alert.Title>
          <Alert.Description>
            The card ending in 4242 was declined. Update it to keep the plan.
          </Alert.Description>
        </Alert.Content>
      </Alert>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Chip color="accent" variant="soft">
            New
          </Chip>
          <Chip color="success" variant="soft">
            Stable
          </Chip>
          <Chip color="warning" variant="soft">
            Beta
          </Chip>
          <Chip color="danger" variant="soft">
            Deprecated
          </Chip>
          <Chip>Draft</Chip>
        </div>
        <div className="flex items-center gap-3">
          <Spinner aria-label="Loading" />
          <div className="w-32">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="mt-2 h-3 w-2/3" />
          </div>
        </div>
      </div>
    </Cell>
  );
}

function NavigationCell({className}: {className: string}) {
  return (
    <Cell className={className} title="Navigation and menus">
      <Tabs defaultSelectedKey="overview">
        <Tabs.ListContainer>
          <Tabs.List aria-label="Sections">
            {(["Overview", "Activity", "Settings"] as const).map((label) => (
              <Tabs.Tab key={label} id={label.toLowerCase()}>
                {label}
                <Tabs.Indicator />
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs.ListContainer>
      </Tabs>
      <Breadcrumbs>
        <Breadcrumbs.Item href="#">Home</Breadcrumbs.Item>
        <Breadcrumbs.Item href="#">Components</Breadcrumbs.Item>
        <Breadcrumbs.Item>Theme builder</Breadcrumbs.Item>
      </Breadcrumbs>
      {/* A menu held open, so the overlay surface is on the sheet without a click. */}
      <div className="w-full max-w-64 rounded-2xl bg-overlay p-1 shadow-overlay">
        <ListBox aria-label="File actions" defaultSelectedKeys={["copy"]} selectionMode="single">
          <ListBox.Item id="new" textValue="New file">
            <div className="flex flex-col">
              <Label>New file</Label>
              <Description>Start from a blank page</Description>
            </div>
            <ListBox.ItemIndicator />
          </ListBox.Item>
          <ListBox.Item id="copy" textValue="Copy link">
            <div className="flex flex-col">
              <Label>Copy link</Label>
              <Description>Anyone with it can view</Description>
            </div>
            <ListBox.ItemIndicator />
          </ListBox.Item>
          <ListBox.Item id="archive" textValue="Archive">
            <div className="flex flex-col">
              <Label>Archive</Label>
              <Description>Hide it from the team</Description>
            </div>
            <ListBox.ItemIndicator />
          </ListBox.Item>
        </ListBox>
      </div>
      <div className="flex flex-wrap items-start gap-2">
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
        <Tooltip delay={0}>
          <Button variant="outline">Hover me</Button>
          <Tooltip.Content showArrow>
            <Tooltip.Arrow />
            <p>Themed by the builder</p>
          </Tooltip.Content>
        </Tooltip>
        <Disclosure>
          <Disclosure.Heading>
            <Button slot="trigger" variant="outline">
              Search options
              <Disclosure.Indicator />
            </Button>
          </Disclosure.Heading>
          <Disclosure.Content>
            <Disclosure.Body className="mt-2 rounded-2xl bg-surface p-4 text-sm text-muted">
              Case sensitivity, whole words and regular expressions.
            </Disclosure.Body>
          </Disclosure.Content>
        </Disclosure>
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
      </div>
    </Cell>
  );
}

/**
 * A live specimen of the theme: its name and palette, then the core components on one ruled
 * sheet. The whole page is themed by the mounted theme; the columns follow the canvas width,
 * not the viewport, because the inspector takes its share of the screen.
 */
export function PreviewGallery({accent, name}: {accent: string; name: string}) {
  return (
    <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-3 p-3">
      <Specimen accent={accent} name={name} />
      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-separator bg-separator @3xl:grid-cols-6 @5xl:grid-cols-12">
        <WorkspaceCell className="@3xl:col-span-3 @5xl:col-span-5" />
        <ButtonsCell className="@3xl:col-span-3 @5xl:col-span-7" />
        <FieldsCell className="@3xl:col-span-3 @5xl:col-span-4" />
        <SelectionCell className="@3xl:col-span-3 @5xl:col-span-4" />
        <TogglesCell className="@3xl:col-span-3 @5xl:col-span-4" />
        <FeedbackCell className="@3xl:col-span-3 @5xl:col-span-7" />
        <NavigationCell className="@3xl:col-span-6 @5xl:col-span-5" />
      </div>
    </div>
  );
}
