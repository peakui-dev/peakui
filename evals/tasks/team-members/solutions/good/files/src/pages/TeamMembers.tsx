import type {Member, TeamMembersProps} from "../types";

import {Button, Chip, Dropdown, Label, Modal, Tooltip, toast} from "@peakui/react";
import {useState} from "react";

export function TeamMembers({members, onRemove}: TeamMembersProps) {
  const [removing, setRemoving] = useState<Member | null>(null);

  function confirmRemoval() {
    if (!removing) return;

    onRemove(removing.id);
    setRemoving(null);
    toast("Member removed");
  }

  return (
    <>
      <ul className="flex flex-col gap-2">
        {members.map((member) => (
          <li key={member.id} className="flex items-center gap-3">
            <span className="flex-1">{member.name}</span>
            <Chip size="sm">{member.role}</Chip>
            <Dropdown>
              <Tooltip>
                <Button isIconOnly aria-label="Member actions" variant="ghost">
                  ⋯
                </Button>
                <Tooltip.Content>Member actions</Tooltip.Content>
              </Tooltip>
              <Dropdown.Popover>
                <Dropdown.Menu
                  onAction={(key) => {
                    if (key === "remove") setRemoving(member);
                  }}
                >
                  <Dropdown.Item id="change-role" textValue="Change role">
                    <Label>Change role</Label>
                  </Dropdown.Item>
                  <Dropdown.Item id="remove" textValue="Remove" variant="danger">
                    <Label>Remove</Label>
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown>
          </li>
        ))}
      </ul>
      <Modal.Backdrop
        isOpen={removing !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setRemoving(null);
        }}
      >
        <Modal.Container>
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>Remove member?</Modal.Heading>
            </Modal.Header>
            <Modal.Body>{removing?.name} will lose access to the team.</Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onPress={() => setRemoving(null)}>
                Cancel
              </Button>
              <Button variant="danger" onPress={confirmRemoval}>
                Remove
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </>
  );
}
