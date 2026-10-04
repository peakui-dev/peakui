import {Sparkles} from "@gravity-ui/icons";
import {Button, Modal} from "@peakui/react";

const ANIMATIONS = [
  {
    name: "Kinematic scale",
    description: "Spring-like scaling with high damping: fast response, long settling.",
    classNames: {
      backdrop: [
        "data-[entering]:duration-400",
        "data-[entering]:ease-[cubic-bezier(0.16,1,0.3,1)]",
        "data-[exiting]:duration-200",
        "data-[exiting]:ease-[cubic-bezier(0.7,0,0.84,0)]",
      ].join(" "),
      container: [
        "data-[entering]:animate-in",
        "data-[entering]:fade-in-0",
        "data-[entering]:zoom-in-95",
        "data-[entering]:duration-400",
        "data-[entering]:ease-[cubic-bezier(0.16,1,0.3,1)]",
        "data-[exiting]:animate-out",
        "data-[exiting]:fade-out-0",
        "data-[exiting]:zoom-out-95",
        "data-[exiting]:duration-200",
        "data-[exiting]:ease-[cubic-bezier(0.7,0,0.84,0)]",
      ].join(" "),
    },
  },
  {
    name: "Fluid slide",
    description: "Movement through a resisting medium: no mechanical linearity.",
    classNames: {
      backdrop: [
        "data-[entering]:duration-500",
        "data-[entering]:ease-[cubic-bezier(0.25,1,0.5,1)]",
        "data-[exiting]:duration-200",
        "data-[exiting]:ease-[cubic-bezier(0.5,0,0.75,0)]",
      ].join(" "),
      container: [
        "data-[entering]:animate-in",
        "data-[entering]:fade-in-0",
        "data-[entering]:slide-in-from-bottom-4",
        "data-[entering]:duration-500",
        "data-[entering]:ease-[cubic-bezier(0.25,1,0.5,1)]",
        "data-[exiting]:animate-out",
        "data-[exiting]:fade-out-0",
        "data-[exiting]:slide-out-to-bottom-2",
        "data-[exiting]:duration-200",
        "data-[exiting]:ease-[cubic-bezier(0.5,0,0.75,0)]",
      ].join(" "),
    },
  },
];

export function CustomAnimations() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {ANIMATIONS.map(({classNames, description, name}) => (
        <Modal key={name}>
          <Button variant="secondary">{name}</Button>
          <Modal.Backdrop className={classNames.backdrop}>
            <Modal.Container className={classNames.container}>
              <Modal.Dialog className="sm:max-w-[360px]">
                <Modal.CloseTrigger />
                <Modal.Header>
                  <Modal.Icon className="bg-default text-foreground">
                    <Sparkles className="size-5" />
                  </Modal.Icon>
                  <Modal.Heading>{name}</Modal.Heading>
                </Modal.Header>
                <Modal.Body>
                  <p className="mt-1">{description}</p>
                </Modal.Body>
                <Modal.Footer>
                  <Button slot="close" variant="tertiary">
                    Close
                  </Button>
                  <Button slot="close">Try again</Button>
                </Modal.Footer>
              </Modal.Dialog>
            </Modal.Container>
          </Modal.Backdrop>
        </Modal>
      ))}
    </div>
  );
}
