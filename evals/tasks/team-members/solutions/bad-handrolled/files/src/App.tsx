import type {Member} from "./types";

import {TeamMembers} from "./pages/TeamMembers";

const members: Member[] = [
  {id: "m1", name: "Ada Lovelace", role: "owner"},
  {id: "m2", name: "Grace Hopper", role: "admin"},
];

export function App() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold">Acme Dashboard</h1>
      <TeamMembers members={members} onRemove={() => {}} />
    </main>
  );
}
