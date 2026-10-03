import {useState} from "react";

import {SaveBar} from "./components/SaveBar";

export function App() {
  const [saving, setSaving] = useState(false);

  const save = () => {
    setSaving(true);
    window.setTimeout(() => setSaving(false), 1500);
  };

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold">Acme Dashboard</h1>
      <p className="text-sm text-neutral-600">Welcome back. Pick up where you left off.</p>
      <SaveBar saving={saving} onSave={save} />
    </main>
  );
}
