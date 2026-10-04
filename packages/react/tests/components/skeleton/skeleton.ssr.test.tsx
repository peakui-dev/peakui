import {ssrSmoke} from "@peakui/testing/helpers";

import {Skeleton} from "@/components/skeleton";

describe("Skeleton SSR", () => {
  it("рендерится без расхождения гидратации с дефолтными пропсами", async () => {
    const {html} = await ssrSmoke(<Skeleton className="h-3 w-24" />);

    expect(html).toContain('data-slot="skeleton"');
    expect(html).toContain("skeleton--shimmer");
  });

  it("рендерится без расхождения гидратации с каждым типом анимации", async () => {
    const none = await ssrSmoke(<Skeleton animationType="none" className="h-3 w-24" />);
    const pulse = await ssrSmoke(<Skeleton animationType="pulse" className="h-3 w-24" />);

    expect(none.html).toContain("skeleton--none");
    expect(pulse.html).toContain("skeleton--pulse");
  });
});
