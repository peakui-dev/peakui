import {cleanup, render, screen, setupUser} from "@peakui/testing/helpers";

import {Button} from "@/components/button";
import {Modal, ModalRoot} from "@/components/modal/index.ts";
import {useOverlayState} from "@/hooks/index.ts";

/*
 * Диалог по умолчанию: Button — триггер DialogTrigger, Backdrop — модальный оверлей, Container —
 * позиционирующая оболочка, Dialog владеет семантикой. Так собраны все истории эталона.
 */
const ModalExample = ({
  placement,
  size,
}: {
  placement?: "auto" | "top" | "center" | "bottom";
  size?: "xs" | "sm" | "md" | "lg" | "cover" | "full";
} = {}) => (
  <Modal>
    <Button>Открыть</Button>
    <Modal.Backdrop>
      <Modal.Container placement={placement} size={size}>
        <Modal.Dialog>
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Icon>иконка</Modal.Icon>
            <Modal.Heading>Заголовок</Modal.Heading>
          </Modal.Header>
          <Modal.Body>Содержимое</Modal.Body>
          <Modal.Footer>
            <Button slot="close">Продолжить</Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  </Modal>
);

const openModal = async (user: ReturnType<typeof setupUser>) => {
  await user.click(screen.getByRole("button", {name: "Открыть"}));

  return screen.getByRole("dialog");
};

describe("Modal", () => {
  let user: ReturnType<typeof setupUser>;

  beforeEach(() => {
    user = setupUser();
  });

  afterEach(() => {
    cleanup();
  });

  it("выставляет data-slot на собственном триггере", () => {
    render(
      <Modal>
        <Modal.Trigger aria-label="Триггер модалки">
          <span>триггер</span>
        </Modal.Trigger>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog>Содержимое</Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>,
    );

    expect(document.querySelector('[data-slot="modal-trigger"]')).not.toBeNull();
  });

  it("открывает диалог по нажатию с BEM-классами и data-slot", async () => {
    render(<ModalExample />);

    const dialog = await openModal(user);

    expect(dialog).toHaveTextContent("Содержимое");
    expect(dialog.className).toEqual(expect.stringContaining("modal__dialog"));
    expect(document.querySelector('[data-slot="modal-backdrop"]')).not.toBeNull();
    expect(document.querySelector('[data-slot="modal-container"]')).not.toBeNull();
  });

  it("подписывает структурные части data-slot", async () => {
    render(<ModalExample />);

    await openModal(user);

    for (const slot of [
      "modal-header",
      "modal-icon",
      "modal-heading",
      "modal-body",
      "modal-footer",
    ]) {
      expect(document.querySelector(`[data-slot="${slot}"]`)).not.toBeNull();
    }
  });

  it("переименовывает слот CloseButton на modal-close-trigger", async () => {
    render(<ModalExample />);

    await openModal(user);

    /*
     * Часть передаёт слот типизированным data-slot CloseButton: атрибут после спреда в
     * CloseButton перетирает дефолт «close-button», и стили модалки находят свою кнопку.
     */
    expect(screen.getByRole("button", {name: "Close"})).toHaveAttribute(
      "data-slot",
      "modal-close-trigger",
    );
  });

  it("связывает диалог с заголовком через aria-labelledby", async () => {
    render(<ModalExample />);

    const dialog = await openModal(user);
    const heading = screen.getByRole("heading", {name: "Заголовок"});

    expect(heading.className).toEqual(expect.stringContaining("modal__heading"));
    expect(dialog).toHaveAttribute("aria-labelledby", heading.id);
  });

  it("переносит фокус внутрь диалога при открытии", async () => {
    render(<ModalExample />);

    const dialog = await openModal(user);

    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it("закрывает диалог по Escape", async () => {
    render(<ModalExample />);

    await openModal(user);
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("не закрывает диалог по Escape при isKeyboardDismissDisabled", async () => {
    render(
      <Modal>
        <Button>Открыть</Button>
        <Modal.Backdrop isKeyboardDismissDisabled>
          <Modal.Container>
            <Modal.Dialog>
              <Modal.Heading>Без Escape</Modal.Heading>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>,
    );

    await openModal(user);
    await user.keyboard("{Escape}");

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("закрывает диалог кнопкой закрытия", async () => {
    render(<ModalExample />);

    await openModal(user);
    await user.click(screen.getByRole("button", {name: "Close"}));

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("закрывает диалог кнопкой со slot=close", async () => {
    render(<ModalExample />);

    await openModal(user);
    await user.click(screen.getByRole("button", {name: "Продолжить"}));

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("принимает close из рендер-пропса диалога", async () => {
    render(
      <Modal>
        <Button>Открыть</Button>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog>
              {(renderProps) => (
                <>
                  <Modal.Heading>Рендер-пропс</Modal.Heading>
                  <Button onPress={() => renderProps.close()}>Закрыть</Button>
                </>
              )}
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>,
    );

    await openModal(user);
    await user.click(screen.getByRole("button", {name: "Закрыть"}));

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("подписывает placement атрибутом на контейнере и диалоге", async () => {
    render(<ModalExample placement="top" />);

    await openModal(user);

    expect(document.querySelector('[data-slot="modal-container"]')).toHaveAttribute(
      "data-placement",
      "top",
    );
    expect(document.querySelector('[data-slot="modal-dialog"]')).toHaveAttribute(
      "data-placement",
      "top",
    );
  });

  it("подписывает size и scroll классами модификаторов", async () => {
    render(
      <Modal>
        <Button>Открыть</Button>
        <Modal.Backdrop>
          <Modal.Container scroll="outside" size="sm">
            <Modal.Dialog>
              <Modal.Heading>Модификаторы</Modal.Heading>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>,
    );

    await openModal(user);

    const container = document.querySelector('[data-slot="modal-container"]');
    const dialog = document.querySelector('[data-slot="modal-dialog"]');

    expect(container?.className).toEqual(
      expect.stringContaining("modal__container--scroll-outside"),
    );
    expect(dialog?.className).toEqual(expect.stringContaining("modal__dialog--sm"));
  });

  it("подписывает вариант подложки классом модификатора", async () => {
    render(
      <Modal>
        <Button>Открыть</Button>
        <Modal.Backdrop variant="blur">
          <Modal.Container>
            <Modal.Dialog>
              <Modal.Heading>Размытая подложка</Modal.Heading>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>,
    );

    await openModal(user);

    expect(document.querySelector('[data-slot="modal-backdrop"]')?.className).toEqual(
      expect.stringContaining("modal__backdrop--blur"),
    );
  });

  it("управляет открытием через state от useOverlayState", async () => {
    const Stateful = () => {
      const state = useOverlayState();

      return (
        <>
          <Button onPress={state.open}>Состояние</Button>
          <Modal state={state}>
            <Modal.Backdrop>
              <Modal.Container>
                <Modal.Dialog>
                  <Modal.Heading>Из состояния</Modal.Heading>
                </Modal.Dialog>
              </Modal.Container>
            </Modal.Backdrop>
          </Modal>
        </>
      );
    };

    render(<Stateful />);

    expect(screen.queryByRole("dialog")).toBeNull();

    await user.click(screen.getByRole("button", {name: "Состояние"}));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("вызывает onOpenChange при открытии и закрытии", async () => {
    const onOpenChange = vi.fn();

    render(
      <Modal onOpenChange={onOpenChange}>
        <Button>Открыть</Button>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog>
              <Modal.Heading>События</Modal.Heading>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>,
    );

    await openModal(user);
    await user.keyboard("{Escape}");

    expect(onOpenChange).toHaveBeenCalledTimes(2);
    expect(onOpenChange).toHaveBeenNthCalledWith(1, true);
    expect(onOpenChange).toHaveBeenNthCalledWith(2, false);
  });

  it("ведёт себя одинаково как Modal.Root и ModalRoot", () => {
    render(
      <>
        <ModalRoot>
          <Modal.Trigger aria-label="Триггер модалки">плоский</Modal.Trigger>
          <Modal.Backdrop>
            <Modal.Container>
              <Modal.Dialog>Плоская модалка</Modal.Dialog>
            </Modal.Container>
          </Modal.Backdrop>
        </ModalRoot>
        <Modal.Root>
          <Modal.Trigger aria-label="Триггер модалки">именованный</Modal.Trigger>
          <Modal.Backdrop>
            <Modal.Container>
              <Modal.Dialog>Именованная модалка</Modal.Dialog>
            </Modal.Container>
          </Modal.Backdrop>
        </Modal.Root>
      </>,
    );

    expect(document.querySelectorAll('[data-slot="modal-trigger"]')).toHaveLength(2);
  });
});

describe("useOverlayState", () => {
  afterEach(() => {
    cleanup();
  });

  const Harness = ({
    isOpen,
    onOpenChange,
  }: {
    isOpen?: boolean;
    onOpenChange?: (isOpen: boolean) => void;
  }) => {
    const state = useOverlayState({isOpen, onOpenChange});

    return (
      <div>
        <output aria-label="состояние">{String(state.isOpen)}</output>
        <button onClick={() => state.open()}>open</button>
        <button onClick={() => state.close()}>close</button>
        <button onClick={() => state.toggle()}>toggle</button>
        <button onClick={() => state.setOpen(true)}>setOpen</button>
      </div>
    );
  };

  const result = () => screen.getByLabelText("состояние").textContent;

  it("начинается закрытым без пропсов", () => {
    render(<Harness />);

    expect(result()).toBe("false");
  });

  it("открывается, переключается и закрывается", async () => {
    const user = setupUser();

    render(<Harness />);

    await user.click(screen.getByRole("button", {name: "open"}));
    expect(result()).toBe("true");

    await user.click(screen.getByRole("button", {name: "toggle"}));
    expect(result()).toBe("false");

    await user.click(screen.getByRole("button", {name: "setOpen"}));
    expect(result()).toBe("true");

    await user.click(screen.getByRole("button", {name: "close"}));
    expect(result()).toBe("false");
  });

  it("зеркалит управляемый isOpen и не меняет его изнутри", async () => {
    const user = setupUser();

    render(<Harness isOpen />);

    await user.click(screen.getByRole("button", {name: "close"}));

    expect(result()).toBe("true");
  });

  it("сообщает об изменениях через onOpenChange", async () => {
    const onOpenChange = vi.fn();
    const user = setupUser();

    render(<Harness onOpenChange={onOpenChange} />);

    await user.click(screen.getByRole("button", {name: "open"}));

    expect(onOpenChange).toHaveBeenCalledWith(true);
  });
});
