import { useId } from 'react';
import { inspectProposal, type Document, type Proposal, type Receipt } from './action-lens';
export type ActionLensProps = {
  document: Document; proposal: Proposal | null; receipt: Receipt | null; message: string;
  onApply: () => void; onCancel: () => void; onUndo: () => void;
};
/** Presentation only: production callers must independently authorize every action. */
export function ActionLens({ document, proposal, receipt, message, onApply, onCancel, onUndo }: ActionLensProps) {
  const titleId = useId();
  const inspection = proposal ? inspectProposal(document, proposal) : null;
  return <section className="avnext-lens" aria-labelledby={titleId}>
    <div className="avnext-kicker">ACTION LENS <span>LOCAL REVIEW / NOT CONNECTED TO AI</span></div>
    <h2 id={titleId}>{proposal ? 'Inspect before you apply.' : 'Every change stays in your control.'}</h2>
    {proposal && <>
      <p>Object <code>{proposal.targetId}</code> / revision {proposal.expectedRevision}</p>
      <div className="avnext-diff">{Object.entries(proposal.changes).map(([field, change]) => change && <div key={field}>
        <h3>{field}</h3><div><small>BEFORE</small><p>{change.before || '(empty)'}</p></div>
        <div><small>PROPOSED</small><p>{change.after}</p></div>
      </div>)}</div>
      <p>{inspection?.status === 'reviewable' ? 'The proposal matches the current local revision.' : inspection?.reason}</p>
      <div className="avnext-actions">
        <button className="avnext-button avnext-primary" disabled={inspection?.status !== 'reviewable'} onClick={onApply}>Apply to local example</button>
        <button className="avnext-button" onClick={onCancel}>Cancel proposal</button>
      </div>
    </>}
    {!proposal && receipt && <button className="avnext-button" onClick={onUndo}>Undo local change</button>}
    <p className="avnext-message" role="status" aria-live="polite">{message || 'Inspect a suggestion from the editor to begin. Nothing is sent or saved.'}</p>
  </section>;
}
