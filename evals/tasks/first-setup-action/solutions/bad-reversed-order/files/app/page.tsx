import {CopyInviteButton} from "@/components/CopyInviteButton";
import {getPlan} from "@/lib/plan";

export default async function Home() {
  const plan = await getPlan();

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 p-8">
      <h1 className="text-2xl font-semibold">Acme</h1>
      <p>
        Plan: {plan.name} ({plan.seats} seats)
      </p>
      <CopyInviteButton />
    </main>
  );
}
