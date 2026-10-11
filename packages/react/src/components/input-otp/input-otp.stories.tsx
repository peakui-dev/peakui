import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ReactNode} from "react";

import React from "react";

import {Button} from "../button/index.ts";
import {Description} from "../description/index.ts";
import {Form} from "../form/index.ts";
import {Label} from "../label/index.ts";
import {Link} from "../link/index.ts";
import {Spinner} from "../spinner/index.ts";

import {InputOtp, REGEXP_ONLY_CHARS} from "./index.ts";

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

const SixSlots = () => (
  <>
    <InputOtp.Group>
      <InputOtp.Slot index={0} />
      <InputOtp.Slot index={1} />
      <InputOtp.Slot index={2} />
    </InputOtp.Group>
    <InputOtp.Separator />
    <InputOtp.Group>
      <InputOtp.Slot index={3} />
      <InputOtp.Slot index={4} />
      <InputOtp.Slot index={5} />
    </InputOtp.Group>
  </>
);

const meta = {
  component: InputOtp,
  parameters: {
    layout: "padded",
  },
  title: "Components/InputOtp",
} satisfies Meta<typeof InputOtp>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {children: <SixSlots />, maxLength: 6},
  render: (args) => (
    <Showcase title="Default">
      <div className="flex w-[280px] flex-col gap-2">
        <div className="flex flex-col gap-1">
          <Label>Verify account</Label>
          <p className="text-sm text-muted">We&apos;ve sent a code to a****@gmail.com</p>
        </div>
        <InputOtp {...args} />
        <div className="flex items-center gap-[5px] px-1 pt-1">
          <p className="text-sm text-muted">Didn&apos;t receive a code?</p>
          <Link className="text-foreground" href="#">
            Resend
          </Link>
        </div>
      </div>
    </Showcase>
  ),
};

export const Variants: Story = {
  args: {children: <SixSlots />, maxLength: 6},
  render: (args) => (
    <Showcase title="Variants">
      <div className="flex flex-col gap-2">
        <Label>Primary variant</Label>
        <InputOtp {...args} variant="primary" />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Secondary variant</Label>
        <InputOtp {...args} variant="secondary" />
      </div>
    </Showcase>
  ),
};

export const FourDigits: Story = {
  args: {
    children: (
      <InputOtp.Group>
        <InputOtp.Slot index={0} />
        <InputOtp.Slot index={1} />
        <InputOtp.Slot index={2} />
        <InputOtp.Slot index={3} />
      </InputOtp.Group>
    ),
    maxLength: 4,
  },
  render: (args) => (
    <Showcase title="Four Digits">
      <div className="flex w-[280px] flex-col gap-2">
        <Label>Enter PIN</Label>
        <InputOtp {...args} />
      </div>
    </Showcase>
  ),
};

export const Disabled: Story = {
  args: {children: <SixSlots />, isDisabled: true, maxLength: 6},
  render: (args) => (
    <Showcase title="Disabled">
      <div className="flex w-[280px] flex-col gap-2">
        <Label isDisabled>Verify account</Label>
        <Description>Code verification is currently disabled</Description>
        <InputOtp {...args} />
      </div>
    </Showcase>
  ),
};

export const WithPattern: Story = {
  args: {children: <SixSlots />, maxLength: 6, pattern: REGEXP_ONLY_CHARS},
  render: (args) => (
    <Showcase title="With Pattern">
      <div className="flex w-[280px] flex-col gap-2">
        <Label>Enter code (letters only)</Label>
        <Description>Only alphabetic characters are allowed</Description>
        <InputOtp {...args} />
      </div>
    </Showcase>
  ),
};

export const Controlled: Story = {
  args: {children: <SixSlots />, maxLength: 6},
  render: (args) => {
    const [value, setValue] = React.useState("");

    return (
      <Showcase title="Controlled">
        <div className="flex w-[280px] flex-col gap-2">
          <Label>Verify account</Label>
          <InputOtp {...args} value={value} onChange={setValue} />
          <Description>
            {value.length > 0 ? (
              <>
                Value: {value} ({value.length}/6) •{" "}
                <button
                  className="font-medium text-foreground underline"
                  onClick={() => setValue("")}
                >
                  Clear
                </button>
              </>
            ) : (
              "Enter a 6-digit code"
            )}
          </Description>
        </div>
      </Showcase>
    );
  },
};

export const WithValidation: Story = {
  args: {children: <SixSlots />, maxLength: 6, name: "code"},
  render: (args) => {
    const [value, setValue] = React.useState("");
    const [isInvalid, setIsInvalid] = React.useState(false);

    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const code = formData.get("code");

      if (code !== "123456") {
        setIsInvalid(true);

        return;
      }

      setIsInvalid(false);
      setValue("");
    };

    const handleChange = (val: string) => {
      setValue(val);
      setIsInvalid(false);
    };

    return (
      <Showcase title="With Validation">
        <div className="flex w-[280px] flex-col gap-2">
          <Form className="flex flex-col gap-2" onSubmit={onSubmit}>
            <Label>Verify account</Label>
            <Description>Hint: The code is 123456</Description>
            <InputOtp
              {...args}
              aria-describedby={isInvalid ? "code-error" : undefined}
              isInvalid={isInvalid}
              value={value}
              onChange={handleChange}
            />
            <span className="field-error" data-visible={isInvalid} id="code-error">
              Invalid code. Please try again.
            </span>
            <Button isDisabled={value.length !== 6} type="submit">
              Submit
            </Button>
          </Form>
        </div>
      </Showcase>
    );
  },
};

export const OnComplete: Story = {
  args: {children: <SixSlots />, maxLength: 6},
  render: (args) => {
    const [value, setValue] = React.useState("");
    const [isComplete, setIsComplete] = React.useState(false);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const handleComplete = () => {
      setIsComplete(true);
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      setIsSubmitting(true);
      // Simulate API call
      setTimeout(() => {
        setIsSubmitting(false);
        setValue("");
        setIsComplete(false);
      }, 2000);
    };

    return (
      <Showcase title="On Complete">
        <Form className="flex w-[280px] flex-col gap-2" onSubmit={handleSubmit}>
          <Label>Verify account</Label>
          <InputOtp
            {...args}
            value={value}
            onComplete={handleComplete}
            onChange={(val) => {
              setValue(val);
              setIsComplete(false);
            }}
          />
          <Button
            className="mt-2 w-full"
            isDisabled={!isComplete}
            isPending={isSubmitting}
            type="submit"
            variant="primary"
          >
            {isSubmitting ? (
              <>
                <Spinner color="current" size="sm" />
                Verifying...
              </>
            ) : (
              "Verify Code"
            )}
          </Button>
        </Form>
      </Showcase>
    );
  },
};

export const FormExample: Story = {
  args: {children: <SixSlots />, maxLength: 6},
  render: (args) => {
    const [value, setValue] = React.useState("");
    const [error, setError] = React.useState("");
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setError("");

      if (value.length !== 6) {
        setError("Please enter all 6 digits");

        return;
      }

      setIsSubmitting(true);

      // Simulate API call
      setTimeout(() => {
        if (value === "123456") {
          setValue("");
        } else {
          setError("Invalid code. Please try again.");
        }
        setIsSubmitting(false);
      }, 1500);
    };

    return (
      <Showcase title="Form Example">
        <Form className="flex w-[280px] flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <Label>Two-factor authentication</Label>
            <Description>Enter the 6-digit code from your authenticator app</Description>
            <InputOtp
              {...args}
              isInvalid={!!error}
              value={value}
              onChange={(val) => {
                setValue(val);
                setError("");
              }}
            />
            <span className="field-error" data-visible={!!error} id="code-error">
              {error}
            </span>
          </div>
          <Button
            className="w-full"
            isDisabled={value.length !== 6}
            isPending={isSubmitting}
            type="submit"
            variant="primary"
          >
            {isSubmitting ? (
              <>
                <Spinner color="current" size="sm" />
                Verifying...
              </>
            ) : (
              "Verify"
            )}
          </Button>
          <div className="flex items-center justify-center gap-1">
            <p className="text-sm text-muted">Having trouble?</p>
            <Link className="text-sm text-foreground" href="#">
              Use backup code
            </Link>
          </div>
        </Form>
      </Showcase>
    );
  },
};
