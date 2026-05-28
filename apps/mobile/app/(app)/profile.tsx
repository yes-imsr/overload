import { PlaceholderScreen } from "@/components/placeholder-screen";

export default function ProfileRoute() {
  return (
    <PlaceholderScreen
      eyebrow="Training profile"
      title="Profile terminal"
      body="Placeholder route for profile and equipment setup. Durable account, profile, and workout records will be loaded through server-backed data queries."
      navigation={[
        { label: "Home console", href: "/(app)/home" },
        { label: "Workout bay", href: "/(app)/workouts", tone: "success" },
        { label: "Credits console", href: "/(app)/economy", tone: "economy" },
        { label: "Welcome", href: "/welcome" },
      ]}
    />
  );
}
