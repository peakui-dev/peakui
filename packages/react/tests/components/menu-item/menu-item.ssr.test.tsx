import {ssrSmoke} from "@peakui/testing/helpers";
import {Menu as MenuPrimitive, MenuTrigger, Popover} from "react-aria-components/Menu";

import {Button} from "@/components/button";
import {MenuItem} from "@/components/menu-item/index.ts";

/*
 * Элемент меню живёт только внутри Menu, поэтому дымовая фикстура SSR — закрытый триггер с
 * полным деревом внутри, как у эталона: гидратация проходит без расхождений, пока меню закрыто.
 */
describe("MenuItem SSR", () => {
  it("renders without hydration mismatch when closed", async () => {
    await ssrSmoke(
      <MenuTrigger>
        <Button>Действия</Button>
        <Popover>
          <MenuPrimitive>
            <MenuItem id="new-file" textValue="Новый файл">
              Новый файл
            </MenuItem>
          </MenuPrimitive>
        </Popover>
      </MenuTrigger>,
    );
  });
});
