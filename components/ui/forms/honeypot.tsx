/**
 * Honeypot field — Phase 3 handover §3.
 *
 * Every form must include a hidden `website` input. Real users never see or
 * fill it; bots usually do. It must be hidden off-screen with CSS (not
 * display:none and not type="hidden", which smarter bots skip).
 */
const HONEYPOT_NAME = "website";

export default function Honeypot() {
  return (
    <div
      aria-hidden="true"
      style={{ position: "absolute", left: "-9999px", top: "-9999px" }}
    >
      <label>
        {/* Ignore warnings about an unlabelled control — the <label> is
            deliberately empty. */}
        <input
          type="text"
          name={HONEYPOT_NAME}
          tabIndex={-1}
          autoComplete="off"
        />
      </label>
    </div>
  );
}
