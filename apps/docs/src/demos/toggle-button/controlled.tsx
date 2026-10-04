"use client";

import {Heart, HeartFill} from "@gravity-ui/icons";
import {ToggleButton} from "@peakui/react";
import {useState} from "react";

export function Controlled() {
  const [isSelected, setIsSelected] = useState(false);

  return (
    <div className="flex flex-col items-center gap-3">
      <ToggleButton isSelected={isSelected} onChange={setIsSelected}>
        {({isSelected: selected}) => (
          <>
            {selected ? <HeartFill /> : <Heart />}
            {selected ? "Liked" : "Like"}
          </>
        )}
      </ToggleButton>
      <p className="text-sm text-muted">Status: {isSelected ? "Selected" : "Not selected"}</p>
    </div>
  );
}
