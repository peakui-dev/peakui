"use client";

import {Eye, EyeSlash} from "@gravity-ui/icons";
import {Button, InputGroup} from "@peakui/react";
import {useState} from "react";

export function WithButton() {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <InputGroup className="w-72">
      <InputGroup.Input
        aria-label="Password"
        defaultValue="correct horse"
        type={isVisible ? "text" : "password"}
      />
      <InputGroup.Suffix>
        <Button
          isIconOnly
          aria-label={isVisible ? "Hide password" : "Show password"}
          size="sm"
          variant="ghost"
          onPress={() => setIsVisible(!isVisible)}
        >
          {isVisible ? <EyeSlash /> : <Eye />}
        </Button>
      </InputGroup.Suffix>
    </InputGroup>
  );
}
