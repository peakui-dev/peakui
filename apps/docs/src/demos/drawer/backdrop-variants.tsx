import {Button, Drawer} from "@peakui/react";

const VARIANTS = ["opaque", "blur", "transparent"] as const;

export function BackdropVariants() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {VARIANTS.map((variant) => (
        <Drawer key={variant}>
          <Button variant="secondary">{variant}</Button>
          <Drawer.Backdrop variant={variant}>
            <Drawer.Content placement="right">
              <Drawer.Dialog>
                <Drawer.CloseTrigger />
                <Drawer.Header>
                  <Drawer.Heading>Backdrop: {variant}</Drawer.Heading>
                </Drawer.Header>
                <Drawer.Body>
                  <p>The backdrop variant sets how the page behind the panel is dimmed.</p>
                </Drawer.Body>
              </Drawer.Dialog>
            </Drawer.Content>
          </Drawer.Backdrop>
        </Drawer>
      ))}
    </div>
  );
}
