import { Stack } from "expo-router";
import { SessionGate } from "@/components/SessionGate";
import { colors } from "@/tokens";

export default function ProtectedLayout() {
  return (
    <SessionGate>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background.primary },
        }}
      />
    </SessionGate>
  );
}
