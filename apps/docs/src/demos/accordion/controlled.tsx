"use client";

import {Accordion} from "@peakui/react";
import {useState} from "react";

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

export function Controlled() {
  const [expandedKeys, setExpandedKeys] = useState(new Set<string | number>(["order"]));

  return (
    <Accordion
      className="w-full max-w-md"
      expandedKeys={expandedKeys}
      onExpandedChange={setExpandedKeys}
    >
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
