import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ReactNode} from "react";

import React, {useCallback, useRef, useState} from "react";

import {useOverlayState} from "../../hooks/index.ts";
import {Button} from "../button/index.ts";
import {InfoIcon, SuccessIcon, WarningIcon} from "../icons.tsx";
import {Input} from "../input/index.ts";
import {Label} from "../label/index.ts";
import {Surface} from "../surface/index.ts";
import {TextField} from "../textfield/index.ts";

import {Modal} from "./index.ts";

/*
 * Заголовок второго уровня есть у каждой истории не для красоты: аудит в apps/storybook/e2e ждёт
 * его как признак готовности превью. Без него axe запускается по ещё пустому iframe, находит ноль
 * нарушений и проходит молча.
 */
const Showcase = ({children, title}: {children: ReactNode; title: string}) => (
  <div className="flex flex-col gap-4 bg-background p-6">
    <h2 className="text-sm font-medium text-foreground">{title}</h2>
    <div className="flex flex-wrap items-center gap-6">{children}</div>
  </div>
);

const DialogFrame = ({className}: {className?: string}) => (
  <Modal.Dialog className={className}>
    <Modal.CloseTrigger />
    <Modal.Header>
      <Modal.Icon className="bg-default text-foreground">
        <InfoIcon className="size-5" />
      </Modal.Icon>
      <Modal.Heading>Заголовок модалки</Modal.Heading>
    </Modal.Header>
    <Modal.Body>
      <p>
        Диалоговое окно перекрывает страницу и требует действия: подтвердить, закрыть или продолжить
        работу с формой.
      </p>
    </Modal.Body>
    <Modal.Footer>
      <Button className="w-full" slot="close">
        Продолжить
      </Button>
    </Modal.Footer>
  </Modal.Dialog>
);

/*
 * Без `component` в meta: у StoryObj<typeof meta> иначе обязательны args с children в каждой
 * истории, у которой есть только render. Истории здесь собраны явными render-функциями.
 */
const meta = {
  parameters: {
    layout: "padded",
  },
  title: "Components/Modal",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Базовый",
  render: () => (
    <Showcase title="Базовый">
      <Modal>
        <Button variant="secondary">Открыть модалку</Button>
        <Modal.Backdrop>
          <Modal.Container>
            <DialogFrame className="sm:max-w-[360px]" />
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </Showcase>
  ),
};

export const Placements: Story = {
  name: "Размещения",
  render: () => {
    const placements = ["auto", "top", "center", "bottom"] as const;

    return (
      <Showcase title="Размещения">
        {placements.map((placement) => (
          <Modal key={placement}>
            <Button variant="secondary">
              {placement.charAt(0).toUpperCase() + placement.slice(1)}
            </Button>
            <Modal.Backdrop>
              <Modal.Container placement={placement}>
                <Modal.Dialog className="sm:max-w-[360px]">
                  <Modal.CloseTrigger />
                  <Modal.Header>
                    <Modal.Heading>Размещение: {placement}</Modal.Heading>
                  </Modal.Header>
                  <Modal.Body>
                    <p>
                      Модалка с размещением <code>{placement}</code>: контейнер позиционирует диалог
                      у нужной кромки экрана.
                    </p>
                  </Modal.Body>
                  <Modal.Footer>
                    <Button className="w-full" slot="close">
                      Продолжить
                    </Button>
                  </Modal.Footer>
                </Modal.Dialog>
              </Modal.Container>
            </Modal.Backdrop>
          </Modal>
        ))}
      </Showcase>
    );
  },
};

export const BackdropVariants: Story = {
  name: "Варианты подложки",
  render: () => {
    const variants = ["opaque", "blur", "transparent"] as const;

    return (
      <Showcase title="Варианты подложки">
        {variants.map((variant) => (
          <Modal key={variant}>
            <Button variant="secondary">{variant}</Button>
            <Modal.Backdrop variant={variant}>
              <Modal.Container>
                <Modal.Dialog className="sm:max-w-[360px]">
                  <Modal.CloseTrigger />
                  <Modal.Header>
                    <Modal.Heading>Подложка: {variant}</Modal.Heading>
                  </Modal.Header>
                  <Modal.Body>
                    <p>
                      Вариант <code>{variant}</code>: непрозрачное затемнение, размытие или
                      полностью прозрачная подложка.
                    </p>
                  </Modal.Body>
                  <Modal.Footer>
                    <Button className="w-full" slot="close">
                      Продолжить
                    </Button>
                  </Modal.Footer>
                </Modal.Dialog>
              </Modal.Container>
            </Modal.Backdrop>
          </Modal>
        ))}
      </Showcase>
    );
  },
};

export const Sizes: Story = {
  name: "Размеры",
  render: () => {
    const sizes = ["xs", "sm", "md", "lg", "cover", "full"] as const;

    return (
      <Showcase title="Размеры">
        {sizes.map((size) => (
          <Modal key={size}>
            <Button variant="secondary">{size}</Button>
            <Modal.Backdrop>
              <Modal.Container size={size}>
                <Modal.Dialog>
                  <Modal.CloseTrigger />
                  <Modal.Header>
                    <Modal.Heading>Размер: {size}</Modal.Heading>
                  </Modal.Header>
                  <Modal.Body>
                    <p>
                      На узком экране все размеры занимают почти всю ширину; на широком каждый
                      ограничен своей максимальной шириной.
                    </p>
                  </Modal.Body>
                  <Modal.Footer>
                    <Button slot="close" variant="secondary">
                      Отмена
                    </Button>
                    <Button slot="close">Подтвердить</Button>
                  </Modal.Footer>
                </Modal.Dialog>
              </Modal.Container>
            </Modal.Backdrop>
          </Modal>
        ))}
      </Showcase>
    );
  },
};

export const CustomBackdrop: Story = {
  name: "Своя подложка",
  render: () => (
    <Showcase title="Своя подложка">
      <Modal>
        <Button variant="secondary">Своя подложка</Button>
        <Modal.Backdrop
          className="bg-linear-to-t from-black/80 via-black/40 to-transparent dark:from-zinc-800/80 dark:via-zinc-800/40"
          variant="blur"
        >
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-[360px]">
              <Modal.Header className="items-center text-center">
                <Modal.Icon className="bg-accent-soft text-accent-soft-foreground">
                  <SuccessIcon className="size-5" />
                </Modal.Icon>
                <Modal.Heading>Градиентная подложка</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <p>
                  Градиент от тёмного низа к прозрачному верху combined с размытием: интенсивность
                  подбирается под обе темы.
                </p>
              </Modal.Body>
              <Modal.Footer className="flex-col-reverse">
                <Button className="w-full" slot="close">
                  Отлично!
                </Button>
                <Button className="w-full" slot="close" variant="secondary">
                  Закрыть
                </Button>
              </Modal.Footer>
              <Modal.CloseTrigger />
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </Showcase>
  ),
};

export const DismissBehavior: Story = {
  name: "Поведение закрытия",
  render: () => (
    <Showcase title="Поведение закрытия">
      <Modal>
        <Button variant="secondary">isDismissable = false</Button>
        <Modal.Backdrop isDismissable={false}>
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-[360px]">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Icon className="bg-default text-foreground">
                  <WarningIcon className="size-5" />
                </Modal.Icon>
                <Modal.Heading>isDismissable = false</Modal.Heading>
                <p className="text-sm leading-5 text-muted">
                  Клик по подложке не закрывает эту модалку
                </p>
              </Modal.Header>
              <Modal.Body>
                <p>
                  Клик по подложке ничего не делает: закрытие только кнопкой или Escape. Вторая
                  модалка рядом запрещает и Escape через isKeyboardDismissDisabled.
                </p>
              </Modal.Body>
              <Modal.Footer>
                <Button className="w-full" slot="close">
                  Закрыть
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
      <Modal>
        <Button variant="secondary">Без Escape</Button>
        <Modal.Backdrop isKeyboardDismissDisabled>
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-[360px]">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Icon className="bg-default text-foreground">
                  <WarningIcon className="size-5" />
                </Modal.Icon>
                <Modal.Heading>isKeyboardDismissDisabled = true</Modal.Heading>
                <p className="text-sm leading-5 text-muted">Escape отключён</p>
              </Modal.Header>
              <Modal.Body>
                <p>Escape ничего не делает: закрытие только кнопкой или кликом по подложке.</p>
              </Modal.Body>
              <Modal.Footer>
                <Button className="w-full" slot="close">
                  Закрыть
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </Showcase>
  ),
};

export const CloseMethods: Story = {
  name: "Способы закрытия",
  render: () => (
    <Showcase title="Способы закрытия">
      <Modal>
        <Button variant="secondary">slot=close</Button>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-[360px]">
              <Modal.Header>
                <Modal.Icon className="bg-accent-soft text-accent-soft-foreground">
                  <InfoIcon className="size-5" />
                </Modal.Icon>
                <Modal.Heading>Через slot=close</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <p>
                  Любая кнопка с <code>slot="close"</code> внутри диалога закрывает модалку сама.
                </p>
              </Modal.Body>
              <Modal.Footer>
                <Button slot="close" variant="secondary">
                  Отмена
                </Button>
                <Button slot="close">Подтвердить</Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
      <Modal>
        <Button variant="secondary">Рендер-пропс</Button>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-[360px]">
              {(renderProps) => (
                <>
                  <Modal.Header>
                    <Modal.Icon className="bg-success-soft text-success-soft-foreground">
                      <SuccessIcon className="size-5" />
                    </Modal.Icon>
                    <Modal.Heading>Через рендер-пропс диалога</Modal.Heading>
                  </Modal.Header>
                  <Modal.Body>
                    <p>
                      Рендер-пропс даёт метод <code>close</code>: можно выполнить свою логику до
                      закрытия.
                    </p>
                  </Modal.Body>
                  <Modal.Footer>
                    <Button variant="secondary" onPress={() => renderProps.close()}>
                      Отмена
                    </Button>
                    <Button onPress={() => renderProps.close()}>Подтвердить</Button>
                  </Modal.Footer>
                </>
              )}
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </Showcase>
  ),
};

export const ScrollComparison: Story = {
  name: "Прокрутка внутри и снаружи",
  render: () => {
    const [scroll, setScroll] = useState<"inside" | "outside">("inside");

    return (
      <Showcase title="Прокрутка внутри и снаружи">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={scroll === "inside" ? "primary" : "tertiary"}
            onPress={() => setScroll("inside")}
          >
            Внутри
          </Button>
          <Button
            size="sm"
            variant={scroll === "outside" ? "primary" : "tertiary"}
            onPress={() => setScroll("outside")}
          >
            Снаружи
          </Button>
        </div>
        <Modal>
          <Button variant="secondary">Открыть ({scroll})</Button>
          <Modal.Backdrop>
            <Modal.Container scroll={scroll}>
              <Modal.Dialog className="sm:max-w-[360px]">
                <Modal.Header>
                  <Modal.Heading>Прокрутка: {scroll}</Modal.Heading>
                  <p className="text-sm leading-5 text-muted">
                    Внутри — скроллится тело диалога, снаружи — вся подложка с диалогом.
                  </p>
                </Modal.Header>
                <Modal.Body>
                  {Array.from({length: 30}).map((_, i) => (
                    <p key={i} className="mb-3">
                      Абзац {i + 1}: длинный текст раскрывает разницу режимов прокрутки — где
                      появляется полоса и что остаётся на месте.
                    </p>
                  ))}
                </Modal.Body>
                <Modal.Footer>
                  <Button slot="close" variant="secondary">
                    Отмена
                  </Button>
                  <Button slot="close">Подтвердить</Button>
                </Modal.Footer>
                <Modal.CloseTrigger />
              </Modal.Dialog>
            </Modal.Container>
          </Modal.Backdrop>
        </Modal>
      </Showcase>
    );
  },
};

export const Controlled: Story = {
  name: "Управляемое состояние",
  render: () => {
    const [isOpen, setIsOpen] = React.useState(false);

    const state = useOverlayState();

    return (
      <div className="flex max-w-md flex-col gap-8">
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-foreground">С React.useState()</h2>
          <p className="text-sm text-muted">
            Пропсы <code>isOpen</code> и <code>onOpenChange</code> на Backdrop управляют модалкой
            снаружи.
          </p>
          <div className="flex flex-col items-start gap-3 rounded-2xl bg-surface p-4 shadow-sm">
            <p className="text-xs text-muted">
              Состояние:{" "}
              <span className="font-mono font-medium text-foreground">
                {isOpen ? "open" : "closed"}
              </span>
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onPress={() => setIsOpen(true)}>
                Открыть
              </Button>
              <Button size="sm" variant="tertiary" onPress={() => setIsOpen(!isOpen)}>
                Переключить
              </Button>
            </div>
          </div>

          <Modal.Backdrop isOpen={isOpen} onOpenChange={setIsOpen}>
            <Modal.Container>
              <Modal.Dialog className="sm:max-w-[360px]">
                <Modal.CloseTrigger />
                <Modal.Header>
                  <Modal.Icon className="bg-accent-soft text-accent-soft-foreground">
                    <SuccessIcon className="size-5" />
                  </Modal.Icon>
                  <Modal.Heading>Управление useState()</Modal.Heading>
                </Modal.Header>
                <Modal.Body>
                  <p>Модалкой управляет useState: состояние живёт снаружи компонента.</p>
                </Modal.Body>
                <Modal.Footer>
                  <Button slot="close" variant="secondary">
                    Отмена
                  </Button>
                  <Button slot="close">Подтвердить</Button>
                </Modal.Footer>
              </Modal.Dialog>
            </Modal.Container>
          </Modal.Backdrop>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-foreground">С useOverlayState()</h2>
          <p className="text-sm text-muted">
            Хук даёт методы <code>open()</code>, <code>close()</code> и <code>toggle()</code> без
            собственных колбэков.
          </p>
          <div className="flex flex-col items-start gap-3 rounded-2xl bg-surface p-4 shadow-sm">
            <p className="text-xs text-muted">
              Состояние:{" "}
              <span className="font-mono font-medium text-foreground">
                {state.isOpen ? "open" : "closed"}
              </span>
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onPress={state.open}>
                Открыть
              </Button>
              <Button size="sm" variant="tertiary" onPress={state.toggle}>
                Переключить
              </Button>
            </div>
          </div>

          <Modal.Backdrop isOpen={state.isOpen} onOpenChange={state.setOpen}>
            <Modal.Container>
              <Modal.Dialog className="sm:max-w-[360px]">
                <Modal.CloseTrigger />
                <Modal.Header>
                  <Modal.Icon className="bg-success-soft text-success-soft-foreground">
                    <SuccessIcon className="size-5" />
                  </Modal.Icon>
                  <Modal.Heading>Управление useOverlayState()</Modal.Heading>
                </Modal.Header>
                <Modal.Body>
                  <p>Хук передаётся в Root пропом state и управляет открытием целиком.</p>
                </Modal.Body>
                <Modal.Footer>
                  <Button slot="close" variant="secondary">
                    Отмена
                  </Button>
                  <Button slot="close">Подтвердить</Button>
                </Modal.Footer>
              </Modal.Dialog>
            </Modal.Container>
          </Modal.Backdrop>
        </div>
      </div>
    );
  },
};

export const WithForm: Story = {
  name: "С формой",
  render: () => (
    <Showcase title="С формой">
      <Modal>
        <Button variant="secondary">Открыть форму</Button>
        <Modal.Backdrop>
          <Modal.Container placement="auto">
            <Modal.Dialog className="sm:max-w-md">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Icon className="bg-accent-soft text-accent-soft-foreground">
                  <InfoIcon className="size-5" />
                </Modal.Icon>
                <Modal.Heading>Написать нам</Modal.Heading>
                <p className="mt-1.5 text-sm leading-5 text-muted">
                  Заполните форму — модалка подстроится под экранную клавиатуру.
                </p>
              </Modal.Header>
              <Modal.Body>
                <Surface variant="default">
                  <form className="flex flex-col gap-4">
                    <TextField className="w-full" name="name" type="text">
                      <Label>Имя</Label>
                      <Input placeholder="Как вас зовут" />
                    </TextField>
                    <TextField className="w-full" name="email" type="email">
                      <Label>Почта</Label>
                      <Input placeholder="you@example.com" />
                    </TextField>
                    <TextField className="w-full" name="company">
                      <Label>Компания</Label>
                      <Input placeholder="Название компании" />
                    </TextField>
                    <TextField className="w-full" name="message">
                      <Label>Сообщение</Label>
                      <Input placeholder="Пара слов о задаче" />
                    </TextField>
                  </form>
                </Surface>
              </Modal.Body>
              <Modal.Footer>
                <Button slot="close" variant="secondary">
                  Отмена
                </Button>
                <Button slot="close">Отправить</Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </Showcase>
  ),
};

export const CustomTrigger: Story = {
  name: "Свой триггер",
  render: () => (
    <Showcase title="Свой триггер">
      <Modal>
        <Modal.Trigger className="group flex items-center gap-3 rounded-2xl bg-surface p-4 shadow-xs select-none hover:bg-surface-secondary">
          <div className="bg-accent-soft text-accent-soft-foreground flex size-12 shrink-0 items-center justify-center rounded-xl">
            <InfoIcon className="size-6" />
          </div>
          <div className="flex flex-1 flex-col gap-0.5">
            <p className="text-sm font-semibold">Настройки</p>
            <p className="text-xs text-muted">Управление предпочтениями</p>
          </div>
        </Modal.Trigger>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-[360px]">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Icon className="bg-accent-soft text-accent-soft-foreground">
                  <InfoIcon className="size-5" />
                </Modal.Icon>
                <Modal.Heading>Настройки</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <p>
                  <code>Modal.Trigger</code> превращает любой блок в триггер — карточку с иконкой и
                  подписью.
                </p>
              </Modal.Body>
              <Modal.Footer>
                <Button slot="close" variant="secondary">
                  Отмена
                </Button>
                <Button slot="close">Сохранить</Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </Showcase>
  ),
};

export const CustomAnimations: Story = {
  name: "Свои анимации",
  render: () => {
    const animations = [
      {
        name: "Кинематографичный масштаб",
        description:
          "Пружинное масштабирование с высоким затуханием: быстрый отклик и долгое успокоение.",
        classNames: {
          backdrop: [
            "data-[entering]:duration-400",
            "data-[entering]:ease-[cubic-bezier(0.16,1,0.3,1)]",
            "data-[exiting]:duration-200",
            "data-[exiting]:ease-[cubic-bezier(0.7,0,0.84,0)]",
          ].join(" "),
          container: [
            "data-[entering]:animate-in",
            "data-[entering]:fade-in-0",
            "data-[entering]:zoom-in-95",
            "data-[entering]:duration-400",
            "data-[entering]:ease-[cubic-bezier(0.16,1,0.3,1)]",
            "data-[exiting]:animate-out",
            "data-[exiting]:fade-out-0",
            "data-[exiting]:zoom-out-95",
            "data-[exiting]:duration-200",
            "data-[exiting]:ease-[cubic-bezier(0.7,0,0.84,0)]",
          ].join(" "),
        },
      },
      {
        name: "Текучий подъём",
        description:
          "Движение сквозь среду с сопротивлением: без механической линейности, естественно и весомо.",
        classNames: {
          backdrop: [
            "data-[entering]:duration-500",
            "data-[entering]:ease-[cubic-bezier(0.25,1,0.5,1)]",
            "data-[exiting]:duration-200",
            "data-[exiting]:ease-[cubic-bezier(0.5,0,0.75,0)]",
          ].join(" "),
          container: [
            "data-[entering]:animate-in",
            "data-[entering]:fade-in-0",
            "data-[entering]:slide-in-from-bottom-4",
            "data-[entering]:duration-500",
            "data-[entering]:ease-[cubic-bezier(0.25,1,0.5,1)]",
            "data-[exiting]:animate-out",
            "data-[exiting]:fade-out-0",
            "data-[exiting]:slide-out-to-bottom-2",
            "data-[exiting]:duration-200",
            "data-[exiting]:ease-[cubic-bezier(0.5,0,0.75,0)]",
          ].join(" "),
        },
      },
    ];

    return (
      <Showcase title="Свои анимации">
        {animations.map(({classNames, description, name}) => (
          <Modal key={name}>
            <Button variant="secondary">{name}</Button>
            <Modal.Backdrop className={classNames.backdrop}>
              <Modal.Container className={classNames.container}>
                <Modal.Dialog className="sm:max-w-[360px]">
                  <Modal.CloseTrigger />
                  <Modal.Header>
                    <Modal.Icon className="bg-default text-foreground">
                      <SuccessIcon className="size-5" />
                    </Modal.Icon>
                    <Modal.Heading>{name}</Modal.Heading>
                  </Modal.Header>
                  <Modal.Body>
                    <p className="mt-1">{description}</p>
                  </Modal.Body>
                  <Modal.Footer>
                    <Button slot="close" variant="tertiary">
                      Закрыть
                    </Button>
                    <Button slot="close">Ещё раз</Button>
                  </Modal.Footer>
                </Modal.Dialog>
              </Modal.Container>
            </Modal.Backdrop>
          </Modal>
        ))}
      </Showcase>
    );
  },
};

export const CustomPortal: Story = {
  name: "Свой портал",
  render: () => {
    const portalRef = useRef<HTMLDivElement>(null);
    const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

    const setPortalRef = useCallback((node: HTMLDivElement | null) => {
      portalRef.current = node;
      setPortalContainer(node);
    }, []);

    return (
      <div className="flex flex-col gap-4">
        <h2 className="text-sm font-medium text-foreground">Свой портал</h2>
        <div>
          <p className="text-sm">
            Модалки рендерятся в свой контейнер вместо <code>document.body</code>.
          </p>
          <p className="text-sm text-muted">
            Контейнеру нужен новый контекст стопки — например,{" "}
            <code className="rounded px-1 py-0.5 text-xs">transform: translateZ(0)</code>.
          </p>
        </div>
        <div
          ref={setPortalRef}
          className="relative flex h-[380px] items-center justify-center overflow-hidden rounded bg-muted/20"
          /* новый контекст стопки */
          style={{transform: "translate(0)"}}
        >
          {!!portalContainer && (
            <Modal>
              <Button>Открыть</Button>
              <Modal.Backdrop className="h-full" UNSTABLE_portalContainer={portalContainer}>
                <Modal.Container className="h-full max-h-full">
                  <Modal.Dialog className="h-full max-h-full sm:max-w-md">
                    <Modal.CloseTrigger />
                    <Modal.Header>
                      <Modal.Heading>Свой портал</Modal.Heading>
                    </Modal.Header>
                    <Modal.Body>
                      <p className="text-sm text-muted">
                        Абзац один: диалог живёт внутри отведённой области страницы, а не в body.
                      </p>
                      <p className="text-sm text-muted">
                        Абзац два: длинный текст прокручивается внутри тела диалога.
                      </p>
                      <p className="text-sm text-muted">
                        Абзац три: граница области видна — модалка не выходит за её пределы.
                      </p>
                    </Modal.Body>
                    <Modal.Footer>
                      <Button slot="close" variant="secondary">
                        Закрыть
                      </Button>
                    </Modal.Footer>
                  </Modal.Dialog>
                </Modal.Container>
              </Modal.Backdrop>
            </Modal>
          )}
        </div>
      </div>
    );
  },
};
