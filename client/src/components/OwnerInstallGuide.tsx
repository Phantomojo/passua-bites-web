import { useEffect, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type Props = { onContinue: () => void };

export default function OwnerInstallGuide({ onContinue }: Props) {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    setIsInstalled(standalone);
    setIsIOS(/iphone|ipad|ipod/i.test(navigator.userAgent));

    const capture = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const installed = () => setIsInstalled(true);

    window.addEventListener("beforeinstallprompt", capture);
    window.addEventListener("appinstalled", installed);
    return () => {
      window.removeEventListener("beforeinstallprompt", capture);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);

  useEffect(() => {
    if (isInstalled) onContinue();
  }, [isInstalled, onContinue]);

  const install = async () => {
    if (!installPrompt) return;
    setInstalling(true);
    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === "accepted") setIsInstalled(true);
      else setInstalling(false);
    } catch {
      setInstalling(false);
    }
  };

  return (
    <main style={{
      minHeight: "100vh", background: "var(--pb-bg)", color: "var(--pb-ivory)",
      display: "grid", placeItems: "center", padding: "1.25rem",
      fontFamily: "'DM Sans',sans-serif",
    }}>
      <section style={{
        width: "min(100%, 560px)", padding: "clamp(1.4rem,5vw,2.6rem)",
        background: "var(--pb-bg2)", border: "1px solid var(--pb-rule)",
        borderTop: "3px solid var(--pb-ember)",
      }}>
        <div style={{
          fontFamily: "'DM Mono',monospace", color: "var(--pb-ember)",
          fontSize: ".68rem", letterSpacing: ".16em", textTransform: "uppercase",
        }}>Owner app setup · Installation</div>
        <h1 style={{
          fontFamily: "'Playfair Display',serif", fontSize: "clamp(2rem,7vw,3rem)",
          lineHeight: 1.05, margin: ".8rem 0",
        }}>Install Passua Ops.</h1>
        <p style={{ color: "var(--pb-ivory2)", lineHeight: 1.7, fontSize: ".95rem" }}>
          Put the kitchen and business dashboard on this device. It opens like an app,
          is easier to reach during service, and keeps the public customer website separate.
        </p>

        <div style={{
          margin: "1.4rem 0", padding: "1rem", background: "var(--pb-bg3)",
          border: "1px solid var(--pb-rule2)",
        }}>
          <div style={{ color: "var(--pb-ember2)", fontFamily: "'DM Mono',monospace",
            fontSize: ".65rem", letterSpacing: ".1em", textTransform: "uppercase" }}>
            {installPrompt ? "Ready to install" : isIOS ? "On iPhone or iPad" : "Install from your browser"}
          </div>
          {installPrompt ? (
            <p style={{ color: "var(--pb-ivory2)", lineHeight: 1.6, margin: ".6rem 0 0" }}>
              Select Install below. Your browser will add Passua Ops to your home screen or app list.
            </p>
          ) : isIOS ? (
            <ol style={{ color: "var(--pb-ivory2)", lineHeight: 1.8, paddingLeft: "1.2rem", marginBottom: 0 }}>
              <li>Open this page in Safari.</li>
              <li>Tap the Share icon.</li>
              <li>Choose <strong>Add to Home Screen</strong>, then tap Add.</li>
              <li>Open Passua Ops from the new home-screen icon.</li>
            </ol>
          ) : (
            <p style={{ color: "var(--pb-ivory2)", lineHeight: 1.6, margin: ".6rem 0 0" }}>
              Open the browser menu and choose <strong>Install app</strong> or
              <strong> Add to Home screen</strong>. In Chrome, look for the install icon
              in the address bar or the ⋮ menu.
            </p>
          )}
        </div>

        <div style={{ display: "flex", gap: ".75rem", flexWrap: "wrap" }}>
          {installPrompt && (
            <button onClick={install} disabled={installing} className="pb-btn-primary"
              style={{ minHeight: 48, padding: "0 1.25rem", flex: "1 1 190px" }}>
              {installing ? "Waiting for browser…" : "Install Passua Ops"}
            </button>
          )}
          <button onClick={onContinue} className="pb-btn-ghost"
            style={{ minHeight: 48, padding: "0 1.25rem", flex: "1 1 160px" }}>
            Continue in browser
          </button>
        </div>
        <p style={{ color: "var(--pb-ivory3)", fontSize: ".75rem", lineHeight: 1.6, marginTop: "1.2rem" }}>
          You can install later from your browser menu. Installation does not replace your
          sign-in and does not grant access to anyone else using this device.
        </p>
      </section>
    </main>
  );
}
