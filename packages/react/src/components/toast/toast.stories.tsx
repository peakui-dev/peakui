import type {ToastContentValue, ToastVariants} from "./index.ts";
import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ComponentProps, ReactNode} from "react";

import React from "react";

import {Button} from "../button/index.ts";
import {Modal} from "../modal/index.ts";

import {
  DEFAULT_TOAST_TIMEOUT,
  Toast,
  ToastContent,
  ToastDescription,
  ToastIndicator,
  ToastQueue,
  ToastTitle,
  toast,
} from "./index.ts";

/*
 * Story-local glyphs, inlined verbatim from @gravity-ui/icons (MIT) — the same source the
 * internal icons module keeps; see THIRD-PARTY-NOTICES.md. The reference story reaches for
 * an iconify runtime; stories here stay dependency-free.
 */
interface IconProps extends ComponentProps<"svg"> {}

const PersonsIcon = (props: IconProps) => (
  <svg fill="none" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      clipRule="evenodd"
      d="M5.5 6a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3m0 1.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6m-3.029 2.886c-.777.54-.971 1.063-.971 1.306 0 .446.362.808.808.808h6.384a.81.81 0 0 0 .808-.808c0-.244-.194-.767-.971-1.306C7.792 9.875 6.719 9.5 5.5 9.5s-2.292.375-3.029.886M0 11.692C0 9.846 2.475 8 5.5 8c1.18 0 2.278.281 3.177.734A5.67 5.67 0 0 1 11.5 8c2.475 0 4.5 1.538 4.5 3.077A1.923 1.923 0 0 1 14.077 13h-3.483c-.416.604-1.113 1-1.902 1H2.308A2.31 2.31 0 0 1 0 11.692m10.991-.192h3.086c.234 0 .423-.19.423-.423 0-.103-.096-.472-.688-.89-.554-.393-1.375-.687-2.312-.687-.517 0-.999.09-1.42.236.526.534.854 1.146.911 1.764M12.5 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0M14 5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);

const HardDriveIcon = (props: IconProps) => (
  <svg fill="none" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      clipRule="evenodd"
      d="M12 8.5a1.5 1.5 0 0 1 1.5 1.5v1a1.5 1.5 0 0 1-1.5 1.5H4A1.5 1.5 0 0 1 2.5 11v-1A1.5 1.5 0 0 1 4 8.5zm.89-1.366L11.488 4.33a1.5 1.5 0 0 0-1.342-.829H5.854a1.5 1.5 0 0 0-1.342.83L3.11 7.133A3 3 0 0 1 4 7h8a3 3 0 0 1 .89.134M15 9.18V11a3 3 0 0 1-3 3H4a3 3 0 0 1-3-3V9.18a5 5 0 0 1 .528-2.236L3.17 3.658A3 3 0 0 1 5.854 2h4.292a3 3 0 0 1 2.683 1.658l1.643 3.286A5 5 0 0 1 15 9.18m-6 .57a.75.75 0 0 0 0 1.5h2.5a.75.75 0 0 0 0-1.5z"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);

const StarIcon = (props: IconProps) => (
  <svg fill="none" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      clipRule="evenodd"
      d="m9.194 5 .351.873.94.064 3.197.217-2.46 2.055-.722.603.23.914.782 3.108-2.714-1.704L8 10.629l-.798.5-2.714 1.705.782-3.108.23-.914-.723-.603-2.46-2.055 3.198-.217.94-.064.35-.874L8 2.025zm-7.723-.292 3.943-.268L6.886.773C7.29-.231 8.71-.231 9.114.773l1.472 3.667 3.943.268c1.08.073 1.518 1.424.688 2.118L12.185 9.36l.964 3.832c.264 1.05-.886 1.884-1.802 1.31L8 12.4l-3.347 2.101c-.916.575-2.066-.26-1.802-1.309l.964-3.832L.783 6.826c-.83-.694-.391-2.045.688-2.118"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);

const BellIcon = (props: IconProps) => (
  <svg fill="none" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      clipRule="evenodd"
      d="m4.665 7.822.62-3.096a2.77 2.77 0 0 1 5.43 0l.62 3.096a4.8 4.8 0 0 0 1.305 2.44l.194.193a.567.567 0 0 1-.273.953l-.821.19a16.6 16.6 0 0 1-7.48 0l-.82-.19a.567.567 0 0 1-.274-.953l.194-.193a4.77 4.77 0 0 0 1.305-2.44m-1.47-.294.619-3.096a4.27 4.27 0 0 1 8.372 0l.62 3.096c.126.634.438 1.216.895 1.673l.194.194a2.066 2.066 0 0 1-.997 3.475l-.821.19q-1.053.24-2.12.358a2 2 0 0 1-3.913 0 18 18 0 0 1-2.12-.359l-.822-.19a2.067 2.067 0 0 1-.997-3.474L2.3 9.2c.457-.457.769-1.04.895-1.673"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);

type Placement = NonNullable<ToastVariants["placement"]>;

/*
 * Every story carries a level-two heading: the audit in apps/storybook/e2e waits for it as the
 * sign that the preview is ready, and without it axe runs against an empty iframe and passes.
 */
const Showcase = ({children, title}: {children: ReactNode; title: string}) => (
  <div className="flex flex-col gap-4 bg-background p-6">
    <h2 className="text-sm font-medium text-foreground">{title}</h2>
    {children}
  </div>
);

const meta = {
  parameters: {
    layout: "padded",
  },
  title: "Components/Toast",
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <Showcase title="Default">
      <div className="flex h-full max-w-xl flex-col items-center justify-center">
        <Toast.Provider placement="bottom" />
        <div className="flex w-full flex-wrap items-center justify-center gap-4">
          <Button
            className="text-muted"
            size="sm"
            variant="tertiary"
            onPress={() => {
              const id = toast("You have been invited to join a team", {
                actionProps: {
                  children: "Dismiss",
                  onPress: () => toast.close(id),
                  variant: "tertiary",
                },
                description: "Bob sent you an invitation to join the team",
                indicator: <PersonsIcon />,
                variant: "default",
              });
            }}
          >
            Default toast
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onPress={() => {
              const id = toast.info("You have 2 credits left", {
                actionProps: {children: "Upgrade", onPress: () => toast.close(id)},
                description: "Get a paid plan for more credits",
              });
            }}
          >
            Accent toast
          </Button>
          <Button
            className="text-success"
            size="sm"
            variant="tertiary"
            onPress={() => {
              const id = toast.success("You have upgraded your plan", {
                actionProps: {
                  children: "Billing",
                  className: "bg-success text-success-foreground",
                  onPress: () => toast.close(id),
                },
                description: "You can continue using the app",
              });
            }}
          >
            Success toast
          </Button>
          <Button
            className="text-warning"
            size="sm"
            variant="tertiary"
            onPress={() => {
              const id = toast.warning("You have no credits left", {
                actionProps: {
                  children: "Upgrade",
                  className: "bg-warning text-warning-foreground",
                  onPress: () => toast.close(id),
                },
                description: "Upgrade to a paid plan to continue",
              });
            }}
          >
            Warning toast
          </Button>
          <Button
            size="sm"
            variant="danger-soft"
            onPress={() => {
              const id = toast.danger("Storage is full", {
                actionProps: {
                  children: "Remove",
                  onPress: () => toast.close(id),
                  variant: "danger",
                },
                description:
                  "Remove files to release space. Adding more text to demonstrate longer content display",
                indicator: <HardDriveIcon />,
              });
            }}
          >
            Danger toast
          </Button>
        </div>
      </div>
    </Showcase>
  ),
};

const placements = ["top start", "top", "top end", "bottom start", "bottom", "bottom end"] as const;

// Create a separate queue for each placement
const placementQueues = Object.fromEntries(
  placements.map((p) => [p, new ToastQueue({maxVisibleToasts: 3})]),
) as Record<Placement, ToastQueue>;

export const Placements: Story = {
  render: () => {
    const showToast = (placement: Placement) => {
      placementQueues[placement].add({
        description: "Event has been created",
        title: "Event created",
        variant: "default",
      });
    };

    return (
      <Showcase title="Placements">
        <div className="flex h-full flex-col items-center justify-center gap-6">
          {/* Render a ToastProvider for each placement */}
          {placements.map((p) => (
            <Toast.Provider key={p} placement={p} queue={placementQueues[p]} />
          ))}
          <div className="flex max-w-xs flex-wrap justify-center gap-2">
            {placements.map((p) => (
              <Button key={p} size="sm" variant="secondary" onPress={() => showToast(p)}>
                {p}
              </Button>
            ))}
          </div>
        </div>
      </Showcase>
    );
  },
};

// Expanded - Keep the stack open at natural height
const expandedQueue = new ToastQueue();

export const Expanded: Story = {
  render: () => (
    <Showcase title="Expanded">
      <div className="flex h-full max-w-xl flex-col items-center justify-center">
        <Toast.Provider
          isExpanded
          aria-label="Expanded notifications"
          placement="bottom"
          queue={expandedQueue}
        />
        <Button
          size="sm"
          variant="secondary"
          onPress={() => {
            expandedQueue.add({
              title: "Simple message",
              variant: "default",
            });
            setTimeout(() => {
              expandedQueue.add({
                title: "Operation completed",
                variant: "success",
              });
            }, 400);
            setTimeout(() => {
              expandedQueue.add({
                title: "New update available",
                variant: "accent",
              });
            }, 800);
          }}
        >
          Show 3 toasts
        </Button>
      </div>
    </Showcase>
  ),
};

// Simple Toast - Title only, minimal examples
export const SimpleToast: Story = {
  render: () => (
    <Showcase title="Simple Toast">
      <div className="flex h-full max-w-xl flex-col items-center justify-center">
        <Toast.Provider placement="bottom" />
        <div className="flex w-full flex-wrap items-center justify-center gap-4">
          <Button size="sm" variant="secondary" onPress={() => toast("Simple message")}>
            Default
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onPress={() => toast.success("Operation completed")}
          >
            Success
          </Button>
          <Button size="sm" variant="secondary" onPress={() => toast.info("New update available")}>
            Info
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onPress={() => toast.warning("Please check your settings")}
          >
            Warning
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onPress={() => toast.danger("Something went wrong")}
          >
            Error
          </Button>
        </div>
      </div>
    </Showcase>
  ),
};

// Promise Toast - Async operations with loading/success/error states
export const PromiseToast: Story = {
  render: () => {
    const uploadFile = (): Promise<{filename: string; size: number}> => {
      return new Promise((resolve) => {
        setTimeout(() => resolve({filename: "document.pdf", size: 1024}), 2000);
      });
    };

    const createEvent = (): Promise<never> => {
      return new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Network error. Please try again.")), 2000);
      });
    };

    const saveData = (): Promise<{count: number}> => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if (Math.random() > 0.5) {
            resolve({count: 42});
          } else {
            reject(new Error("Failed to save data"));
          }
        }, 2000);
      });
    };

    const fetchUser = (): Promise<{name: string; email: string}> => {
      return new Promise((resolve) => {
        setTimeout(() => resolve({name: "John Doe", email: "john@example.com"}), 2000);
      });
    };

    return (
      <Showcase title="Promise Toast">
        <div className="flex h-full max-w-xl flex-col items-center justify-center">
          <Toast.Provider placement="bottom" />
          <div className="flex w-full flex-wrap items-center justify-center gap-4">
            <Button
              size="sm"
              variant="secondary"
              onPress={() => {
                toast.promise(uploadFile(), {
                  error: "Failed to upload file",
                  loading: "Uploading file...",
                  success: (data) => `File ${data.filename} uploaded (${data.size}KB)`,
                });
              }}
            >
              Upload file
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onPress={() => {
                toast.promise(createEvent(), {
                  error: (err) => err.message,
                  loading: "Creating event...",
                  success: "Event created",
                });
              }}
            >
              Create event (error)
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onPress={() => {
                toast.promise(saveData(), {
                  error: (err) => err.message,
                  loading: "Saving changes...",
                  success: (data) => `Saved ${data.count} items`,
                });
              }}
            >
              Save data (random)
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onPress={() => {
                toast.promise(fetchUser(), {
                  error: "Failed to fetch user",
                  loading: "Loading user...",
                  success: (data) => `Welcome back, ${data.name}!`,
                });
              }}
            >
              Fetch user
            </Button>
          </div>
        </div>
      </Showcase>
    );
  },
};

// Custom Indicator - Custom or no indicators
export const CustomIndicator: Story = {
  render: () => (
    <Showcase title="Custom Indicator">
      <div className="flex h-full max-w-xl flex-col items-center justify-center">
        <Toast.Provider placement="bottom" />
        <Button
          size="sm"
          variant="secondary"
          onPress={() =>
            toast("Custom icon indicator", {
              indicator: <StarIcon />,
            })
          }
        >
          Custom indicator
        </Button>
      </div>
    </Showcase>
  ),
};

// Loading State - Manual loading toasts
export const LoadingState: Story = {
  render: () => (
    <Showcase title="Loading State">
      <div className="flex h-full max-w-xl flex-col items-center justify-center">
        <Toast.Provider placement="bottom" />
        <div className="flex w-full flex-wrap items-center justify-center gap-4">
          <Button
            size="sm"
            variant="secondary"
            onPress={() => {
              const loadingId = toast("Uploading file...", {
                description: "Please wait while we upload your file",
                isLoading: true,
                timeout: 0,
              });

              setTimeout(() => {
                toast.update(loadingId, "File uploaded", {
                  description: "Your file has been uploaded successfully",
                  timeout: DEFAULT_TOAST_TIMEOUT,
                  variant: "success",
                });
              }, 3000);
            }}
          >
            Upload with loading
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onPress={() => {
              const loadingId = toast("Processing payment...", {
                isLoading: true,
                timeout: 0,
              });

              setTimeout(() => {
                toast.update(loadingId, "Payment processed", {
                  description: "Your payment has been processed successfully",
                  timeout: DEFAULT_TOAST_TIMEOUT,
                  variant: "success",
                });
              }, 2500);
            }}
          >
            Payment processing
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onPress={() => {
              const loadingId = toast("Saving changes...", {
                isLoading: true,
                timeout: 0,
              });

              setTimeout(() => {
                toast.update(loadingId, "Failed to save", {
                  description: "Please try again",
                  timeout: DEFAULT_TOAST_TIMEOUT,
                  variant: "danger",
                });
              }, 2000);
            }}
          >
            Loading to error
          </Button>
        </div>
      </div>
    </Showcase>
  ),
};

// With Callbacks - Timeout and onClose
export const WithCallbacks: Story = {
  render: () => {
    const [closedHistory, setClosedHistory] = React.useState<
      Array<{message: string; time: string}>
    >([]);

    const addToHistory = (message: string) => {
      const time = new Date().toLocaleTimeString();

      setClosedHistory((prev) => [{message, time}, ...prev].slice(0, 5));
    };

    return (
      <Showcase title="With Callbacks">
        <div className="flex h-full max-w-2xl flex-col items-center justify-center gap-6">
          <Toast.Provider placement="bottom" />

          {/* Toast Buttons */}
          <div className="flex w-full flex-wrap items-center justify-center gap-4">
            <Button
              size="sm"
              variant="secondary"
              onPress={() =>
                toast("File saved", {
                  onClose: () => {
                    addToHistory("File saved (closed after 3 seconds)");
                  },
                  timeout: 3000,
                })
              }
            >
              Custom timeout (3s)
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onPress={() =>
                toast("Changes saved", {
                  onClose: () => {
                    addToHistory("Changes saved (closed after 10 seconds)");
                  },
                  timeout: 10000,
                })
              }
            >
              Custom timeout (10s)
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onPress={() =>
                toast.success("Event created", {
                  onClose: () => {
                    addToHistory("Event created (closed after default timeout)");
                  },
                })
              }
            >
              With onClose callback
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onPress={() =>
                toast("Important notification", {
                  description: "This toast will stay until dismissed",
                  onClose: () => {
                    addToHistory("Important notification (manually closed)");
                  },
                  timeout: 0,
                })
              }
            >
              Persistent toast
            </Button>
          </div>

          {/* Closed History Panel */}
          <div className="w-full space-y-2">
            <h3 className="text-sm font-medium">Closed History</h3>
            <div className="min-h-[60px] space-y-2 rounded-lg border border-border bg-surface p-4 text-sm">
              {closedHistory.length === 0 ? (
                <p className="text-muted">No toasts closed yet. Try closing one above!</p>
              ) : (
                closedHistory.map((item, index) => (
                  <div key={`${item.time}-${index}`} className="flex items-center justify-between">
                    <span className="font-medium">{item.message}</span>
                    <span className="text-xs text-muted">({item.time})</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </Showcase>
    );
  },
};

// Custom Toast - Custom rendering with children
export const CustomToast: Story = {
  render: () => {
    const customQueue = new ToastQueue();

    return (
      <Showcase title="Custom Toast">
        <div className="flex h-full max-w-xl flex-col items-center justify-center">
          <Toast.Provider placement="bottom" queue={customQueue}>
            {({toast: toastItem}) => {
              const content = toastItem.content as ToastContentValue;

              return (
                <Toast
                  className="rounded-xl border border-border"
                  toast={toastItem}
                  variant={content.variant}
                >
                  <ToastContent>
                    <div className="flex items-center gap-2">
                      <ToastIndicator className="text-accent" variant={content.variant} />
                      <div className="flex flex-col pe-6">
                        {content.title ? (
                          <ToastTitle className="text-accent">{content.title}</ToastTitle>
                        ) : null}
                        {content.description ? (
                          <ToastDescription>{content.description}</ToastDescription>
                        ) : null}
                      </div>
                    </div>
                  </ToastContent>
                  <Toast.CloseButton className="absolute end-2 top-1/2 -translate-y-1/2 border-none bg-transparent opacity-100 [&>svg]:size-4" />
                </Toast>
              );
            }}
          </Toast.Provider>
          <Button
            size="sm"
            variant="secondary"
            onPress={() => {
              customQueue.add({
                description: "This uses a custom render function",
                title: "Custom layout toast",
                variant: "default",
              });
            }}
          >
            Custom toast
          </Button>
        </div>
      </Showcase>
    );
  },
};

// Custom Queue - Multiple queue instances
export const CustomQueue: Story = {
  render: () => {
    const notificationQueue = new ToastQueue({maxVisibleToasts: 2});
    const errorQueue = new ToastQueue({maxVisibleToasts: 3});
    const successQueue = new ToastQueue({maxVisibleToasts: 1});

    return (
      <Showcase title="Custom Queue">
        <div className="flex h-full max-w-4xl items-center justify-center gap-4">
          {/* Notification Queue */}
          <Toast.Provider placement="bottom" queue={notificationQueue} />
          <div className="flex justify-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onPress={() => {
                notificationQueue.add({
                  description: "You have a new message",
                  title: "New notification",
                  variant: "default",
                });
              }}
            >
              Add notification (max 2)
            </Button>
          </div>

          {/* Error Queue */}
          <Toast.Provider placement="top" queue={errorQueue} />
          <div className="flex justify-center gap-2">
            <Button
              size="sm"
              variant="danger-soft"
              onPress={() => {
                errorQueue.add({
                  description: "Failed to save changes",
                  title: "Error occurred",
                  variant: "danger",
                });
              }}
            >
              Add error (max 3)
            </Button>
          </div>

          {/* Success Queue */}
          <Toast.Provider placement="bottom end" queue={successQueue} />
          <div className="flex justify-center gap-2">
            <Button
              className="text-success"
              size="sm"
              variant="secondary"
              onPress={() => {
                successQueue.add({
                  description: "All changes applied",
                  title: "Success!",
                  variant: "success",
                });
              }}
            >
              Add success (max 1)
            </Button>
          </div>
        </div>
      </Showcase>
    );
  },
};

// Toast in Modal - toasts stay visible above a full-screen overlay (modal)
export const ToastInModal: Story = {
  render: () => (
    <Showcase title="Toast In Modal">
      <div className="flex h-full flex-col items-center justify-center">
        <Toast.Provider placement="bottom" />
        <Modal>
          <Button size="sm" variant="secondary">
            Open modal
          </Button>
          <Modal.Backdrop>
            <Modal.Container>
              <Modal.Dialog className="sm:max-w-[360px]">
                <Modal.CloseTrigger />
                <Modal.Header>
                  <Modal.Icon className="bg-default text-foreground">
                    <BellIcon className="size-5" />
                  </Modal.Icon>
                  <Modal.Heading>Notifications</Modal.Heading>
                </Modal.Header>
                <Modal.Body>
                  <p>Trigger a toast from inside the modal to see it render above the backdrop.</p>
                </Modal.Body>
                <Modal.Footer>
                  <Button
                    className="w-full"
                    variant="secondary"
                    onPress={() =>
                      toast.success("Settings saved", {
                        description: "Your changes have been applied",
                      })
                    }
                  >
                    Show toast
                  </Button>
                </Modal.Footer>
              </Modal.Dialog>
            </Modal.Container>
          </Modal.Backdrop>
        </Modal>
      </div>
    </Showcase>
  ),
};
