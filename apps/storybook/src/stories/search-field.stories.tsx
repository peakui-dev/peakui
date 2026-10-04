import type {Meta, StoryObj} from "@storybook/react-vite";

import {searchFieldVariants} from "@peakui/styles";

/* Bare markup, no PeakUI React component: the stylesheet must serve a consumer without React. */

const slots = searchFieldVariants({fullWidth: true});

const meta = {
  title: "Components/SearchField",
  parameters: {
    layout: "padded",
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithoutReact: Story = {
  name: "Without React — classes only",
  render: () => (
    <div className="flex flex-col gap-6 bg-background p-6">
      <h2 className="text-xl font-semibold text-foreground">Bare markup</h2>

      <section className="flex w-[400px] flex-col gap-3">
        <h3 className="text-sm font-semibold text-foreground">Parts</h3>

        <div className="search-field search-field--full-width">
          <label className="label" data-slot="label" htmlFor="search-field-bare-search">
            Search
          </label>
          <div
            className="search-field__group search-field__group--full-width"
            data-slot="search-field-group"
          >
            <svg
              aria-hidden="true"
              className="search-field__search-icon"
              data-slot="search-field-search-icon"
              fill="none"
              height="16"
              viewBox="0 0 16 16"
              width="16"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                clipRule="evenodd"
                d="M11.5 7a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0m-.82 4.74a6 6 0 1 1 1.06-1.06l2.79 2.79a.75.75 0 1 1-1.06 1.06z"
                fill="currentColor"
                fillRule="evenodd"
              />
            </svg>
            <input
              className={slots.input()}
              data-slot="search-field-input"
              id="search-field-bare-search"
              placeholder="Search..."
              type="search"
            />
            <button
              aria-label="Clear search"
              className="search-field__clear-button close-button close-button--default"
              data-slot="search-field-clear-button"
              type="button"
            >
              <svg
                aria-hidden="true"
                className="size-3"
                data-slot="close-button-icon"
                fill="none"
                height="16"
                viewBox="0 0 16 16"
                width="16"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  clipRule="evenodd"
                  d="M3.47 3.47a.75.75 0 0 1 1.06 0L8 6.94l3.47-3.47a.75.75 0 1 1 1.06 1.06L9.06 8l3.47 3.47a.75.75 0 1 1-1.06 1.06L8 9.06l-3.47 3.47a.75.75 0 0 1-1.06-1.06L6.94 8 3.47 4.53a.75.75 0 0 1 0-1.06"
                  fill="currentColor"
                  fillRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* The secondary variant switches the shell fill through the seam custom properties. */}
        <div className="search-field search-field--secondary search-field--full-width">
          <label className="label" data-slot="label" htmlFor="search-field-bare-secondary">
            Secondary
          </label>
          <div
            className="search-field__group search-field__group--full-width"
            data-slot="search-field-group"
          >
            <input
              className="search-field__input"
              data-slot="search-field-input"
              id="search-field-bare-secondary"
              placeholder="secondary"
              type="search"
            />
          </div>
        </div>
      </section>

      <section className="flex w-[400px] flex-col gap-3">
        <h3 className="text-sm font-semibold text-foreground">States set by hand</h3>

        {(
          [
            ["data-hovered", {"data-hovered": true}],
            ["data-focus-within", {"data-focus-within": true}],
            ["data-invalid", {"data-invalid": true}],
            ["data-disabled", {"data-disabled": true}],
          ] as const
        ).map(([label, attrs]) => (
          <div key={label} className="search-field search-field--full-width">
            <div
              className="search-field__group search-field__group--full-width"
              data-slot="search-field-group"
              {...attrs}
            >
              <input
                aria-label={label}
                className="search-field__input"
                data-slot="search-field-input"
                defaultValue={label}
                disabled={label === "data-disabled"}
                type="search"
              />
            </div>
          </div>
        ))}
      </section>

      {/* The empty field hides the clear button: [data-empty] on the root keys the CSS rule. */}
      <section className="flex w-[400px] flex-col gap-3">
        <h3 className="text-sm font-semibold text-foreground">Empty</h3>

        <div className="search-field search-field--full-width" data-empty="true">
          <div
            className="search-field__group search-field__group--full-width"
            data-slot="search-field-group"
          >
            <input
              aria-label="Empty"
              className="search-field__input"
              data-slot="search-field-input"
              placeholder="the clear button is hidden"
              type="search"
            />
            <button
              aria-label="Clear search"
              className="search-field__clear-button close-button close-button--default"
              data-slot="search-field-clear-button"
              type="button"
            >
              clear
            </button>
          </div>
        </div>
      </section>
    </div>
  ),
};
