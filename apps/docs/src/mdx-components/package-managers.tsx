"use client";

import {CodeBlock, Pre} from "fumadocs-ui/components/codeblock";

import {BunIcon, NpmSmallIcon, PnpmIcon, YarnIcon} from "@/icons/dev";

import {Tabs, TabsContent, TabsList, TabsTrigger} from "./tabs";

type PackageManagerName = "npm" | "yarn" | "pnpm" | "bun";

type PackageManager = {
  icon: React.ReactNode;
  name: PackageManagerName;
  label?: string;
};

const packageManagers: PackageManager[] = [
  {
    icon: <PnpmIcon className="text-foreground" />,
    name: "pnpm",
  },
  {
    icon: <NpmSmallIcon className="text-foreground" />,
    name: "npm",
  },
  {
    icon: <YarnIcon className="text-foreground" />,
    name: "yarn",
  },
  {
    icon: <BunIcon className="text-foreground" />,
    name: "bun",
  },
];

export interface PackageManagersProps {
  commands: Partial<Record<PackageManagerName, string>>;
}

export const PackageManagers = ({commands}: PackageManagersProps) => {
  // Get the first available command as default
  const availableManagers = packageManagers.filter((pm) => commands[pm.name]);
  const defaultValue = availableManagers[0]?.name || "npm";

  return (
    <Tabs className="mt-4 w-full min-w-[300px]" defaultValue={defaultValue}>
      <TabsList aria-label="Package manager" className="overflow-x-auto">
        {packageManagers.map(({label, name}) => {
          if (!commands[name]) return null;

          return (
            <TabsTrigger key={name} className="flex items-center gap-2" value={name}>
              <span>{label || name}</span>
            </TabsTrigger>
          );
        })}
      </TabsList>
      {packageManagers.map(({name}) => {
        if (!commands[name]) return null;

        return (
          <TabsContent key={name} value={name}>
            <CodeBlock lang="bash">
              <Pre className="px-3">{commands[name]}</Pre>
            </CodeBlock>
          </TabsContent>
        );
      })}
    </Tabs>
  );
};
