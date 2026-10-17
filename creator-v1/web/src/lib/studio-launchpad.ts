import type {StudioCategory,StudioDraft} from './canonical-studio';
import {createStudioStarterDocument,encodeStudioBlockDocument} from './studio-blocks';

// V053 intentionally creates *private project records*, not rendered templates.
// Each template supplies an editable text scaffold for the existing Studio.
// Structured block editing and public playback are later, separate milestones.
export interface StudioStarter {
 id:string;eyebrow:string;title:string;description:string;
 category:StudioCategory;seedTitle:string;seedSummary:string;outline:string;
 icon:'story'|'gallery'|'audio'|'choices'|'experience'|'import';
}
export const STUDIO_STARTERS:readonly StudioStarter[]=Object.freeze([
 {id:'story',eyebrow:'TELL A STORY',title:'Story or digital zine',
  description:'Write a short story, personal essay, or mini magazine.',
  category:'writing',seedTitle:'Untitled story',seedSummary:'A new story or digital zine to develop in ANEVUM.',
  outline:'STORY OUTLINE\n\nOpening: What should someone experience first?\n\nMiddle: What changes or develops?\n\nEnding: What should someone remember?\n\nCredits: Add your collaborators when you are ready.',
  icon:'story'},
 {id:'gallery',eyebrow:'SHOW YOUR WORK',title:'Art collection',
  description:'Plan a gallery with images, descriptions, and credits.',
  category:'art',seedTitle:'Untitled art collection',seedSummary:'A curated collection of original visual work.',
  outline:'ART COLLECTION\n\nTheme: What connects these pieces?\n\nPiece 1: Title and description\n\nPiece 2: Title and description\n\nCredits: Record artists and permissions before sharing.',
  icon:'gallery'},
 {id:'audio',eyebrow:'SHARE YOUR SOUND',title:'Music or audio release',
  description:'Organize a track, podcast, soundscape, or short performance.',
  category:'music',seedTitle:'Untitled audio project',seedSummary:'A new music, podcast, or audio creation to share.',
  outline:'AUDIO RELEASE\n\nWorking title:\n\nWhat is the sound or story behind this work?\n\nTrack listing or episode notes:\n\nCredits and sample permissions:',
  icon:'audio'},
 {id:'choices',eyebrow:'WRITE WITH CHOICES',title:'Branching narrative',
  description:'Sketch a story where choices influence what happens next.',
  category:'creative',seedTitle:'Untitled interactive story',seedSummary:'An interactive story concept with branching choices.',
  outline:'INTERACTIVE STORY OUTLINE\n\nScene 1: Where does the story begin?\n\nChoice A: What could happen?\n\nChoice B: What could happen instead?\n\nScene 2: What changes?\n\nThis starter is an outline, not a running game.',
  icon:'choices'},
 {id:'experience',eyebrow:'EXPLORE AN IDEA',title:'Interactive experiment',
  description:'Conceptualize a small interactive experience or mini game.',
  category:'games',seedTitle:'Untitled interactive experiment',seedSummary:'A new interactive experience or game concept to develop.',
  outline:'INTERACTIVE EXPERIMENT\n\nWhat can the audience do?\n\nWhat changes after a click, choice, or action?\n\nWhat is the reward or ending?\n\nBuild notes:\n\nThis private starter does not create an executable game.',
  icon:'experience'},
 {id:'import',eyebrow:'BRING YOUR CREATION',title:'Existing project',
  description:'Start a private record for a game, application, film, or other work.',
  category:'creative',seedTitle:'My existing creation',seedSummary:'A private record for an existing creative project.',
  outline:'EXISTING PROJECT NOTES\n\nWhat have you made?\n\nWhere is the finished work or demo?\n\nWhich parts do you own?\n\nUploaded files are not available until the private pilot is enabled.',
  icon:'import'},
]);

export function studioStarter(id:string):StudioStarter|undefined {
 return STUDIO_STARTERS.find(x=>x.id===id);
}
const CONTROL=/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;
const validId=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
function suffix(id:string):string {
 if(!validId.test(id))throw new Error('A valid private draft request ID is required.');
 return id.replaceAll('-','').slice(0,16); // 64-bit suffix minimizes same-title collisions.
}
function safeText(input:string,min:number,max:number):string {
 if(typeof input!=='string'||CONTROL.test(input))throw new Error('Remove unsupported control characters.');
 const s=input.trim();
 if(s.length<min)throw new Error('Add a few words about what you want to create.');
 if(s.length>max)throw new Error('Keep this idea under '+max+' characters.');
 return s;
}
function safeSlug(title:string,id:string):string {
 const slug=title.normalize('NFKD').toLowerCase().replace(/[\u0300-\u036f]/g,'')
  .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,56).replace(/-+$/g,'');
 return (slug||'new-creation')+'-'+suffix(id);
}
function draftBase(title:string,summary:string,description:string,category:StudioCategory,id:string):StudioDraft {
 return {slug:safeSlug(title,id),title,summary,description,category,
  freeToUse:false,license:'',sourceUrl:null,demoUrl:null,
  aiDisclosure:'',humanContribution:''};
}
export function ideaToDraft(idea:string,id:string,category:StudioCategory='creative'):StudioDraft {
 const clean=safeText(idea,2,2000);
 const first=clean.split(/[\n.!?]/,1)[0]?.trim()||'';
 const title=(first.length>=3?first:'New creation').slice(0,90).trimEnd();
 const synopsis=('Idea: '+clean.replace(/\s+/g,' ')).slice(0,280).trimEnd();
 const summary=synopsis.length>=10?synopsis:'A new creative idea to explore.';
 return draftBase(title,summary,clean,category,id);
}
export function starterToDraft(starterId:string,id:string):StudioDraft {
 const starter=studioStarter(starterId);
 if(!starter)throw new Error('Choose an available starter.');
 const visualStarter=starterId==='story'||starterId==='gallery'||starterId==='choices';
 const outline=visualStarter?encodeStudioBlockDocument(createStudioStarterDocument(starterId)):starter.outline;
 return draftBase(starter.seedTitle,starter.seedSummary,outline,starter.category,id);
}
export function existingWorkToDraft(
 titleInput:string,category:StudioCategory,id:string,urlInput=''
):StudioDraft {
 const title=safeText(titleInput,3,100);
 const url=urlInput.trim();
 let demoUrl:string|null=null;
 if(url){
  let parsed:URL;
  try{parsed=new URL(url);}catch{throw new Error('Enter a full HTTPS link or leave it blank.');}
  if(parsed.protocol!=='https:'||parsed.username||parsed.password||!parsed.hostname||
    /^(?:localhost|.*\.localhost|127(?:\.\d+){3}|0\.0\.0\.0|\[::1\])$/i.test(parsed.hostname))
   throw new Error('Only public HTTPS links can be saved.');
  demoUrl=parsed.href;
 }
 const draft=draftBase(title,'A private record for an existing creative work.',
  'Describe the finished creation, your ownership, collaborators, and what you want to share.',category,id);
 return {...draft,demoUrl};
}
