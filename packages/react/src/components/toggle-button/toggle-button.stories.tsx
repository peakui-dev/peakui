import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ComponentProps, ReactNode} from "react";

import {useState} from "react";

import {ToggleButton} from "./index.ts";

/*
 * Story-local glyphs, inlined verbatim from @gravity-ui/icons (MIT) — the same source the
 * internal icons module keeps; see THIRD-PARTY-NOTICES.md.
 *
 * Real svgs, not text placeholders: the size of an icon inside the button is set by the
 * `& svg` rule in toggle-button.css, and only a real element exercises it.
 */
interface IconProps extends ComponentProps<"svg"> {}

const HeartIcon = (props: IconProps) => (
  <svg fill="none" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      clipRule="evenodd"
      d="M1.633 2.796c.762-.837 1.85-1.297 3.127-1.297 1.164 0 2.407.55 3.24 1.626.828-1.075 2.066-1.626 3.24-1.626 1.274 0 2.36.458 3.124 1.293.756.828 1.136 1.962 1.136 3.22 0 2.166-1.113 3.909-2.522 5.264-1.405 1.352-3.17 2.383-4.633 3.14a.75.75 0 0 1-.693-.002c-1.463-.765-3.228-1.788-4.633-3.133C1.61 9.93.5 8.193.5 6.013c0-1.255.378-2.389 1.133-3.217m1.109 1.01C2.287 4.306 2 5.053 2 6.013c0 1.624.816 2.996 2.057 4.184 1.146 1.098 2.6 1.985 3.945 2.705 1.335-.71 2.79-1.604 3.937-2.707C13.182 8.998 14 7.62 14 6.013c0-.963-.288-1.71-.744-2.21C12.808 3.314 12.14 3 11.24 3c-.976 0-2.093.628-2.527 1.95a.75.75 0 0 1-1.426 0C6.854 3.63 5.725 3 4.76 3c-.903 0-1.57.315-2.018.807"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);

const HeartFillIcon = (props: IconProps) => (
  <svg fill="none" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      clipRule="evenodd"
      d="M4.76 1.5c-1.278 0-2.365.459-3.127 1.296C.878 3.624.5 4.758.5 6.013c0 2.18 1.11 3.917 2.52 5.268 1.404 1.345 3.17 2.368 4.632 3.133a.75.75 0 0 0 .693.002c1.463-.757 3.228-1.788 4.633-3.14 1.41-1.355 2.522-3.098 2.522-5.263 0-1.26-.38-2.393-1.136-3.221-.763-.835-1.85-1.293-3.124-1.293-1.076 0-1.966.399-2.643 1.151A4.5 4.5 0 0 0 8 3.504a4.5 4.5 0 0 0-.597-.854C6.726 1.898 5.836 1.5 4.76 1.5"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);

const BookmarkIcon = (props: IconProps) => (
  <svg fill="none" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      clipRule="evenodd"
      d="m8 9.524.976.837 2.988 2.56a.325.325 0 0 0 .536-.246V4.5A1.5 1.5 0 0 0 11 3H5a1.5 1.5 0 0 0-1.5 1.5v8.175a.325.325 0 0 0 .536.247l2.988-2.56zM14 4.5a3 3 0 0 0-3-3H5a3 3 0 0 0-3 3v8.175a1.825 1.825 0 0 0 3.013 1.386L8 11.5l2.987 2.56A1.825 1.825 0 0 0 14 12.676z"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);

const BookmarkFillIcon = (props: IconProps) => (
  <svg fill="none" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M11 1.5a3 3 0 0 1 3 3v8.546a1.454 1.454 0 0 1-2.411 1.094L8 11l-3.589 3.14A1.454 1.454 0 0 1 2 13.046V4.5a3 3 0 0 1 3-3z"
      fill="currentColor"
    />
  </svg>
);

const PinIcon = (props: IconProps) => (
  <svg fill="none" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      clipRule="evenodd"
      d="M10.5 2.255v-.01c.003-.03.013-.157-.361-.35C9.703 1.668 8.967 1.5 8 1.5s-1.703.169-2.138.394c-.375.194-.365.32-.362.351v.01c-.003.03-.013.157.362.35C6.297 2.832 7.033 3 8 3s1.703-.169 2.139-.394c.374-.194.364-.32.361-.351M8 4.5c.506 0 .99-.04 1.436-.118l.84 2.352.253.707.717.221c.648.2 1.055.44 1.277.65.192.18.227.31.227.438 0 .14-.055.488-.937.878-.869.384-2.2.622-3.813.622s-2.944-.238-3.813-.622c-.882-.39-.937-.738-.937-.878 0-.128.035-.259.227-.439.222-.209.629-.448 1.277-.649l.717-.221.253-.707.84-2.352c.445.079.93.118 1.436.118m4-2.25c0 .738-.433 1.294-1.136 1.669l.825 2.31c1.553.48 2.561 1.32 2.561 2.52 0 1.854-2.402 2.848-5.5 2.985V15a.75.75 0 0 1-1.5 0v-3.266c-3.098-.136-5.5-1.131-5.5-2.984 0-1.2 1.008-2.04 2.561-2.52l.825-2.311C4.433 3.544 4 2.988 4 2.25 4 .75 5.79 0 8 0s4 .75 4 2.25"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);

const PinFillIcon = (props: IconProps) => (
  <svg fill="none" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      clipRule="evenodd"
      d="M10.5 2.255v-.01c.003-.03.013-.157-.361-.35C9.703 1.668 8.967 1.5 8 1.5s-1.703.169-2.138.394c-.375.194-.365.32-.362.351v.01c-.003.03-.013.157.362.35C6.297 2.832 7.033 3 8 3s1.703-.169 2.139-.394c.374-.194.364-.32.361-.351M12 2.25c0 .738-.433 1.294-1.136 1.669l.825 2.31c1.553.48 2.561 1.32 2.561 2.52 0 1.854-2.402 2.848-5.5 2.985V15a.75.75 0 0 1-1.5 0v-3.266c-3.098-.136-5.5-1.131-5.5-2.984 0-1.2 1.008-2.04 2.561-2.52l.825-2.311C4.433 3.544 4 2.988 4 2.25 4 .75 5.79 0 8 0s4 .75 4 2.25"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);

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
  component: ToggleButton,
  parameters: {
    layout: "padded",
  },
  title: "Components/ToggleButton",
} satisfies Meta<typeof ToggleButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "По умолчанию",
  render: () => (
    <Showcase title="По умолчанию">
      <div className="flex gap-3">
        <ToggleButton>
          <HeartIcon />
          Нравится
        </ToggleButton>
        <ToggleButton variant="ghost">
          <HeartIcon />
          Нравится
        </ToggleButton>
      </div>
    </Showcase>
  ),
};

export const Variants: Story = {
  name: "Варианты",
  render: () => (
    <Showcase title="Варианты">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-muted">Default</p>
          <div className="flex gap-3">
            <ToggleButton>
              <HeartIcon />
              Нравится
            </ToggleButton>
            <ToggleButton defaultSelected>
              <HeartFillIcon />
              Нравится
            </ToggleButton>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-muted">Ghost</p>
          <div className="flex gap-3">
            <ToggleButton variant="ghost">
              <HeartIcon />
              Нравится
            </ToggleButton>
            <ToggleButton defaultSelected variant="ghost">
              <HeartFillIcon />
              Нравится
            </ToggleButton>
          </div>
        </div>
      </div>
    </Showcase>
  ),
};

export const Sizes: Story = {
  name: "Размеры",
  render: () => (
    <Showcase title="Размеры">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <ToggleButton size="sm">
            <HeartIcon />
            Маленький
          </ToggleButton>
          <ToggleButton size="md">
            <HeartIcon />
            Средний
          </ToggleButton>
          <ToggleButton size="lg">
            <HeartIcon />
            Большой
          </ToggleButton>
        </div>
        <div className="flex items-center gap-3">
          <ToggleButton isIconOnly aria-label="Нравится, маленький" size="sm">
            <HeartIcon />
          </ToggleButton>
          <ToggleButton isIconOnly aria-label="Нравится, средний" size="md">
            <HeartIcon />
          </ToggleButton>
          <ToggleButton isIconOnly aria-label="Нравится, большой" size="lg">
            <HeartIcon />
          </ToggleButton>
        </div>
      </div>
    </Showcase>
  ),
};

export const IconOnly: Story = {
  name: "Только иконка",
  render: () => (
    <Showcase title="Только иконка">
      <div className="flex gap-3">
        <ToggleButton isIconOnly aria-label="Нравится">
          <HeartIcon />
        </ToggleButton>
        <ToggleButton isIconOnly aria-label="В закладки" variant="ghost">
          <BookmarkIcon />
        </ToggleButton>
      </div>
    </Showcase>
  ),
};

export const Controlled: Story = {
  name: "Управляемая",
  render: () => {
    const [isSelected, setIsSelected] = useState(false);

    return (
      <Showcase title="Управляемая">
        <div className="flex flex-col gap-4">
          <div className="flex gap-3">
            <ToggleButton isSelected={isSelected} onChange={setIsSelected}>
              {({isSelected: selected}) => (
                <>
                  {selected ? <HeartFillIcon /> : <HeartIcon />}
                  {selected ? "Нравится" : "Хочу нравиться"}
                </>
              )}
            </ToggleButton>
          </div>
          <p className="text-sm text-muted">
            Статус: <span className="font-medium">{isSelected ? "Выбрано" : "Не выбрано"}</span>
          </p>
        </div>
      </Showcase>
    );
  },
};

export const Disabled: Story = {
  name: "Недоступна",
  render: () => (
    <Showcase title="Недоступна">
      <div className="flex gap-3">
        <ToggleButton isDisabled>
          <HeartIcon />
          Нравится
        </ToggleButton>
        <ToggleButton defaultSelected isDisabled>
          <HeartFillIcon />
          Нравится
        </ToggleButton>
      </div>
    </Showcase>
  ),
};

export const RealWorld: Story = {
  name: "Вместе в интерфейсе",
  render: () => {
    const [bookmarked, setBookmarked] = useState(false);
    const [liked, setLiked] = useState(false);
    const [pinned, setPinned] = useState(true);

    return (
      <Showcase title="Вместе в интерфейсе">
        <div className="flex items-center gap-2">
          <ToggleButton isSelected={liked} size="sm" onChange={setLiked}>
            {({isSelected}) => (
              <>
                {isSelected ? <HeartFillIcon /> : <HeartIcon />}
                Нравится
              </>
            )}
          </ToggleButton>
          <ToggleButton isSelected={bookmarked} size="sm" variant="ghost" onChange={setBookmarked}>
            {({isSelected}) => (
              <>
                {isSelected ? <BookmarkFillIcon /> : <BookmarkIcon />}
                Сохранить
              </>
            )}
          </ToggleButton>
          <ToggleButton
            isIconOnly
            aria-label="Закрепить"
            isSelected={pinned}
            size="sm"
            variant="ghost"
            onChange={setPinned}
          >
            {({isSelected}) => (isSelected ? <PinFillIcon /> : <PinIcon />)}
          </ToggleButton>
        </div>
      </Showcase>
    );
  },
};
