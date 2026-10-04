import {Breadcrumbs} from "@peakui/react";

export function CustomSeparator() {
  return (
    <Breadcrumbs separator={<span aria-hidden="true">/</span>}>
      <Breadcrumbs.Item href="#">Home</Breadcrumbs.Item>
      <Breadcrumbs.Item href="#">Products</Breadcrumbs.Item>
      <Breadcrumbs.Item>Laptop</Breadcrumbs.Item>
    </Breadcrumbs>
  );
}
