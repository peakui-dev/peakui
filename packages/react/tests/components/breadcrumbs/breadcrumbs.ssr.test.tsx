import {ssrSmoke} from "@peakui/testing/helpers";

import {Breadcrumbs, BreadcrumbsItem} from "@/components/breadcrumbs";

describe("Breadcrumbs SSR", () => {
  it("рендерится без расхождения гидратации с цепочкой по умолчанию", async () => {
    const {html} = await ssrSmoke(
      <Breadcrumbs>
        <BreadcrumbsItem href="/">Главная</BreadcrumbsItem>
        <BreadcrumbsItem>Ноутбуки</BreadcrumbsItem>
      </Breadcrumbs>,
    );

    expect(html).toContain('data-slot="breadcrumbs"');
    expect(html).toContain('data-slot="breadcrumbs-item"');
    expect(html).toContain('data-current="true"');
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('data-slot="breadcrumbs-separator"');
  });

  it("рендерится без расхождения гидратации с кастомным разделителем", async () => {
    const {html} = await ssrSmoke(
      <Breadcrumbs separator={<span>/</span>}>
        <BreadcrumbsItem href="/">Главная</BreadcrumbsItem>
        <BreadcrumbsItem>Ноутбуки</BreadcrumbsItem>
      </Breadcrumbs>,
    );

    expect(html).toContain('data-slot="breadcrumbs-separator"');
    expect(html).toContain("/");
  });
});
