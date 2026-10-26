/**
 * PARITY V136.019 / Real creator cover first, branded type fallback second.
 * This mapping is closed to unknown categories and never accepts a URL or path
 * from public data. SVGs are first-party, hand-authored, resolution-independent.
 */
export const projectThumbnailPresets = {
 games:{asset:'games',label:'game'},
 tools:{asset:'tools',label:'app or tool'},
 automation:{asset:'automation',label:'automation'},
 research:{asset:'research',label:'research project'},
 creative:{asset:'creative',label:'creative project'},
 learning:{asset:'learning',label:'learning resource'},
 libraries:{asset:'libraries',label:'open-source library'},
 other:{asset:'other',label:'independent project'},
 game:{asset:'games',label:'browser game'},
 app:{asset:'tools',label:'browser app'},
 simulation:{asset:'simulation',label:'simulation'},
 story:{asset:'story',label:'interactive story'}
} as const;

export type ProjectThumbnailKind=keyof typeof projectThumbnailPresets;
export function projectThumbnailPreset(kind:unknown){
 return typeof kind==='string'&&Object.prototype.hasOwnProperty.call(projectThumbnailPresets,kind)
   ?projectThumbnailPresets[kind as ProjectThumbnailKind]
   :projectThumbnailPresets.other;
}
export function defaultProjectThumbnailUrl(kind:unknown,baseUrl='/'):string{
 const base=baseUrl.endsWith('/')?baseUrl:baseUrl+'/';
 return base+'assets/default-thumbnails/v136-baseline-005/'+projectThumbnailPreset(kind).asset+'.svg';
}
