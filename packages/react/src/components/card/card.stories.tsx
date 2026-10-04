import type {Meta, StoryObj} from "@storybook/react-vite";
import type {FormEvent, ReactNode} from "react";

import {Button} from "../button/index.ts";
import {CloseButton} from "../close-button/index.ts";
import {Input} from "../input/index.ts";
import {Label} from "../label/index.ts";
import {Link} from "../link/index.ts";
import {TextField} from "../textfield/index.ts";

import {Card} from "./index.ts";

/*
 * Every story carries a level-two heading: the audit in apps/storybook/e2e waits for it as the
 * sign that the preview is ready, and without it axe runs against an empty iframe and passes.
 */
const Showcase = ({children, title}: {children: ReactNode; title: string}) => (
  <div className="flex flex-col gap-4 bg-background p-6">
    <h2 className="text-sm font-medium text-foreground">{title}</h2>
    {children}
  </div>
);

const meta = {
  argTypes: {
    variant: {
      control: {type: "select"},
      options: ["transparent", "default", "secondary", "tertiary"],
    },
  },
  component: Card,
  parameters: {
    layout: "padded",
  },
  title: "Components/Card",
} satisfies Meta<typeof Card>;

export default meta;

/*
 * Card's root takes required children, and strict CSF typing then demands `args` on every
 * render-only story. `children: null` satisfies the requirement; each story's `render` composes
 * its own content.
 */
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {children: null},
  name: "По умолчанию",
  render: () => (
    <Showcase title="По умолчанию">
      <Card className="w-[400px]">
        <Card.Header>
          <Card.Title>Become an Acme Creator!</Card.Title>
          <Card.Description>
            Visit the Acme Creator Hub to sign up today and start earning credits from your fans and
            followers.
          </Card.Description>
        </Card.Header>
        <Card.Footer>
          <Link
            aria-label="Go to Acme Creator Hub (opens in new tab)"
            href="https://example.com"
            rel="noopener noreferrer"
            target="_blank"
          >
            Creator Hub
            <Link.Icon aria-hidden="true" />
          </Link>
        </Card.Footer>
      </Card>
    </Showcase>
  ),
};

export const Variants: Story = {
  args: {children: null},
  name: "Варианты",
  render: () => (
    <Showcase title="Варианты">
      <div className="flex flex-col gap-4">
        <Card className="w-[320px]" variant="transparent">
          <Card.Header>
            <Card.Title>Transparent</Card.Title>
            <Card.Description>Minimal prominence with transparent background</Card.Description>
          </Card.Header>
          <Card.Content>
            <p>Use for less important content or nested cards</p>
          </Card.Content>
        </Card>

        <Card className="w-[320px]" variant="default">
          <Card.Header>
            <Card.Title>Default</Card.Title>
            <Card.Description>Standard card appearance (bg-surface)</Card.Description>
          </Card.Header>
          <Card.Content>
            <p>The default card variant for most use cases</p>
          </Card.Content>
        </Card>

        <Card className="w-[320px]" variant="secondary">
          <Card.Header>
            <Card.Title>Secondary</Card.Title>
            <Card.Description>Medium prominence (bg-surface-secondary)</Card.Description>
          </Card.Header>
          <Card.Content>
            <p>Use to draw moderate attention</p>
          </Card.Content>
        </Card>

        <Card className="w-[320px]" variant="tertiary">
          <Card.Header>
            <Card.Title>Tertiary</Card.Title>
            <Card.Description>Higher prominence (bg-surface-tertiary)</Card.Description>
          </Card.Header>
          <Card.Content>
            <p>Use for primary or featured content</p>
          </Card.Content>
        </Card>
      </div>
    </Showcase>
  ),
};

export const Horizontal: Story = {
  args: {children: null},
  name: "Горизонтальная",
  render: () => (
    <Showcase title="Горизонтальная">
      <Card className="w-full items-stretch md:flex-row">
        <img
          alt="Porsche 911 Golden Edition"
          className="pointer-events-none aspect-square w-full rounded-3xl object-cover select-none md:max-w-[136px]"
          loading="lazy"
          src="https://picsum.photos/seed/peakui-card-car/272/272"
        />
        <div className="flex flex-1 flex-col gap-3">
          <Card.Header className="gap-1">
            <Card.Title>Get the new Porsche 911 golden edition</Card.Title>
            <Card.Description>
              Experience unmatched luxury and performance with the Porsche 911 Golden Edition—where
              sleek design meets cutting-edge tech and pure driving thrill.
            </Card.Description>
          </Card.Header>
          <Card.Footer className="mt-auto flex w-full flex-row items-center justify-between">
            <div className="flex flex-col">
              <span
                aria-label="Price: 36,799 US dollars"
                className="text-sm font-medium text-foreground"
              >
                $36,799
              </span>
              <span aria-label="Available stock: 11 units" className="text-xs text-muted">
                11 available
              </span>
            </div>
            <Button>Buy Now</Button>
          </Card.Footer>
        </div>
      </Card>
    </Showcase>
  ),
};

/*
 * The reference composes the community cards with Avatar; that primitive is not ported yet, so
 * the avatars are plain rounded images here.
 */
export const Compact: Story = {
  args: {children: null},
  name: "Компактные",
  render: () => (
    <Showcase title="Компактные">
      <div className="flex gap-4">
        <Card className="w-[200px] gap-2">
          <img
            alt="Indie Hackers community"
            className="pointer-events-none aspect-square w-14 rounded-2xl object-cover select-none"
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
            className="pointer-events-none aspect-square w-14 rounded-2xl object-cover select-none"
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
    </Showcase>
  ),
};

/*
 * The reference grid showcase: a featured card with a dismiss control, notification and
 * community cards, an image hero and a stack of transparent rows. Avatars are plain rounded
 * images (no Avatar primitive yet); the leading glyph is dropped for the same reason.
 */
export const Gallery: Story = {
  args: {children: null},
  name: "Сетка карточек",
  render: () => (
    <Showcase title="Сетка карточек">
      <div className="flex w-full items-center justify-center">
        <div className="grid w-full max-w-2xl grid-cols-12 gap-4 p-4">
          {/* Row 1: Large Product Card - Available Soon */}
          <Card className="col-span-12 flex h-auto min-h-[152px] flex-col sm:flex-row">
            <div className="relative h-[140px] w-full shrink-0 overflow-hidden rounded-2xl sm:h-[120px] sm:w-[120px]">
              <img
                alt="Cherries"
                className="pointer-events-none absolute inset-0 h-full w-full scale-125 object-cover select-none"
                loading="lazy"
                src="https://picsum.photos/seed/peakui-card-cherries/240/240"
              />
            </div>
            <div className="flex flex-1 flex-col gap-3">
              <Card.Header className="gap-1">
                <Card.Title className="pe-8">Become an ACME Creator!</Card.Title>
                <Card.Description>
                  Lorem ipsum dolor sit amet consectetur. Sed arcu donec id aliquam dolor sed amet
                  faucibus etiam.
                </Card.Description>
                <CloseButton aria-label="Close banner" className="absolute end-3 top-3" />
              </Card.Header>
              <Card.Footer className="mt-auto flex w-full flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">Only 10 spots</span>
                  <span className="text-xs text-muted">Submission ends Oct 10.</span>
                </div>
                <Button className="w-full sm:w-auto">Apply Now</Button>
              </Card.Footer>
            </div>
          </Card>

          {/* Row 2 */}
          <div className="col-span-12 grid grid-cols-12 gap-4">
            {/* Left Column */}
            <div className="col-span-12 grid grid-cols-12 gap-4 lg:col-span-6">
              {/* Top Card */}
              <Card className="col-span-12">
                <div className="absolute end-3 top-3 z-10">
                  <CloseButton aria-label="Close notification" />
                </div>
                <Card.Header className="gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-muted uppercase">PAYMENT</span>
                    <Card.Title className="pe-8 text-sm sm:text-base">
                      You can now withdraw on crypto
                    </Card.Title>
                    <Card.Description className="text-xs sm:text-sm">
                      Add your wallet in settings to withdraw
                    </Card.Description>
                  </div>
                </Card.Header>
                <Card.Footer>
                  <Link aria-label="Go to settings" href="#" rel="noopener noreferrer">
                    Go to settings
                    <Link.Icon aria-hidden="true" />
                  </Link>
                </Card.Footer>
              </Card>
              {/* Bottom cards */}
              <div className="col-span-12 grid grid-cols-12 gap-4">
                {/* Left Card */}
                <Card className="col-span-12 gap-2 sm:col-span-6">
                  <Card.Header>
                    <img
                      alt="Indie Hackers community"
                      className="size-[56px] rounded-xl object-cover"
                      loading="lazy"
                      src="https://picsum.photos/seed/peakui-card-indie/112/112"
                    />
                  </Card.Header>
                  <Card.Content className="mt-1">
                    <p className="text-sm leading-4 font-medium">Indie Hackers</p>
                    <p className="text-xs text-muted">148 members</p>
                  </Card.Content>
                  <Card.Footer className="flex items-center gap-2">
                    <img
                      alt="John's avatar"
                      className="size-4 rounded-full object-cover"
                      loading="lazy"
                      src="https://picsum.photos/seed/peakui-card-john/40/40"
                    />
                    <p className="text-xs text-muted">By John</p>
                  </Card.Footer>
                </Card>
                {/* Right Card */}
                <Card className="col-span-12 gap-2 sm:col-span-6">
                  <Card.Header>
                    <img
                      alt="AI Builders community"
                      className="size-[56px] rounded-xl object-cover"
                      loading="lazy"
                      src="https://picsum.photos/seed/peakui-card-ai/112/112"
                    />
                  </Card.Header>
                  <Card.Content className="mt-1">
                    <p className="text-sm leading-4 font-medium">AI Builders</p>
                    <p className="text-xs text-muted">362 members</p>
                  </Card.Content>
                  <Card.Footer className="flex items-center gap-2">
                    <img
                      alt="Martha's avatar"
                      className="size-4 rounded-full object-cover"
                      loading="lazy"
                      src="https://picsum.photos/seed/peakui-card-martha/40/40"
                    />
                    <p className="text-xs text-muted">By Martha</p>
                  </Card.Footer>
                </Card>
              </div>
            </div>
            {/* Right Column */}
            <Card className="col-span-12 min-h-[200px] rounded-3xl lg:col-span-6">
              {/* Background image */}
              <img
                alt="NEO Home Robot"
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover"
                src="https://picsum.photos/seed/peakui-card-neo2/480/480"
              />

              {/* Header */}
              <Card.Header className="z-10 text-white">
                <Card.Title className="text-xs font-semibold tracking-wide text-black/70">
                  NEO
                </Card.Title>
                <Card.Description className="text-sm leading-5 font-medium text-black/50">
                  Home Robot
                </Card.Description>
              </Card.Header>

              {/* Bottom gradient blur overlay */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute start-0 end-0 bottom-0 h-[64px]"
              >
                <div
                  className="absolute inset-0 h-[100%] rounded-b-[inherit] backdrop-blur-sm"
                  style={{
                    WebkitMaskImage: "linear-gradient(to top, black 30%, transparent)",
                    maskImage: "linear-gradient(to top, black 30%, transparent)",
                    maskRepeat: "no-repeat",
                    maskSize: "100% 100%",
                  }}
                />
              </div>
              {/* Footer */}
              <Card.Footer className="z-10 mt-auto flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-black">Available soon</div>
                  <div className="text-xs text-black/60">Get notified</div>
                </div>
                <Button className="bg-white text-black" size="sm" variant="tertiary">
                  Notify me
                </Button>
              </Card.Footer>
            </Card>
          </div>

          {/* Row 3 */}
          <div className="col-span-12 grid grid-cols-12 gap-4">
            {/* Left Column: Card */}
            <Card className="relative col-span-12 h-[250px] sm:h-[300px] md:col-span-8 md:h-[350px]">
              <img
                alt="NEO Home Robot"
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover"
                src="https://picsum.photos/seed/peakui-card-neo1/640/480"
              />

              {/* Bottom gradient blur overlay */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute start-0 end-0 bottom-0 h-16 sm:h-20"
              >
                <div
                  className="absolute inset-0 h-[100%] rounded-b-[inherit] backdrop-blur-sm"
                  style={{
                    WebkitMaskImage: "linear-gradient(to top, black 30%, transparent)",
                    maskImage: "linear-gradient(to top, black 30%, transparent)",
                    maskRepeat: "no-repeat",
                    maskSize: "100% 100%",
                  }}
                />
              </div>
              <Card.Footer className="z-10 mt-auto flex items-end justify-between">
                <div>
                  <div className="text-base font-medium text-black sm:text-lg">NEO</div>
                  <div className="text-xs font-medium text-black/50 sm:text-sm">$499/m</div>
                </div>
                <Button className="bg-white text-black" size="sm" variant="tertiary">
                  Get now
                </Button>
              </Card.Footer>
            </Card>

            {/* Right Column: Cards Stack */}
            <div className="col-span-12 flex flex-col gap-2 md:col-span-4 md:justify-between md:gap-0">
              {/* 1 */}
              <Card className="flex flex-row gap-3 p-1" variant="transparent">
                <img
                  alt="Futuristic Robot"
                  className="aspect-square h-16 w-16 shrink-0 rounded-xl object-cover select-none sm:h-20 sm:w-20"
                  loading="lazy"
                  src="https://picsum.photos/seed/peakui-card-robot/160/160"
                />
                <div className="flex flex-1 flex-col justify-center gap-1">
                  <Card.Title className="text-sm">Bridging the Future</Card.Title>
                  <Card.Description className="text-xs">Today, 6:30 PM</Card.Description>
                </div>
              </Card>
              {/* 2 */}
              <Card className="flex flex-row gap-3 p-1" variant="transparent">
                <img
                  alt="Avocado"
                  className="aspect-square h-16 w-16 shrink-0 rounded-xl object-cover select-none sm:h-20 sm:w-20"
                  loading="lazy"
                  src="https://picsum.photos/seed/peakui-card-avocado/160/160"
                />
                <div className="flex flex-1 flex-col justify-center gap-1">
                  <Card.Title className="text-sm">Avocado Hackathon</Card.Title>
                  <Card.Description className="text-xs">Wed, 4:30 PM</Card.Description>
                </div>
              </Card>
              {/* 3 */}
              <Card className="flex flex-row gap-3 p-1" variant="transparent">
                <img
                  alt="Sound Electro event"
                  className="aspect-square h-16 w-16 shrink-0 rounded-xl object-cover select-none sm:h-20 sm:w-20"
                  loading="lazy"
                  src="https://picsum.photos/seed/peakui-card-oranges/160/160"
                />
                <div className="flex flex-1 flex-col justify-center gap-1">
                  <Card.Title className="text-sm">Sound Electro | Beyond art</Card.Title>
                  <Card.Description className="text-xs">Fri, 8:00 PM</Card.Description>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Showcase>
  ),
};

/*
 * The reference wires the form through its Form primitive; that component is not ported yet, so
 * this story uses the native form element with the same layout.
 */
export const WithForm: Story = {
  args: {children: null},
  name: "С формой",
  render: () => {
    const onSubmit = (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      alert("Form submitted successfully!");
    };

    return (
      <Showcase title="С формой">
        <Card className="w-full max-w-md">
          <Card.Header>
            <Card.Title>Login</Card.Title>
            <Card.Description>Enter your credentials to access your account</Card.Description>
          </Card.Header>
          <form onSubmit={onSubmit}>
            <Card.Content>
              <div className="flex flex-col gap-4">
                <TextField name="email" type="email">
                  <Label>Email</Label>
                  <Input placeholder="email@example.com" variant="secondary" />
                </TextField>
                <TextField name="password" type="password">
                  <Label>Password</Label>
                  <Input placeholder="••••••••" variant="secondary" />
                </TextField>
              </div>
            </Card.Content>
            <Card.Footer className="mt-4 flex flex-col gap-2">
              <Button className="w-full" type="submit">
                Sign In
              </Button>
              <Link className="text-center text-sm" href="#">
                Forgot password?
              </Link>
            </Card.Footer>
          </form>
        </Card>
      </Showcase>
    );
  },
};
