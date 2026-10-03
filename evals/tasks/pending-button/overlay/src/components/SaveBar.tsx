export interface SaveBarProps {
  saving: boolean;
  onSave: () => void;
}

export function SaveBar(_props: SaveBarProps) {
  return <div className="flex justify-end border-t border-neutral-200 p-4"></div>;
}
