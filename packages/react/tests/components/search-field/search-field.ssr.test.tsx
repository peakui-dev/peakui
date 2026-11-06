import {ssrSmoke} from "@peakui/testing/helpers";
import {I18nProvider} from "react-aria-components/I18nProvider";

import {Label} from "@/components/label/index.ts";
import {SearchField} from "@/components/search-field/index.ts";

describe("SearchField SSR", () => {
  it("рендерится без рассинхронизации гидратации со значением по умолчанию", async () => {
    const {html} = await ssrSmoke(
      <SearchField defaultValue="пик" name="search">
        <Label>Поиск</Label>
        <SearchField.Group>
          <SearchField.SearchIcon />
          <SearchField.Input placeholder="Поиск..." />
          <SearchField.ClearButton />
        </SearchField.Group>
      </SearchField>,
    );

    expect(html).toContain('data-slot="search-field"');
    expect(html).toContain('data-slot="search-field-clear-button"');
  });

  it("гидрируется без расхождений при ru-RU", async () => {
    const {html} = await ssrSmoke(
      <I18nProvider locale="ru-RU">
        <SearchField defaultValue="пик" name="search">
          <Label>Поиск</Label>
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input placeholder="Поиск..." />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>
      </I18nProvider>,
    );

    expect(html).toContain('aria-label="Очистить поиск"');
  });
});
