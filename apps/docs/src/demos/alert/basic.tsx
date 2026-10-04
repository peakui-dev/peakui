import {Alert} from "@peakui/react";

export function Basic() {
  return (
    <Alert>
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>New features available</Alert.Title>
        <Alert.Description>
          Check out our latest updates including dark mode support and improved accessibility
          features.
        </Alert.Description>
      </Alert.Content>
    </Alert>
  );
}
