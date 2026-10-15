import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { OrbitalMark } from "../components/OrbitalMark";

type Device = "iphone" | "android" | "other";

function guessDevice(): Device {
  if (typeof navigator === "undefined") return "iphone";
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return "android";
  if (/iPad|iPhone|iPod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) return "iphone";
  return "other";
}

function inAppMode(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

/** Public, opt-in instructions. Never impersonates a native App Store installation. */
export function InstallPage() {
  const [device, setDevice] = useState<Device>(guessDevice);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(display-mode: standalone)");
    const update = () => setInstalled(inAppMode());
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return <div className="install-page">
    <section className="install-hero" aria-labelledby="install-title">
      <div className="install-hero-text">
        <span className="kicker">ANEVUM / ON YOUR PHONE</span>
        <h1 id="install-title">A WORLD OF THINGS<br/><em>YOU CAN RETURN TO.</em></h1>
        <p>Put ANEVUM on your Home Screen without downloading a separate app or creating a new account. Your saved projects still live in your member library, not as unverified software installed on your phone.</p>
        <div className="install-hero-actions">
          <Link className="button primary" to="/discover">EXPLORE CREATIONS →</Link>
          <Link className="button secondary" to="/library">OPEN YOUR LIBRARY →</Link>
        </div>
      </div>
      <div className="install-app-preview" aria-label="ANEVUM Home Screen identity">
        <div className="install-app-icon" aria-hidden="true"><OrbitalMark /></div>
        <strong>ANEVUM</strong>
        <span>WEBSITE · OPTIONAL HOME SCREEN ICON</span>
      </div>
    </section>

    <section className="install-instructions" aria-labelledby="install-instructions-title">
      <span className="kicker">YOUR DEVICE / SIMPLE SETUP</span>
      <h2 id="install-instructions-title">ADD TO HOME SCREEN</h2>
      {installed ? <p className="install-confirmed" role="status">ANEVUM is currently open in standalone web app mode on this device. You can keep using it here.</p> :
        <p className="install-intro">Choose your device for the browser instructions. Installing is optional. No Apple Developer account, app store, or payment is involved.</p>}
      <div className="install-device-tabs" role="group" aria-label="Choose device instructions">
        <button type="button" aria-pressed={device === "iphone"} onClick={() => setDevice("iphone")}>iPHONE / iPAD</button>
        <button type="button" aria-pressed={device === "android"} onClick={() => setDevice("android")}>ANDROID</button>
        <button type="button" aria-pressed={device === "other"} onClick={() => setDevice("other")}>COMPUTER</button>
      </div>
      <div className="install-steps" aria-live="polite">
        {device === "iphone" ? <ol>
          <li>Open ANEVUM in <strong>Safari</strong> on your iPhone or iPad.</li>
          <li>Use the browser <strong>Share</strong> menu and select <strong>Add to Home Screen</strong>.</li>
          <li>Enable <strong>Open as Web App</strong> if that option appears, then tap <strong>Add</strong>.</li>
          <li>Open the ANEVUM icon from your Home Screen. Sign in when member access is available to use your saved library.</li>
        </ol> : device === "android" ? <ol>
          <li>Open ANEVUM in a compatible browser, such as <strong>Chrome</strong>.</li>
          <li>Open the browser menu and choose <strong>Install app</strong> or <strong>Add to Home screen</strong>, whichever is offered.</li>
          <li>Confirm the shortcut or web app installation, then use its Home Screen icon to return.</li>
        </ol> : <ol>
          <li>Open ANEVUM in your desktop browser.</li>
          <li>Use the browser's <strong>Install</strong> option if offered, or add ANEVUM as a bookmark.</li>
          <li>Return to your saved library after signing in. Availability of standalone installation varies by browser.</li>
        </ol>}
      </div>
    </section>
    <section className="install-boundary" aria-label="What installing ANEVUM does">
      <h2>ONE HOME. MANY CREATIONS.</h2>
      <p>The ANEVUM icon opens the website and its project library. Individual games and applications may still be hosted by their creators and will open on those sites. A Home Screen shortcut is not an App Store app, an offline download, or a safety certification.</p>
      <Link to="/start">HOW ANEVUM WORKS →</Link>
    </section>
  </div>;
}
