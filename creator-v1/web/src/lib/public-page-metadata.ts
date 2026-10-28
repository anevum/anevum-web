/**
 * Public Creator V1 metadata for client-side transitions.
 * No authentication, server claims or unpublished creator records.
 * Dynamic/private routes remain unindexed until their public data is verified.
 *
 * The frontend-only release cannot rewrite initial HTTP HTML responses.
 * Server-rendered crawlers and social unfurling require separate reviewed
 * asset/gateway release work. This module does not imply that gate is complete.
 */
export type PublicPageMeta=Readonly<{
  title:string;
  description:string;
  canonicalPath:string|null;
  indexable:boolean;
}>;

type Copy=Readonly<{title:string;description:string}>;
const publicPages:Readonly<Record<string,Copy>>={
  '/':{
    title:'ANEVUM — Independent Games & Software Studio',
    description:'ANEVUM builds original games and practical creative software. Discover the TRANSCOSMIC: SEVERANCE survival-horror concept, development updates and approved public work.'
  },
  '/severance':{
    title:'TRANSCOSMIC: SEVERANCE — Game in Development | ANEVUM',
    description:'Explore the design for SEVERANCE, a persistent PvPvE survival-horror game in development. This is a concept and technical prototype, not a publicly playable release.'
  },
  '/about':{
    title:'About ANEVUM — Independent Software Studio',
    description:'Learn about ANEVUM, an independent studio developing original games, useful software and creative tools, with transparent development and real published work.'
  },
  '/discover':{
    title:'Discover Original Games, Apps & Creative Work | ANEVUM',
    description:'Explore actual published games, useful apps, art and independent projects on ANEVUM. Browse approved work and find its creators.'
  },
  '/start':{
    title:'Start Here — Find Your Way into ANEVUM',
    description:'Explore ANEVUM by choosing what you want to play, make, discover or learn. Understand available creator and community features.'
  },
  '/guide':{
    title:'Field Guide — Learn the ANEVUM Underground',
    description:'Work through free, practical decisions and discover the real tools, projects and community available within ANEVUM.'
  },
  '/creators':{
    title:'Creators — Meet the People Making ANEVUM',
    description:'Find public creator channels and the people behind published independent games, applications and original work.'
  },
  '/community':{
    title:'Commons — ANEVUM Community',
    description:'Read approved public conversations, creator updates and community activity. Account and posting permissions are verified separately.'
  },
  '/boards':{
    title:'Public Boards — ANEVUM',
    description:'Explore moderated public boards and genuinely published community and creator records on ANEVUM.'
  },
  '/status':{
    title:'What Is Live — ANEVUM Status',
    description:'Check verified ANEVUM service capabilities, public discovery, member availability and features still under development.'
  },
  '/levels':{
    title:'Evolution Levels — ANEVUM',
    description:'Explore ANEVUM evolution levels and how verified member activity and earned recognition work.'
  },
  '/recognition':{
    title:'Recognition Archive — ANEVUM',
    description:'Explore ANEVUM recognition, achievements and earned distinctions without invented activity or unearned rewards.'
  },
  '/auras':{
    title:'Aura Codex — ANEVUM',
    description:'Explore the visual language of ANEVUM levels and earned distinctions.'
  },
  '/join':{
    title:'Join ANEVUM — Check Member Access',
    description:'See current ANEVUM account availability and supported sign-in methods before joining the Continuance.'
  },
  '/support':{
    title:'Support ANEVUM',
    description:'Learn about supporting ANEVUM, independent work and the creative community. Check which options are currently available.'
  },
  '/support/transparency':{
    title:'Support Transparency — ANEVUM',
    description:'Read how ANEVUM describes supporter contributions, eligibility and transparency.'
  }
};
const privatePrefixes=[
  '/member','/library','/saved','/studio','/account','/create',
  '/workspace','/projects/package','/community/write','/community/review'
];
export function publicPageMetadata(pathname:string):PublicPageMeta{
  const path=pathname.replace(/\/+$/,'')||'/';
  const publicPage=publicPages[path];
  if(publicPage)return {...publicPage,canonicalPath:path,indexable:true};
  const privatePage=privatePrefixes.some(prefix=>path===prefix||path.startsWith(prefix+'/'));
  return {
    title:privatePage?'Your Space | ANEVUM':'ANEVUM — Published Work & Community',
    description:privatePage
      ?'Private workspaces and account features require their own verified permissions.'
      :'Explore approved public work and community destinations on ANEVUM.',
    canonicalPath:null,
    indexable:false
  };
}
