import {useState, type ChangeEvent, type FormEvent} from "react";
import {Link} from "react-router-dom";
import {OrbitalMark} from "../components/OrbitalMark";
import {
  applyQuantoInstruction, assertQuantoInvariants, createQuantoLedger,
  formatQuantoCents, verifyQuantoExport, QUANTO_MAX_ENTRIES, QUANTO_MAX_OPERATION_CENTS,
  type QuantoInstruction, type QuantoLedger, type QuantoWallet
} from "../lib/quanto-ledger.mjs";

type Mode = QuantoInstruction["type"];
type Confirmation = {instruction: QuantoInstruction; version: number};
const WALLETS: {id: QuantoWallet; name: string; subtitle: string}[] = [
  {id: "operator", name: "Origin", subtitle: "Demonstration operator"},
  {id: "creator", name: "Creator", subtitle: "Demonstration participant"},
  {id: "studio", name: "Studio", subtitle: "Demonstration merchant"}
];
const MODE_LABEL: Record<Mode, string> = {
  issue: "Issue simulated units", transfer: "Transfer between demo wallets",
  redeem: "Redeem simulated units"
};
const MAX_UPLOAD_BYTES = 512 * 1024;
const format = (cents: number) => formatQuantoCents(cents) + " QTO";
function parsePositiveAmount(raw: string): number {
  // Currency quantities remain integer cents. Never use floating-point cents
  // and never accept exponents, negative numbers, localized commas or fractions.
  const value = raw.trim();
  if (!/^(?:0|[1-9][0-9]{0,4})(?:\.[0-9]{1,2})?$/.test(value)) {
    throw new Error("Enter an amount using digits and up to two decimal places.");
  }
  const [whole, fraction = ""] = value.split(".");
  const amount = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (amount < 1 || amount > QUANTO_MAX_OPERATION_CENTS) {
    throw new Error("The demo permits 0.01–10,000.00 QTO per operation.");
  }
  return amount;
}
function walletLabel(id: QuantoWallet): string {
  return WALLETS.find(wallet => wallet.id === id)?.name || "Unknown wallet";
}

export function QuantoDemoPage() {
  const [ledger, setLedger] = useState<QuantoLedger>(createQuantoLedger);
  const [mode, setMode] = useState<Mode>("issue");
  const [from, setFrom] = useState<QuantoWallet>("operator");
  const [to, setTo] = useState<QuantoWallet>("creator");
  const [amount, setAmount] = useState("25.00");
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [verification, setVerification] = useState("");
  const outstanding = -ledger.balances.QTO.issuer;
  const demoBacking = ledger.balances.SIM_USD.reserves;
  const remaining = QUANTO_MAX_ENTRIES - ledger.sequence;
  // This checks internal simulation arithmetic, not reserves outside this page.
  const locallyBalanced = assertQuantoInvariants(ledger) === true;

  function clearReview() {
    setConfirmation(null);
    setError("");
    setNotice("");
    setVerification("");
  }
  function instructionFor(id: string, cents: number): QuantoInstruction {
    if (mode === "issue") return {requestId: id, type: "issue", amountCents: cents, to};
    if (mode === "transfer") return {requestId: id, type: "transfer", amountCents: cents, from, to};
    return {requestId: id, type: "redeem", amountCents: cents, from};
  }
  function review(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearReview();
    try {
      const cents = parsePositiveAmount(amount);
      const instruction = instructionFor(crypto.randomUUID(), cents);
      // Test the exact transaction against a copy of the current ledger.
      // Only the second, explicit confirmation changes React state.
      applyQuantoInstruction(ledger, instruction);
      setConfirmation({instruction, version: ledger.sequence});
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not prepare instruction.");
    }
  }
  function confirm() {
    if (!confirmation) return;
    const {instruction, version} = confirmation;
    setConfirmation(null);
    setError("");
    try {
      if (ledger.sequence !== version) throw new Error("The demo state changed. Review again.");
      const next = applyQuantoInstruction(ledger, instruction);
      if (next === ledger) throw new Error("Already processed. No units were moved.");
      setLedger(next);
      setVerification("");
      setNotice("Simulated " + instruction.type + " recorded as local journal entry #" + next.sequence + ".");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The simulation rejected this instruction.");
    }
  }
  function reset() {
    setLedger(createQuantoLedger());
    clearReview();
    setNotice("A new empty browser-memory simulation has started.");
  }
  function exportJournal() {
    clearReview();
    if (!verifyQuantoExport(ledger)) {
      setError("Journal replay failed; export was blocked.");
      return;
    }
    const json = JSON.stringify(ledger, null, 2);
    const url = URL.createObjectURL(new Blob([json], {type: "application/json"}));
    const link = document.createElement("a");
    link.href = url;
    link.download = "quanto-v001-simulation-journal.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice("Local demonstration journal exported. It contains no financial credentials.");
  }
  async function verifyFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    setVerification("");
    setError("");
    if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) {
      setVerification("Rejected: demo journal file exceeds 512 KiB.");
      return;
    }
    try {
      const contents = JSON.parse(await file.text()) as unknown;
      setVerification(verifyQuantoExport(contents)
        ? "Replay consistent. This is not proof of authenticity, ownership, or real reserves."
        : "Verification failed. Receipt sequence, postings or balances do not replay.");
    } catch {
      setVerification("Verification failed. File is not valid demo JSON.");
    }
  }

  return <section className="qt0" aria-labelledby="qt0-title">
    <div className="qt0-signal" role="status">
      <span className="qt0-light" aria-hidden="true"/>
      <strong>QUANTO / CONTROLLED SIMULATION</strong>
      <span>NO REAL MONEY · NO DEPOSITS · NO REDEMPTION VALUE</span>
    </div>
    <header className="qt0-hero">
      <div className="qt0-hero-copy">
        <span className="qt0-index">ANEVUM / CONTINUANCE FINANCIAL SYSTEMS / EXPERIMENT 001</span>
        <h1 id="qt0-title">Quanto <em>Protocol.</em></h1>
        <p className="qt0-lead">A new instrument for a creator economy, beginning with verifiable bookkeeping instead of speculation.</p>
        <p className="qt0-caution">This interface is a browser-memory accounting experiment. QTO here is imaginary and cannot be purchased, withdrawn, transferred to a real person, or converted to dollars.</p>
        <Link to="/member" className="qt0-home-link">RETURN TO MEMBER SPACE ↗</Link>
      </div>
      <div className="qt0-hero-emblem" aria-hidden="true"><OrbitalMark/><span>Q / 001</span></div>
    </header>
    <div className="qt0-stats" aria-label="Simulated monetary controls">
      <div><small>CIRCULATING / SIMULATED</small><strong>{format(outstanding)}</strong></div>
      <div><small>REFERENCE BACKING / IMAGINARY</small><strong>{formatQuantoCents(demoBacking)} sim-USD</strong></div>
      <div><small>LOCAL CHECK</small><strong className="qt0-health">{locallyBalanced ? "BALANCED" : "ERROR"}</strong></div>
      <div><small>POSTED DEMO ENTRIES</small><strong>{ledger.sequence} / {QUANTO_MAX_ENTRIES}</strong></div>
    </div>
    <div className="qt0-layout">
      <section className="qt0-panel qt0-wallets" aria-label="Demonstration wallets">
        <div className="qt0-heading"><span>01 / OWNERSHIP</span><h2>Wallets in the simulation.</h2></div>
        <div className="qt0-wallet-grid">{WALLETS.map(wallet =>
          <article className="qt0-wallet" key={wallet.id}>
            <span className="qt0-wallet-number">{wallet.id === "operator" ? "A" : wallet.id === "creator" ? "B" : "C"}</span>
            <div><h3>{wallet.name}</h3><small>{wallet.subtitle}</small></div>
            <strong>{format(ledger.balances.QTO[wallet.id])}</strong>
          </article>
        )}</div>
        <p className="qt0-panel-note">These wallets are labels in one local simulation—not ANEVUM accounts, private keys, or actual custody. Balances disappear on refresh.</p>
      </section>
      <section className="qt0-panel qt0-console" aria-label="Demonstration transaction console">
        <div className="qt0-heading"><span>02 / TRANSACTION LAB</span><h2>Construct an instruction.</h2></div>
        <div className="qt0-modes" role="group" aria-label="Demo transaction type">
          {(["issue","transfer","redeem"] as const).map(option=>
            <button type="button" key={option} aria-pressed={mode===option}
              onClick={()=>{setMode(option);clearReview();}}>
              {option === "issue" ? "ISSUE" : option === "transfer" ? "TRANSFER" : "REDEEM"}
            </button>
          )}
        </div>
        <p className="qt0-action-detail">{mode==="issue"
          ? "Mint test QTO and increase fictional backing by the same number of cents."
          : mode==="transfer"
          ? "Move test QTO between two local wallets. No external recipient exists."
          : "Burn test QTO and decrease fictional backing by the same amount."}</p>
        <form className="qt0-form" onSubmit={review}>
          <label htmlFor="qt0-amount">SIMULATED AMOUNT / QTO</label>
          <input id="qt0-amount" type="text" inputMode="decimal" autoComplete="off"
            maxLength={12} value={amount} onChange={event=>{setAmount(event.target.value);clearReview();}}
            aria-describedby="qt0-amount-guide"/>
          <small id="qt0-amount-guide">Two decimal places maximum · 0.01 to 10,000.00 · no actual USD</small>
          {mode!=="issue"&&<>
            <label htmlFor="qt0-from">SOURCE WALLET</label>
            <select id="qt0-from" value={from} onChange={event=>{setFrom(event.target.value as QuantoWallet);clearReview();}}>
              {WALLETS.map(wallet=><option key={wallet.id} value={wallet.id}>{wallet.name}</option>)}
            </select>
          </>}
          {mode!=="redeem"&&<>
            <label htmlFor="qt0-to">DESTINATION WALLET</label>
            <select id="qt0-to" value={to} onChange={event=>{setTo(event.target.value as QuantoWallet);clearReview();}}>
              {WALLETS.map(wallet=><option key={wallet.id} value={wallet.id}>{wallet.name}</option>)}
            </select>
          </>}
          <button className="qt0-primary" type="submit" disabled={remaining===0}>REVIEW SIMULATED {mode.toUpperCase()} →</button>
        </form>
        {confirmation&&<div className="qt0-confirm" role="region" aria-label="Review transaction">
          <span>AWAITING LOCAL CONFIRMATION</span>
          <strong>{MODE_LABEL[confirmation.instruction.type]}</strong>
          <p>{format(confirmation.instruction.amountCents)} · {confirmation.instruction.type==="issue"
            ? "Issuer → " + walletLabel(confirmation.instruction.to)
            : confirmation.instruction.type==="transfer"
            ? walletLabel(confirmation.instruction.from) + " → " + walletLabel(confirmation.instruction.to)
            : walletLabel(confirmation.instruction.from) + " → Issuer"}
          </p>
          <div><button type="button" onClick={confirm}>CONFIRM DEMO POSTING</button>
          <button type="button" onClick={()=>setConfirmation(null)}>CANCEL</button></div>
        </div>}
        {error&&<p className="qt0-error" role="alert">{error}</p>}
        {notice&&<p className="qt0-notice" role="status">{notice}</p>}
      </section>
    </div>
    <section className="qt0-panel qt0-records" aria-labelledby="qt0-record-title">
      <div className="qt0-record-top">
        <div className="qt0-heading"><span>03 / VERIFIABLE HISTORY</span><h2 id="qt0-record-title">The local record.</h2></div>
        <div className="qt0-actions">
          <button type="button" onClick={exportJournal}>EXPORT JSON</button>
          <button type="button" onClick={reset}>RESET SIMULATION</button>
        </div>
      </div>
      <p>Every simulated command has paired debits and credits. Each transaction is replayable and cannot create negative wallet balances. This history is not stored on ANEVUM's servers.</p>
      {ledger.journal.length===0
        ? <div className="qt0-empty">NO ENTRIES RECORDED / ISSUE SIMULATED QTO TO BEGIN</div>
        : <ol className="qt0-journal">{[...ledger.journal].reverse().slice(0,24).map(entry =>
          <li key={entry.requestId}>
            <span>#{String(entry.sequence).padStart(3,"0")}</span>
            <strong>{entry.type.toUpperCase()}</strong>
            <span>{entry.type==="issue" ? "ISSUER → " + walletLabel(entry.command.to as QuantoWallet)
              : entry.type==="transfer" ? walletLabel((entry.command as Extract<QuantoInstruction, {type:"transfer"}>).from) + " → " + walletLabel((entry.command as Extract<QuantoInstruction, {type:"transfer"}>).to)
              : walletLabel((entry.command as Extract<QuantoInstruction, {type:"redeem"}>).from) + " → ISSUER"}</span>
            <b>{format(entry.amountCents)}</b>
          </li>
        )}</ol>}
      {ledger.journal.length>24&&<p className="qt0-panel-note">Showing 24 newest records. Export the complete journal to see all entries.</p>}
      <div className="qt0-verify">
        <label htmlFor="qt0-file">VERIFY A PREVIOUSLY EXPORTED DEMO JOURNAL</label>
        <input id="qt0-file" type="file" accept=".json,application/json" onChange={event=>void verifyFile(event)}/>
        {verification&&<p role="status">{verification}</p>}
        <small>Verification replays JSON within your browser only. It does not import balances and cannot authenticate the author or attest to real reserves.</small>
      </div>
    </section>
    <footer className="qt0-footnote">
      <span>ANEVUM / QUANTO / PROTOCOL 0.1</span>
      <p>All simulated reserves are bookkeeping entries generated alongside QTO. No payment rails, external custodians, bank accounts, blockchain, post-quantum signing, or financial permissions have been activated.</p>
    </footer>
  </section>;
}
