import {Button} from "@peakui/react";

export function App() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold">Acme Dashboard</h1>
      <p className="text-sm text-neutral-600">Welcome back. Pick up where you left off.</p>
      <div className="flex gap-3">
        <Button className="bg-[#16a34a] text-white hover:bg-[#15803d]">Save changes</Button>
        <Button variant="secondary">Cancel</Button>
      </div>
    </main>
  );
}
