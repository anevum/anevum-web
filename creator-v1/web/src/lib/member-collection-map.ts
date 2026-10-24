/**
 * ANEVUM member destinations: one explicit place for each existing canonical
 * experience. This is NOT a collection schema, server permission or XP ledger.
 */
export type MemberCollectionSection='space'|'saved'|'levels'|'awards';
export type MemberCollectionDestination=Readonly<{
 id:MemberCollectionSection;label:string;to:string;description:string;
}>;
export const MEMBER_COLLECTION_DESTINATIONS:ReadonlyArray<MemberCollectionDestination>=[
 {id:'space',label:'My Space',to:'/member',description:'Profile, wall and personal settings'},
 {id:'saved',label:'Saved Projects',to:'/saved',description:'Private projects you chose to keep'},
 {id:'levels',label:'Evolution',to:'/levels',description:'Your verified level discoveries'},
 {id:'awards',label:'Awards',to:'/recognition',description:'Badges and honors you have earned'}
];
export function memberCollectionPath(id:MemberCollectionSection):string{
 const found=MEMBER_COLLECTION_DESTINATIONS.find(item=>item.id===id);
 if(!found)throw Error('Unknown member destination');
 return found.to;
}
export function memberCollectionCurrent(pathname:string):MemberCollectionSection|null{
 const path=pathname.split('?')[0].replace(/\/+$/,'')||'/';
 return MEMBER_COLLECTION_DESTINATIONS.find(item=>item.to===path)?.id??null;
}
