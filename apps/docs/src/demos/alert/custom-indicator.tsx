import {Alert, Spinner} from "@peakui/react";

export function CustomIndicator() {
  return (
    <Alert status="accent">
      <Alert.Indicator>
        <Spinner size="sm" />
      </Alert.Indicator>
      <Alert.Content>
        <Alert.Title>Processing your request</Alert.Title>
        <Alert.Description>
          Please wait while we sync your data. This may take a few moments.
        </Alert.Description>
      </Alert.Content>
    </Alert>
  );
}
