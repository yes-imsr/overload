import { PrimaryCTAButton } from "@/components";
import { ScreenShell } from "@/screens/ScreenShell";

/** Debuff Reveal */
export default function DebuffRevealScreen() {
  return (
    <ScreenShell
      title="System Alert"
      subtitle="Debuff reveal shell — no active debuff logic."
    >
      <PrimaryCTAButton
        label="Acknowledge"
        variant="danger"
        disabled
      />
    </ScreenShell>
  );
}
