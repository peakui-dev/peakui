import {Accordion} from "@peakui/react";

const items = [
  {
    content: "Browse the catalog, add items to your cart and check out.",
    id: "order",
    title: "How do I place an order?",
  },
  {
    content: "Orders can be changed or cancelled until they ship.",
    id: "cancel",
    title: "Can I cancel my order?",
  },
  {
    content: "We accept all major credit cards.",
    id: "payment",
    title: "What payment methods do you accept?",
  },
];

export function MultipleExpanded() {
  return (
    <Accordion allowsMultipleExpanded className="w-full max-w-md">
      {items.map((item) => (
        <Accordion.Item key={item.id} id={item.id}>
          <Accordion.Heading>
            <Accordion.Trigger>
              {item.title}
              <Accordion.Indicator />
            </Accordion.Trigger>
          </Accordion.Heading>
          <Accordion.Panel>
            <Accordion.Body>{item.content}</Accordion.Body>
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion>
  );
}
