/** Read-only wayfinding inside the default-off Living Commons review. */
import {useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent} from 'react';
import {useNavigate} from 'react-router-dom';
import {OrbitalMark} from '../components/OrbitalMark';
import {COMMONS_DISTRICTS, normalizeCommonsSearch, type CommonsPreviewQuery, type CommonsPreviewView} from '../lib/commons-next-model';
import type {Category} from '../lib/api';

type Destination = Readonly<{
  id: string;
  label: string;
  description: string;
  group: 'Commons views' | 'Creative fields' | 'Public directories';
  view?: CommonsPreviewView;
  district?: Category;
  directory?: 'discover' | 'creators';
}>;
const DESTINATIONS: readonly Destination[] = [
  {id: 'signals', label: 'Signal Board', description: 'Published work and conversations', group: 'Commons views', view: 'signals'},
  {id: 'atlas', label: 'District Atlas', description: 'Explore the map of disciplines', group: 'Commons views', view: 'atlas'},
  {id: 'people', label: 'People & Worlds', description: 'Meet the people behind the work', group: 'Commons views', view: 'people'},
  ...COMMONS_DISTRICTS.map(item => ({id: 'field-' + item.id, label: item.title, description: item.description, group: 'Creative fields' as const, district: item.id})),
  {id: 'discover', label: 'Full Discover', description: 'Continue with your project filters', group: 'Public directories', directory: 'discover'},
  {id: 'creators', label: 'Creator Directory', description: 'Continue with your creator search', group: 'Public directories', directory: 'creators'}
];
const GROUPS = ['Commons views', 'Creative fields', 'Public directories'] as const;

type Props = Readonly<{
  view: CommonsPreviewView;
  category: Category | '';
  discoverPath: string;
  creatorsPath: string;
  onChoose: (changes: Partial<CommonsPreviewQuery>) => void;
}>;

export function CommonsQuickNavigator({view, category, discoverPath, creatorsPath, onChoose}: Props) {
  const navigate = useNavigate();
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const selected = useRef(false);
  const [query, setQuery] = useState('');
  const [opened, setOpened] = useState(false);
  const matches = useMemo(() => {
    const tokens = normalizeCommonsSearch(query).toLowerCase().split(' ').filter(Boolean);
    return DESTINATIONS.filter(item => {
      const text = (item.label + ' ' + item.description + ' ' + item.group).toLowerCase();
      return tokens.every(token => text.includes(token));
    });
  }, [query]);

  const openNavigator = useCallback((source?: HTMLElement) => {
    const modal = dialog.current;
    if (!modal || modal.open) return;
    // Do not compete with another modal, including the existing Shell guide.
    const occupied = Array.from(document.querySelectorAll('dialog[open], [role="dialog"][aria-modal="true"]'))
      .some(element => element !== modal && element.getClientRects().length > 0);
    if (occupied) return;
    opener.current = source ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    selected.current = false;
    setQuery('');
    modal.showModal();
    setOpened(true);
    input.current?.focus({preventScroll: true});
  }, []);

  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat || event.isComposing || event.altKey || event.shiftKey) return;
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'k') return;
      // A native modal or editable application surface owns its own shortcuts.
      const target = event.target;
      if (!dialog.current?.open && target instanceof HTMLElement && target.closest('textarea, [contenteditable="true"]')) return;
      const occupied = Array.from(document.querySelectorAll('dialog[open], [role="dialog"][aria-modal="true"]'))
        .some(element => element !== dialog.current && element.getClientRects().length > 0);
      if (occupied) return;
      event.preventDefault();
      if (dialog.current?.open) dialog.current.close();
      else openNavigator();
    };
    window.addEventListener('keydown', shortcut);
    return () => window.removeEventListener('keydown', shortcut);
  }, [openNavigator]);

  const choose = (destination: Destination) => {
    selected.current = true;
    dialog.current?.close();
    if (destination.view) onChoose({view: destination.view});
    else if (destination.district) onChoose({view: 'signals', category: destination.district});
    else if (destination.directory === 'discover') navigate(discoverPath);
    else if (destination.directory === 'creators') navigate(creatorsPath);
  };
  const move = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.nativeEvent.isComposing || (event.key !== 'ArrowDown' && event.key !== 'ArrowUp' && event.key !== 'Home' && event.key !== 'End')) return;
    event.preventDefault();
    const options = Array.from(dialog.current?.querySelectorAll<HTMLButtonElement>('.lnx-quick-choice') ?? []);
    const index = options.indexOf(event.currentTarget);
    if (!options.length) return;
    if (event.key === 'Home') options[0]?.focus();
    else if (event.key === 'End') options[options.length - 1]?.focus();
    else if (event.key === 'ArrowUp' && index === 0) input.current?.focus();
    else options[(index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length]?.focus();
  };
  const close = () => {
    setOpened(false);
    setQuery('');
    // Selection lets the existing Shell/page restore the new destination's focus.
    // Cancellation returns to the invoker, including pointer-opened Safari dialogs.
    if (!selected.current) {
      const target = opener.current?.isConnected && opener.current !== document.body ? opener.current : trigger.current;
      target?.focus({preventScroll: true});
    }
  };

  return <>
    <button ref={trigger} type="button" className="lnx-quick-entry" aria-haspopup="dialog" aria-expanded={opened} aria-controls="lnx-quick-dialog" aria-keyshortcuts="Control+K Meta+K" onClick={event => openNavigator(event.currentTarget)}>
      <span>Quick Navigator</span><kbd>Ctrl / Cmd K</kbd>
    </button>
    <dialog ref={dialog} id="lnx-quick-dialog" className="lnx-quick-dialog" aria-modal="true" aria-labelledby="lnx-quick-title" aria-describedby="lnx-quick-help" onClose={close}>
      <div className="lnx-quick-panel">
        <header className="lnx-quick-top"><span className="lnx-quick-brand" aria-hidden="true"><OrbitalMark/></span><span className="lnx-kicker">CONTINUANCE / WAYFINDING</span><button type="button" className="lnx-quick-close" aria-label="Close Quick Navigator" onClick={() => dialog.current?.close()}>Close <span aria-hidden="true">&#215;</span></button></header>
        <h2 id="lnx-quick-title">Where to next?</h2>
        <p id="lnx-quick-help">Find a Commons view, creative field, or public directory. Use arrows, Tab and Enter to choose. Escape closes this panel.</p>
        <label htmlFor="lnx-quick-search">Find a destination</label>
        <input ref={input} id="lnx-quick-search" type="text" inputMode="search" enterKeyHint="go" maxLength={72} autoComplete="off" spellCheck={false} placeholder="Try research, people, or the atlas" value={query} onChange={event => setQuery(event.target.value)} onKeyDown={event => {
          if (event.nativeEvent.isComposing) return;
          if (event.key === 'Enter' && matches[0]) {event.preventDefault(); choose(matches[0]);}
          else if (event.key === 'ArrowDown' && matches.length) {event.preventDefault(); dialog.current?.querySelector<HTMLButtonElement>('.lnx-quick-choice')?.focus();}
        }}/>
        <div className="lnx-quick-count" role="status" aria-live="polite">{matches.length} {matches.length === 1 ? 'destination' : 'destinations'}</div>
        <div className="lnx-quick-results">
          {GROUPS.map(group => {
            const items = matches.filter(item => item.group === group);
            return items.length > 0 ? <section className="lnx-quick-group" key={group} aria-label={group}>
              <h3>{group}</h3><div className="lnx-quick-grid">{items.map(item => <button key={item.id} type="button" className="lnx-quick-choice" data-destination={item.id} onClick={() => choose(item)} onKeyDown={move} aria-current={item.view === view ? 'page' : undefined}>
                <strong>{item.label}</strong><span>{item.description}</span><em aria-hidden="true">&#8599;</em>
                {item.view === view && <small>Current view</small>}
                {view === 'signals' && item.district && item.district === category && <small>Selected field</small>}
              </button>)}</div>
            </section> : null;
          })}
          {matches.length === 0 && <div className="lnx-quick-empty"><strong>No matching destinations.</strong><p>Try a discipline or one of the three Commons views.</p><button type="button" className="lnx-quick-reset" onClick={() => {setQuery(''); input.current?.focus();}}>Clear search</button></div>}
        </div>
        <p className="lnx-quick-note">NAVIGATION ONLY / NO ACCOUNT CHANGES</p>
      </div>
    </dialog>
  </>;
}
