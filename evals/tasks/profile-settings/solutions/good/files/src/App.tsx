import type {Profile} from "./types";

import {ProfileSettings} from "./pages/ProfileSettings";

const profile: Profile = {
  bio: "",
  displayName: "Ada Lovelace",
  email: "ada@acme.example",
  newsletter: false,
  plan: "free",
};

export function App() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold">Acme Dashboard</h1>
      <ProfileSettings profile={profile} saving={false} onSave={() => {}} />
    </main>
  );
}
