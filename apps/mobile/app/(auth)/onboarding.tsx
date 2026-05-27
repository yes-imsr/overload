import { PlaceholderScreen } from "@/components/placeholder-screen";

export default function OnboardingRoute() {
  return (
    <PlaceholderScreen
      eyebrow="Auth and onboarding"
      title="Operator intake"
      body="Placeholder route for account entry, training profile, and equipment setup. It owns no workout math, game economy math, or persisted server state."
      navigation={[
        { label: "Enter main console", href: "/home", tone: "success" },
        { label: "Workout bay", href: "/workouts" },
        { label: "Credits console", href: "/economy", tone: "economy" },
        { label: "Profile", href: "/profile" },
      ]}
    />
  );
}
