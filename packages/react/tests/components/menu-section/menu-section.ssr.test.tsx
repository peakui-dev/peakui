import {ssrSmoke} from "@peakui/testing/helpers";
import {Menu as MenuPrimitive, MenuTrigger, Popover} from "react-aria-components/Menu";

import {Button} from "@/components/button";
import {MenuItem} from "@/components/menu-item/index.ts";
import {MenuSection} from "@/components/menu-section/index.ts";

/*
 * Секция меню живёт только внутри Menu, поэтому дымовая фикстура SSR — закрытый триггер с
 * полным деревом внутри: гидратация проходит без расхождений, пока меню закрыто.
 */
describe("MenuSection SSR", () => {
  it("renders without hydration mismatch when closed", async () => {
    await ssrSmoke(
      <MenuTrigger>
        <Button>Действия</Button>
        <Popover>
          <MenuPrimitive>
            <MenuSection>
              <MenuItem id="new-file" textValue="Новый файл">
                Новый файл
              </MenuItem>
            </MenuSection>
          </MenuPrimitive>
        </Popover>
      </MenuTrigger>,
    );
  });
});
