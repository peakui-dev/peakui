import {Alert, Button} from "@peakui/react";

export function WithActions() {
  return (
    <Alert status="accent">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>Update available</Alert.Title>
        <Alert.Description>
          A new version of the application is available. Please refresh to get the latest features
          and bug fixes.
        </Alert.Description>
      </Alert.Content>
      <Button size="sm" variant="primary">
        Refresh
      </Button>
    </Alert>
  );
}
