import type {TeamMembersProps} from "../types";

import {Button, Chip} from "@peakui/react";
import {useState} from "react";

export function TeamMembers({members, onRemove}: TeamMembersProps) {
  const [openFor, setOpenFor] = useState<string | null>(null);

  function remove(id: string) {
    setOpenFor(null);

    if (window.confirm("Remove member?")) {
      onRemove(id);
      window.alert("Member removed");
    }
  }

  return (
    <ul className="flex flex-col gap-2">
      {members.map((member) => (
        <li key={member.id} className="relative flex items-center gap-3">
          <span className="flex-1">{member.name}</span>
          <Chip size="sm">{member.role}</Chip>
          <span title="Member actions">
            <Button
              isIconOnly
              aria-label="Member actions"
              variant="ghost"
              onPress={() => setOpenFor(openFor === member.id ? null : member.id)}
            >
              ⋯
            </Button>
          </span>
          {openFor === member.id ? (
            <div className="absolute top-full right-0 flex flex-col rounded-md border bg-white p-1 shadow">
              <div className="cursor-pointer px-3 py-1" onClick={() => setOpenFor(null)}>
                Change role
              </div>
              <div className="cursor-pointer px-3 py-1" onClick={() => remove(member.id)}>
                Remove
              </div>
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
