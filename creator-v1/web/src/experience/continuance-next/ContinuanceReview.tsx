import { useEffect, useReducer, useRef, useState } from 'react';
import { OrbitalMark } from '../../components/OrbitalMark';
import { ActionLens } from './ActionLens';
import { applyProposal, editField, undoReceipt, type Document, type Field, type Proposal, type Receipt } from './action-lens';
type View = 'arrival' | 'discover' | 'studio';
type Pane = 'files' | 'editor' | 'preview';
type Model = { document: Document; proposal: Proposal | null; receipt: Receipt | null; message: string };
type Event = { type: 'edit'; field: Field; value: string } | { type: 'suggest' | 'apply' | 'cancel' | 'undo' };
const initial: Model = { document: { id: 'local-scene', revision: 1, fields: { title: 'Untitled scene', description: 'A place for an idea to take shape.' } }, proposal: null, receipt: null, message: '' };
function reducer(state: Model, event: Event): Model {
  if (event.type === 'edit') return { ...state, document: editField(state.document, event.field, event.value) };
  if (event.type === 'cancel') return { ...state, proposal: null, message: 'Proposal dismissed. No change applied.' };
  if (event.type === 'suggest') return { ...state, proposal: { id: 'proposal-' + state.document.revision, targetId: state.document.id, expectedRevision: state.document.revision, changes: { title: { before: state.document.fields.title, after: state.document.fields.title === 'Opening scene' ? 'A new world begins' : 'Opening scene' } } }, message: 'Inspect the target, revision and changed field before applying.' };
  if (event.type === 'apply' && state.proposal) {
    const result = applyProposal(state.document, state.proposal);
    return result.status === 'applied' ? { ...state, document: result.document, receipt: result.receipt, proposal: null, message: 'Applied to the local example only. Not saved or published.' } : { ...state, message: result.reason };
  }
  if (event.type === 'undo' && state.receipt) {
    const result = undoReceipt(state.document, state.receipt);
    return result.status === 'undone' ? { ...state, document: result.document, receipt: null, message: 'Restored the previous value as a new local revision.' } : { ...state, message: result.reason };
  }
  return state;
}
const destinations: ReadonlyArray<{ id: View; label: string }> = [{ id: 'arrival', label: 'Arrival' }, { id: 'discover', label: 'Discover' }, { id: 'studio', label: 'Creator Studio' }];
/** Independent React review entry. No auth, catalogue, AI, persistence or writes. */
export function ContinuanceReview() {
  const [view, setView] = useState<View>('arrival');
  const [pane, setPane] = useState<Pane>('editor');
  const [still, setStill] = useState(false);
  const [visible, setVisible] = useState(true);
  const [catalogueState, setCatalogueState] = useState<'empty' | 'error' | 'loading'>('empty');
  const [model, dispatch] = useReducer(reducer, initial);
  const heading = useRef<HTMLHeadingElement>(null);
  const previousView = useRef(view);
  useEffect(() => {
    const update = () => setVisible(!document.hidden);
    update(); document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);
  useEffect(() => {
    if (previousView.current !== view) { previousView.current = view; heading.current?.focus({ preventScroll: true }); }
  }, [view]);
  return <div className="avnext-root" data-av-design="continuance-next" data-still={still || !visible}>
    <a className="avnext-skip" href="#avnext-main">Skip to content</a>
    <header className="avnext-header"><div className="avnext-brand"><OrbitalMark className="avnext-mark"/><span><strong>ANEVUM</strong><small>THE CONTINUANCE INSTITUTE</small></span></div>
      <nav aria-label="Review views" className="avnext-nav">{destinations.map(item => <button key={item.id} type="button" aria-pressed={view === item.id} onClick={() => setView(item.id)}>{item.label}</button>)}</nav>
      <button className="avnext-motion" type="button" aria-pressed={still} onClick={() => setStill(value => !value)}>{still ? 'Motion paused' : 'Pause motion'}</button>
    </header>
    <div className="avnext-review-label">DEVELOPMENT REVIEW / LOCAL EXAMPLES / NOT LIVE</div>
    <main id="avnext-main" tabIndex={-1}>
      {view === 'arrival' && <>
        <section className="avnext-arrival">
          <div className="avnext-hero-copy"><div className="avnext-kicker">THE CONTINUANCE INSTITUTE <span>01 / ARRIVAL</span></div>
            <h1 ref={heading} id="avnext-heading" tabIndex={-1}>A world of<br/><em>things people</em><br/>make<span>.</span></h1>
            <p className="avnext-lead">Independent games. Useful tools. Unexpected experiments. Explore what is possible, and make something of your own.</p>
            <div className="avnext-actions"><button className="avnext-button avnext-primary" onClick={() => setView('discover')}>Explore ANEVUM <span aria-hidden="true">&#8599;</span></button><button className="avnext-button" onClick={() => setView('studio')}>Find your place <span aria-hidden="true">&#8599;</span></button></div>
            <p className="avnext-caption">Explore without signing in. AI is optional.</p>
          </div>
          <div className="avnext-orbit" aria-hidden="true"><div className="avnext-orbit-ring avnext-orbit-ring-a"/><div className="avnext-orbit-ring avnext-orbit-ring-b"/><div className="avnext-planet"><OrbitalMark className="avnext-planet-mark"/></div><span className="avnext-orbit-point"/><small>CONTINUANCE / AN OPEN FIELD OF POSSIBILITY</small></div>
          <div className="avnext-hero-rule"><span>DISCOVER / MAKE / BELONG</span><span>A SIGNAL, NOT A LOADING SCREEN</span></div>
        </section>
        <section className="avnext-paths" aria-label="Paths through ANEVUM">{[
          { id: 'discover' as const, n: '01', title: 'Find the unexpected.', text: 'Discover real creations with clear destinations, honest context and human authorship.' },
          { id: 'studio' as const, n: '02', title: 'Make something yours.', text: 'A focused workspace for ideas, files, scenes and previews. Assistance stays optional.' }
        ].map(item => <button key={item.id} onClick={() => setView(item.id)}><small>{item.n} / ENTER</small><strong>{item.title}</strong><p>{item.text}</p><span aria-hidden="true">&#8599;</span></button>)}</section>
      </>}
      {view === 'discover' && <section className="avnext-section">
        <div className="avnext-kicker">01 / DISCOVERY <span>STATE REVIEW, NOT A LIVE CATALOGUE</span></div>
        <h1 ref={heading} id="avnext-heading" tabIndex={-1}>Find something<br/><em>worth exploring.</em></h1>
        <p className="avnext-lead">Projects deserve more than a thumbnail. Their purpose, creator, cost, compatibility and real destination should be clear before you open them.</p>
        <div className="avnext-chips" aria-label="Category examples"><span>Games & play</span><span>Apps & tools</span><span>AI & interactive</span><span>Open source</span></div>
        <div className="avnext-state-controls" role="group" aria-label="Review catalogue states">{(['empty', 'loading', 'error'] as const).map(state => <button key={state} aria-pressed={catalogueState === state} onClick={() => setCatalogueState(state)}>{state}</button>)}</div>
        <div className="avnext-catalogue-state" role="status" aria-live="polite">
          <span className="avnext-state-glyph" aria-hidden="true">{catalogueState === 'error' ? '!' : catalogueState === 'loading' ? '...' : '+'}</span>
          <h2>{catalogueState === 'empty' ? 'Make room for genuine work.' : catalogueState === 'loading' ? 'Loading approved projects.' : 'The catalogue could not be loaded.'}</h2>
          <p>{catalogueState === 'empty' ? 'This review contains no project records. The production page must show actual approved creations or an honest empty state.' : catalogueState === 'loading' ? 'Loading is distinct from empty or unavailable. This is a selected example state, not an active request.' : 'Keep navigation and filters available. A failed request must not become an empty catalogue or fabricated content.'}</p>
          {catalogueState === 'error' && <button className="avnext-button" onClick={() => setCatalogueState('loading')}>Show loading example</button>}
        </div>
        <div className="avnext-passport"><div><small>PROJECT PASSPORT</small><h2>Know what<br/>you are opening.</h2></div><dl><dt>Destination</dt><dd>Demo, application and source are separate.</dd><dt>Access</dt><dd>Cost, accounts and device requirements.</dd><dt>Provenance</dt><dd>Creator, rights, AI use and limitations.</dd><dt>Participation</dt><dd>Real feedback. No invented plays or reviews.</dd></dl></div>
      </section>}
      {view === 'studio' && <section className="avnext-section">
        <div className="avnext-kicker">02 / CREATOR STUDIO <span>LOCAL WORKSPACE STUDY</span></div>
        <h1 ref={heading} id="avnext-heading" tabIndex={-1}>Your imagination.<br/><em>A place to work.</em></h1>
        <p className="avnext-lead">Files, a focused editor, a live text preview, and a change you can inspect before applying. This sample stays in memory and clears on reload.</p>
        <div className="avnext-mobile-panes" role="group" aria-label="Workspace panes">{(['files', 'editor', 'preview'] as const).map(item => <button key={item} aria-pressed={pane === item} onClick={() => setPane(item)}>{item}</button>)}</div>
        <div className="avnext-workspace" data-pane={pane}>
          <div className="avnext-workspace-bar"><strong>CONTINUANCE STUDIO</strong><span>LOCAL ONLY / REVISION {model.document.revision}</span></div>
          <aside className="avnext-files"><h2>FILES</h2><button onClick={() => setPane('editor')} aria-label="Open local scene editor">scene.local <span>LOCAL</span></button><p>One sample object, not a server file tree. Existing Studio file and revision services will be reused.</p></aside>
          <div className="avnext-editor"><div className="avnext-editor-tab">scene.local <span>UNSAVED EXAMPLE</span></div><label htmlFor="avnext-title">Scene title</label><input id="avnext-title" maxLength={100} value={model.document.fields.title} onChange={e => dispatch({ type: 'edit', field: 'title', value: e.target.value })}/><label htmlFor="avnext-description">Description</label><textarea id="avnext-description" rows={4} maxLength={1200} value={model.document.fields.description} onChange={e => dispatch({ type: 'edit', field: 'description', value: e.target.value })}/><button className="avnext-button avnext-primary" onClick={() => dispatch({ type: 'suggest' })}>Inspect suggested change</button></div>
          <aside className="avnext-preview"><h2>TEXT PREVIEW</h2><div className="avnext-preview-planet" aria-hidden="true"/><h3>{model.document.fields.title || 'Untitled draft'}</h3><p>{model.document.fields.description || 'No description yet.'}</p><small>Text only. No project code is executed.</small></aside>
        </div>
        <ActionLens document={model.document} proposal={model.proposal} receipt={model.receipt} message={model.message} onApply={() => dispatch({ type: 'apply' })} onCancel={() => dispatch({ type: 'cancel' })} onUndo={() => dispatch({ type: 'undo' })}/>
        <p className="avnext-caption">No new IREN instance, provider connection, account session, file storage, XP, submission or publication is created here.</p>
      </section>}
    </main>
    <footer className="avnext-footer"><span>ANEVUM / CONTINUANCE INTERFACE LAB</span><span>DESIGN REVIEW / NOT A PRODUCTION RELEASE</span></footer>
  </div>;
}
