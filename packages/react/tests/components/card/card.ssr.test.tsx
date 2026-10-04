import {ssrSmoke} from "@peakui/testing/helpers";

import {Card} from "@/components/card";

describe("Card SSR", () => {
  it("рендерится без расхождения гидратации с составным контентом", async () => {
    const {html} = await ssrSmoke(
      <Card>
        <Card.Header>
          <Card.Title>Заголовок</Card.Title>
          <Card.Description>Описание</Card.Description>
        </Card.Header>
        <Card.Content>Контент</Card.Content>
        <Card.Footer>Футер</Card.Footer>
      </Card>,
    );

    expect(html).toContain('data-slot="card"');
    expect(html).toContain('data-slot="card-title"');
  });

  it("рендерится без расхождения гидратации с вариантом secondary", async () => {
    const {html} = await ssrSmoke(<Card variant="secondary">Тело</Card>);

    expect(html).toContain("card--secondary");
  });
});
