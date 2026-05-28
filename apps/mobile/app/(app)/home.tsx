import { PlaceholderScreen } from "@/components/placeholder-screen";

export default function HomeRoute() {
  return (
    <PlaceholderScreen
      eyebrow="Main app"
      title="Home console"
      body="Placeholder dashboard for the MVP loop. Server-owned workout history, progression, Power, Credits, nodes, debuffs, and prestige state stay outside local UI state."
      navigation={[
        { label: "Welcome", href: "/welcome" },
        { label: "Workout bay", href: "/workouts", tone: "success" },
        { label: "Credits console", href: "/economy", tone: "economy" },
        { label: "Profile", href: "/profile" },
      ]}
    />
  );
}
