// Continuance Lab V001.7: bounded, local, deterministic repair education.
// A guide never depends on project source text, member identity or model output.
// These are human-review instructions, not executable patches or guaranteed fixes.

const GUIDE_DATA = {
  'scene.missing': {
    title:'Give the story a starting point',
    impact:'A branching story without a scene has no starting location for scene navigation.',
    steps:['Add a Scene block in the visual composer.','Give that scene a clear name and place it where the story should begin.'],
    verify:'Inspect the draft again and confirm the missing-scene warning is no longer reported.',
    note:'If the document is intentionally prose-only, you may prefer a different authoring format.'
  },
  'scene.unnamed': {
    title:'Make this scene recognizable',
    impact:'An unnamed scene is harder for a creator to distinguish while building navigation.',
    steps:['Open the affected scene using the editor navigation control.','Enter a short, descriptive scene title.'],
    verify:'Reinspect the current draft and check that this scene no longer has an unnamed-scene warning.',
    note:'This is an editorial quality check, not a guarantee of story quality.'
  },
  'scene.unreachable': {
    title:'Connect or retire the unused scene',
    impact:'A player following linked choices from the first scene cannot reach this scene.',
    steps:['Decide whether the scene should be reachable in normal play.','If so, add or update a choice on a reachable scene that targets this one; otherwise consider removing the unused scene.'],
    verify:'Reinspect and confirm the scene is reachable through the intended choice path.',
    note:'Some deliberately hidden or work-in-progress scenes may be intentionally disconnected.'
  },
  'choice.unlabeled': {
    title:'Describe the action a player can choose',
    impact:'A choice with no visible description does not clearly tell the player what selecting it will do.',
    steps:['Select the affected Choice block.','Add short, meaningful wording that describes the action or destination.'],
    verify:'Reinspect and confirm the unlabeled-choice warning is no longer reported.',
    note:'A label is not a guarantee that the destination behaves correctly.'
  },
  'choice.unlinked': {
    title:'Give the choice a destination',
    impact:'A player can be offered an action that has nowhere to go.',
    steps:['Select the choice in the visual scene composer.','Choose an existing destination scene, or remove the unfinished choice if it is not needed.'],
    verify:'Reinspect the unsaved draft and confirm the choice is linked. Test the story path separately.',
    note:'Correcting a missing link can change scene reachability; review related warnings.'
  },
  'page.empty': {
    title:'Review the blank interface page',
    impact:'This interface page contains no components, so users may see an empty screen.',
    steps:['Decide whether the page is an intentional placeholder.','If it should be usable now, add an appropriate visual component.'],
    verify:'Reinspect after adding content and review the page in the actual UI preview.',
    note:'An empty page is informational, not necessarily an error.'
  },
  'page.unreachable': {
    title:'Make the page navigable',
    impact:'There is no recorded navigation path from the first interface page to this page.',
    steps:['Open the intended starting page in the UI builder.','Add a navigation button or revise an existing button to target this page.'],
    verify:'Reinspect and manually follow the intended navigation route in preview.',
    note:'External links, conditional flows and intentionally hidden pages may not be represented in this structural check.'
  },
  'button.unlabeled': {
    title:'Describe the button clearly',
    impact:'An unlabeled button gives little or no clue about its purpose and may make the interface harder to use.',
    steps:['Select the affected button in the interface builder.','Provide a concise, meaningful visible title or text.'],
    verify:'Reinspect and review the wording in preview and with accessibility tooling.',
    note:'The structural check does not establish complete accessibility or keyboard support.'
  },
  'button.inert': {
    title:'Connect the button to an action',
    impact:'The button has no assigned interaction, so clicking it may not produce the intended response.',
    steps:['Decide whether the element should be interactive.','Assign a supported action, or use a non-interactive component when it is only decorative.'],
    verify:'Reinspect and exercise the control in a safe preview.',
    note:'A configured action is not evidence the full app flow works.'
  },
  'input.unlabeled': {
    title:'Label the requested information',
    impact:'An unlabeled input makes it unclear what users should enter.',
    steps:['Select the input component in the interface builder.','Set a visible title that identifies the requested information.'],
    verify:'Reinspect the draft and separately check that the label is accessible in the rendered interface.',
    note:'A visible title alone does not certify semantic input-label association.'
  },
  'source.type': {
    title:'Use a supported text document',
    impact:'The inspector received something other than the expected source text.',
    steps:['Open a supported ANEVUM scene or interface document.','Run the inspector directly on that document in Creator Studio.'],
    verify:'Check that the format can be decoded and inspected without an error.',
    note:'The inspector does not execute arbitrary HTML or JavaScript.'
  },
  'source.too_large': {
    title:'Keep the document inside inspection limits',
    impact:'The local document exceeds the bounded size permitted by this diagnostic engine.',
    steps:['Reduce redundant or unused content without losing important work.','Try inspecting the smaller supported document again.'],
    verify:'Confirm the size-limit error is no longer reported.',
    note:'Do not discard original project data solely to make a diagnostic pass.'
  },
  'source.unsupported': {
    title:'Inspect a supported scene or UI document',
    impact:'This inspector supports canonical ANEVUM story and interface sources, not general program files.',
    steps:['Select an ANEVUM scene or interface document.','Use a dedicated code-testing tool for JavaScript, HTML or other source files.'],
    verify:'Confirm the document type is supported before retrying.',
    note:'This is not an arbitrary-code compiler, interpreter or vulnerability scanner.'
  },
  'document.invalid': {
    title:'Restore a valid document structure',
    impact:'The document did not pass its canonical structure and reference validation.',
    steps:['Preserve the original document and review recently changed references or IDs.','Revert or correct invalid changes using the existing revision controls.'],
    verify:'Reinspect the resulting document after canonical validation succeeds.',
    note:'The inspector does not silently repair malformed source or replace a saved revision.'
  }
};

// Each entry is source-independent and immutable to avoid accidental mutation
// across inspections. No dynamic project values are ever interpolated.
const GUIDES = Object.freeze(Object.fromEntries(Object.entries(GUIDE_DATA).map(([code,guide])=>[
  code, Object.freeze({
    code,
    title:guide.title,
    impact:guide.impact,
    steps:Object.freeze([...guide.steps]),
    verify:guide.verify,
    note:guide.note,
    execution:'local-rules',
    providerRequests:0,
    appliesChanges:false
  })
])));

export function localRepairGuide(code) {
  if (typeof code !== 'string' || !Object.hasOwn(GUIDES, code)) return null;
  return GUIDES[code];
}

export function availableLocalRepairCodes() {
  return Object.freeze(Object.keys(GUIDES).sort());
}
