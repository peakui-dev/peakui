import {cleanup, render, screen, setupUser} from "@peakui/testing/helpers";

import {Button} from "@/components/button";
import {Popover, PopoverRoot} from "@/components/popover/index.ts";

/*
 * Диалог по умолчанию: Button — триггер DialogTrigger, Content позиционирует, Dialog владеет
 * семантикой. Так собраны все истории эталона.
 */
const PopoverExample = ({placement}: {placement?: "top" | "bottom"} = {}) => (
  <Popover>
    <Button>Открыть</Button>
    <Popover.Content placement={placement}>
      <Popover.Dialog>
        <Popover.Heading>Заголовок</Popover.Heading>
        <p>Содержимое поповера</p>
      </Popover.Dialog>
    </Popover.Content>
  </Popover>
);

describe("Popover", () => {
  let user: ReturnType<typeof setupUser>;

  beforeEach(() => {
    user = setupUser();
  });

  afterEach(() => {
    cleanup();
  });

  it("выставляет data-slot на собственном триггере", () => {
    render(
      <Popover>
        <Popover.Trigger aria-label="Триггер поповера">
          <span>триггер</span>
        </Popover.Trigger>
        <Popover.Content>
          <Popover.Dialog>Содержимое</Popover.Dialog>
        </Popover.Content>
      </Popover>,
    );

    expect(document.querySelector('[data-slot="popover-trigger"]')).not.toBeNull();
  });

  it("открывает содержимое по нажатию с BEM-блоком и data-slot", async () => {
    render(<PopoverExample />);

    await user.click(screen.getByRole("button", {name: "Открыть"}));

    const dialog = screen.getByRole("dialog");

    expect(dialog).toHaveTextContent("Содержимое поповера");
    expect(dialog.className).toEqual(expect.stringContaining("popover__dialog"));
    expect(document.querySelector('[data-slot="popover"]')).not.toBeNull();
  });

  it("связывает диалог с заголовком через aria-labelledby", async () => {
    render(<PopoverExample />);

    await user.click(screen.getByRole("button", {name: "Открыть"}));

    const dialog = screen.getByRole("dialog");
    const heading = screen.getByRole("heading", {name: "Заголовок"});

    expect(heading.className).toEqual(expect.stringContaining("popover__heading"));
    expect(dialog).toHaveAttribute("aria-labelledby", heading.id);
  });

  it("ставит data-placement согласно пропу placement", async () => {
    render(<PopoverExample placement="top" />);

    await user.click(screen.getByRole("button", {name: "Открыть"}));

    expect(document.querySelector('[data-slot="popover"]')).toHaveAttribute(
      "data-placement",
      "top",
    );
  });

  it("рисует стрелку по умолчанию внутри группы стрелки", async () => {
    render(
      <Popover>
        <Button>Открыть</Button>
        <Popover.Content>
          <Popover.Dialog>
            <Popover.Arrow />
            <p>Со стрелкой</p>
          </Popover.Dialog>
        </Popover.Content>
      </Popover>,
    );

    await user.click(screen.getByRole("button", {name: "Открыть"}));

    expect(document.querySelector('[data-slot="popover-overlay-arrow-group"]')).not.toBeNull();
    expect(document.querySelector('[data-slot="popover-overlay-arrow"]')).not.toBeNull();
  });

  it("клонирует кастомную стрелку с контрактным data-slot", async () => {
    render(
      <Popover>
        <Button>Открыть</Button>
        <Popover.Content>
          <Popover.Dialog>
            <Popover.Arrow>
              <svg height="12" viewBox="0 0 12 12" width="12" />
            </Popover.Arrow>
            <p>Кастомная стрелка</p>
          </Popover.Dialog>
        </Popover.Content>
      </Popover>,
    );

    await user.click(screen.getByRole("button", {name: "Открыть"}));

    expect(document.querySelectorAll('[data-slot="popover-overlay-arrow"]')).toHaveLength(1);
  });

  it("переносит фокус внутрь диалога при открытии", async () => {
    render(<PopoverExample />);

    await user.click(screen.getByRole("button", {name: "Открыть"}));

    const dialog = screen.getByRole("dialog");

    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it("закрывает диалог по Escape", async () => {
    render(<PopoverExample />);

    await user.click(screen.getByRole("button", {name: "Открыть"}));

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("не открывает содержимое с неактивным триггером", async () => {
    render(
      <Popover>
        <Button isDisabled>Открыть</Button>
        <Popover.Content>
          <Popover.Dialog>Недоступное содержимое</Popover.Dialog>
        </Popover.Content>
      </Popover>,
    );

    await user.click(screen.getByRole("button", {name: "Открыть"}));

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("вызывает onOpenChange при открытии и закрытии", async () => {
    const onOpenChange = vi.fn();

    render(
      <Popover onOpenChange={onOpenChange}>
        <Button>Открыть</Button>
        <Popover.Content>
          <Popover.Dialog>Содержимое</Popover.Dialog>
        </Popover.Content>
      </Popover>,
    );

    await user.click(screen.getByRole("button", {name: "Открыть"}));
    await user.keyboard("{Escape}");

    expect(onOpenChange).toHaveBeenCalledTimes(2);
    expect(onOpenChange).toHaveBeenNthCalledWith(1, true);
    expect(onOpenChange).toHaveBeenNthCalledWith(2, false);
  });

  it("ведёт себя одинаково как Popover.Root и PopoverRoot", () => {
    render(
      <>
        <PopoverRoot>
          <Popover.Trigger aria-label="Триггер поповера">плоский</Popover.Trigger>
          <Popover.Content>
            <Popover.Dialog>Плоский поповер</Popover.Dialog>
          </Popover.Content>
        </PopoverRoot>
        <Popover.Root>
          <Popover.Trigger aria-label="Триггер поповера">именованный</Popover.Trigger>
          <Popover.Content>
            <Popover.Dialog>Именованный поповер</Popover.Dialog>
          </Popover.Content>
        </Popover.Root>
      </>,
    );

    expect(document.querySelectorAll('[data-slot="popover-trigger"]')).toHaveLength(2);
  });
});
