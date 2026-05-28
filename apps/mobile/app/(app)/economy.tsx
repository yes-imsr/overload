import { PlaceholderScreen } from "@/components/placeholder-screen";

export default function EconomyRoute() {
  return (
    <PlaceholderScreen
      eyebrow="Credits and nodes"
      title="Economy console"
      body="Placeholder route for future server-backed Credits and node surfaces. No Power, Credits, Entropy, debuff, or prestige formulas are implemented in this screen."
      navigation={[
        { label: "Home console", href: "/home" },
        { label: "Workout bay", href: "/workouts", tone: "success" },
        { label: "Profile", href: "/profile" },
        { label: "Welcome", href: "/welcome" },
      ]}
    />
  );
}
