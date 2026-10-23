import type {StudioCategory,StudioDraft} from './canonical-studio';

// Private project-record starters, not runnable apps or hosted source files.
// Keep the exact server StudioDraft contract and its strict slug/text limits.
export type StarterKind='game'|'app'|'story'|'creative';
export interface StarterPreset {
 id:StarterKind;
 label:string;
 description:string;
 category:StudioCategory;
 suggestedSummary:string;
}
export const STARTER_PRESETS:readonly StarterPreset[]=Object.freeze([
 {id:'game',label:'Browser game',description:'Start a private record for a game or interactive prototype.',
  category:'games',suggestedSummary:'A private browser-game project being prepared for its first playable build.'},
 {id:'app',label:'Application',description:'Plan a utility or web application before preparing an executable build.',
  category:'tools',suggestedSummary:'A private application project for creating and testing useful browser software.'},
 {id:'story',label:'Interactive story',description:'Organize branching narrative work. Workbench access is a separate pilot.',
  category:'games',suggestedSummary:'A private interactive story with branching scenes and meaningful choices.'},
 {id:'creative',label:'Creative experiment',description:'Organize interactive art, sketches, or a simulation.',
  category:'creative',suggestedSummary:'A private creative experiment exploring an interactive digital idea.'}
]);
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const CONTROL=/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;
export function starterDraft(kind:StarterKind,title:string,summary:string,requestId:string):StudioDraft {
 const preset=STARTER_PRESETS.find(candidate=>candidate.id===kind);
 if(!preset)throw Error('Choose a supported project starter.');
 if(!UUID.test(requestId))throw Error('Invalid project request identifier.');
 const trimmedTitle=title.trim(),trimmedSummary=summary.trim();
 if(trimmedTitle.length<3||trimmedTitle.length>100||CONTROL.test(title))throw Error('Project title must be 3 to 100 characters.');
 if(trimmedSummary.length<10||trimmedSummary.length>280||CONTROL.test(summary))throw Error('Project summary must be 10 to 280 characters.');
 let slug=trimmedTitle.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
  .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,67).replace(/-+$/g,'');
 if(slug.length<3)slug='creation';
 slug+='-'+requestId.slice(0,8);
 return {
  slug,title:trimmedTitle,summary:trimmedSummary,
  description:'Private project record created with the '+preset.label+' starter. No runnable source, playable build or publication has been generated.',
  category:preset.category,freeToUse:true,license:'',sourceUrl:null,demoUrl:null,
  aiDisclosure:'',humanContribution:''
 };
}
