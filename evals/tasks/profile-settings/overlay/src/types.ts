export interface Profile {
  displayName: string;
  email: string;
  bio: string;
  newsletter: boolean;
  plan: "free" | "pro" | "team";
}

export interface ProfileSettingsProps {
  profile: Profile;
  saving: boolean;
  onSave(profile: Profile): void;
}
