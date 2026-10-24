export type StudioPaletteItem={
 id:string;fileId?:string;kind:'file'|'command';label:string;detail:string;
 category:string;priority:number;disabled:boolean;shortcut?:string
};
export declare const PALETTE_MODES:readonly ('files'|'commands')[];
export declare function studioFileItems(nodes:ReadonlyArray<{id:string;name:string;kind:string}>,paths?:ReadonlyArray<{id:string;path:string}>,recentIds?:ReadonlyArray<string>):StudioPaletteItem[];
export declare function studioCommandItems(allowed:ReadonlyArray<string>):StudioPaletteItem[];
export declare function rankStudioItems(items:ReadonlyArray<StudioPaletteItem>,query?:string,limit?:number):StudioPaletteItem[];
