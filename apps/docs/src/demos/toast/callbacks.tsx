"use client";

import {Button, toast} from "@peakui/react";
import {useState} from "react";

export function Callbacks() {
  const [closedHistory, setClosedHistory] = useState<Array<{message: string; time: string}>>([]);

  const addToHistory = (message: string) => {
    const time = new Date().toLocaleTimeString();

    setClosedHistory((prev) => [{message, time}, ...prev].slice(0, 5));
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex flex-wrap items-center justify-center gap-4">
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
  );
}
