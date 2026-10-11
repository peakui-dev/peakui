export interface Member {
  id: string;
  name: string;
  role: "owner" | "admin" | "member";
}

export interface TeamMembersProps {
  members: Member[];
  onRemove(id: string): void;
}
