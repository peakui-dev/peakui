import {Tabs} from "@peakui/react";

const items = [
  {id: "overview", label: "Overview"},
  {id: "analytics", label: "Analytics"},
  {id: "reports", label: "Reports"},
  {id: "performance", label: "Performance"},
  {id: "engagement", label: "Engagement"},
  {id: "audience", label: "Audience"},
  {id: "acquisition", label: "Acquisition"},
  {id: "retention", label: "Retention"},
  {id: "settings", label: "Settings"},
];

export function Overflow() {
  return (
    <div className="w-[360px]">
      <Tabs>
        <Tabs.ListContainer>
          <Tabs.List aria-label="Sections">
            {items.map((item) => (
              <Tabs.Tab key={item.id} id={item.id}>
                {item.label}
                <Tabs.Indicator />
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs.ListContainer>
        {items.map((item) => (
          <Tabs.Panel key={item.id} id={item.id}>
            {item.label} panel content.
          </Tabs.Panel>
        ))}
      </Tabs>
    </div>
  );
}
