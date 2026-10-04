import {ssrSmoke} from "@peakui/testing/helpers";

import {Alert} from "@/components/alert";

describe("Alert SSR", () => {
  it("рендерится без расхождения гидратации с дефолтными пропсами", async () => {
    const {html} = await ssrSmoke(
      <Alert>
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>Заголовок</Alert.Title>
          <Alert.Description>Описание</Alert.Description>
        </Alert.Content>
      </Alert>,
    );

    expect(html).toContain('data-slot="alert-root"');
    expect(html).toContain('data-slot="alert-default-icon"');
  });

  it("рендерится без расхождения гидратации со статусом danger", async () => {
    const {html} = await ssrSmoke(
      <Alert status="danger">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>Заголовок</Alert.Title>
        </Alert.Content>
      </Alert>,
    );

    expect(html).toContain("alert--danger");
    expect(html).toContain('data-slot="alert-title"');
  });
});
