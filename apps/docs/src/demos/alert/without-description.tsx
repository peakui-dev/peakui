import {Alert, CloseButton} from "@peakui/react";

export function WithoutDescription() {
  return (
    <Alert status="success">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>Profile updated successfully</Alert.Title>
      </Alert.Content>
      <CloseButton />
    </Alert>
  );
}
