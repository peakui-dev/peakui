import {ssrSmoke} from "@peakui/testing/helpers";

import {Dropdown} from "@/components/dropdown/index.ts";
import {Label} from "@/components/label/index.ts";

/*
 * Фикстура эталона: закрытый и открытый по умолчанию дропдаун. Пока меню закрыто, оверлей не
 * монтируется, и гидратация тривиальна; defaultOpen проверяет совпадение на смонтированном меню.
 */
const Fixture = ({defaultOpen = false}: {defaultOpen?: boolean} = {}) => (
  <Dropdown defaultOpen={defaultOpen}>
    <Dropdown.Trigger aria-label="Меню">Действия</Dropdown.Trigger>
    <Dropdown.Popover>
      <Dropdown.Menu>
        <Dropdown.Item id="new-file" textValue="Новый файл">
          <Label>Новый файл</Label>
        </Dropdown.Item>
        <Dropdown.Item id="copy-link" textValue="Копировать ссылку">
          <Label>Копировать ссылку</Label>
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown.Popover>
  </Dropdown>
);

describe("Dropdown SSR", () => {
  it("renders without hydration mismatch when closed", async () => {
    await ssrSmoke(<Fixture />);
  });

  it("renders without hydration mismatch when defaultOpen", async () => {
    await ssrSmoke(<Fixture defaultOpen />);
  });
});
