import {Sparkles} from "@gravity-ui/icons";
import {Button, Modal} from "@peakui/react";

export function CustomBackdrop() {
  return (
    <Modal>
      <Button variant="secondary">Custom backdrop</Button>
      <Modal.Backdrop
        className="bg-linear-to-t from-black/80 via-black/40 to-transparent dark:from-zinc-800/80 dark:via-zinc-800/40"
        variant="blur"
      >
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-[360px]">
            <Modal.Header className="items-center text-center">
              <Modal.Icon className="bg-accent-soft text-accent-soft-foreground">
                <Sparkles className="size-5" />
              </Modal.Icon>
              <Modal.Heading>Premium backdrop</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <p>
                A gradient from dark bottom to transparent top, combined with a smooth blur; the
                intensity adapts to both color schemes.
              </p>
            </Modal.Body>
            <Modal.Footer className="flex-col-reverse">
              <Button className="w-full" slot="close">
                Amazing!
              </Button>
              <Button className="w-full" slot="close" variant="secondary">
                Close
              </Button>
            </Modal.Footer>
            <Modal.CloseTrigger />
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
