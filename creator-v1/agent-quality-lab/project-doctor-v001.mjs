// Read-only deterministic Studio diagnostics, for consent-gated AI proposals later.
// No model calls, network access, arbitrary script execution, or project writes.
import * as blocks from '../workbench-alpha/document.mjs';
import * as ui from '../interface-builder/document.mjs';

const MAX_SOURCE_BYTES = 32768;
const MAX_FINDINGS = 32;
const textBytes = source => new TextEncoder().encode(source).length;
const finding = (code, severity, path, message) => ({code, severity, path, message});

function gatherNarrative(doc) {
  const findings = [];
  const nodes = doc.blocks;
  const scenes = nodes.filter(b => b.type === 'scene');
  if (!scenes.length) {
    findings.push(finding('scene.missing', 'warning', 'blocks', 'No scenes exist to navigate.'));
    return findings;
  }
  const edges = new Map(scenes.map(scene => [scene.id, new Set()]));
  let current = null;
  for (const [index, block] of nodes.entries()) {
    if (block.type === 'scene') {
      current = block.id;
      if (!block.text.trim()) findings.push(finding('scene.unnamed','warning','blocks/' + index,'Scene needs a descriptive title.'));
    }
    if (block.type === 'choice') {
      if (!block.text.trim()) findings.push(finding('choice.unlabeled','warning','blocks/' + index,'Choice needs a readable label.'));
      if (block.target === null) findings.push(finding('choice.unlinked','warning','blocks/' + index,'Choice has no destination scene.'));
      if (current && block.target) edges.get(current).add(block.target);
    }
  }
  const reachable = new Set();
  const pending = [scenes[0].id];
  while (pending.length) {
    const id = pending.pop();
    if (reachable.has(id)) continue;
    reachable.add(id);
    for (const destination of edges.get(id) || []) {
      if (!reachable.has(destination)) pending.push(destination);
    }
  }
  for (const scene of scenes.slice(1)) {
    if (!reachable.has(scene.id)) {
      findings.push(finding('scene.unreachable','warning',
        'blocks/' + nodes.findIndex(b => b.id === scene.id),'Scene cannot be reached through choices from the first scene.'));
    }
  }
  return findings;
}

function gatherInterface(doc) {
  const findings = [];
  const edges = new Map(doc.pages.map(page => [page.id,new Set()]));
  for (const [pageIndex, page] of doc.pages.entries()) {
    if (!page.components.length) findings.push(finding('page.empty','info','pages/' + pageIndex,'Page contains no components.'));
    for (const [index, component] of page.components.entries()) {
      const path = 'pages/' + pageIndex + '/components/' + index;
      if (component.kind === 'button') {
        if (!component.title.trim() && !component.text.trim()) {
          findings.push(finding('button.unlabeled','warning',path,'Button has no readable label.'));
        }
        if (component.action === 'none') {
          findings.push(finding('button.inert','info',path,'Button has no interaction assigned.'));
        }
        if (component.action === 'navigate') edges.get(page.id).add(component.target);
      }
      if (component.kind === 'input' && !component.title.trim()) {
        findings.push(finding('input.unlabeled','warning',path,'Input needs a visible label.'));
      }
    }
  }
  const visited = new Set();
  const pending = [doc.pages[0].id];
  while (pending.length) {
    const id = pending.pop();
    if (visited.has(id)) continue;
    visited.add(id);
    for (const next of edges.get(id) || []) {
      if (!visited.has(next)) pending.push(next);
    }
  }
  doc.pages.slice(1).forEach((page, index) => {
    if (!visited.has(page.id)) {
      findings.push(finding('page.unreachable','warning','pages/' + (index+1),
        'Page has no navigable path from the first page.'));
    }
  });
  return findings;
}

export function diagnoseStudioSource(source) {
  const invalid = (code, message) => ({
    format:'unknown', valid:false, mode:'read-only',
    findings:[finding(code,'error','document',message)], truncated:false
  });
  if (typeof source !== 'string') return invalid('source.type','Expected encoded text source.');
  if (textBytes(source) > MAX_SOURCE_BYTES) return invalid('source.too_large','Source exceeds the offline inspection limit.');
  let format, doc, inspect;
  if (source.startsWith(blocks.PREFIX)) {
    format = 'anevum.blocks.v1';
    doc = blocks.decode(source);
    inspect = gatherNarrative;
  } else if (source.startsWith(ui.PREFIX)) {
    format = 'anevum.ui.v1';
    doc = ui.decode(source);
    inspect = gatherInterface;
  } else return invalid('source.unsupported','Only canonical ANEVUM_BLOCKS_V1 or ANEVUM_UI_V1 encoded documents are supported.');
  if (!doc) return {
    format, valid:false, mode:'read-only', truncated:false,
    findings:[finding('document.invalid','error','document','The document failed canonical schema and size validation; original source was not changed.')]
  };
  const all = inspect(doc);
  return {format, valid:true, mode:'read-only',
    findings:all.slice(0, MAX_FINDINGS), truncated:all.length > MAX_FINDINGS};
}
