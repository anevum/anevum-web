import {useState} from 'react';
import {safePackageCover} from '../lib/creator-package-gallery-v010';
import {defaultProjectThumbnailUrl,projectThumbnailPreset} from '../lib/project-thumbnails';

/**
 * Shared project media rule. The only presently approved uploaded-cover URL
 * comes from the canonical package service; legacy public project records do
 * not yet expose a reviewed media field. No external URL, private upload,
 * client-generated screenshot or unapproved artwork is inferred.
 *
 * An accepted cover that fails to load becomes the actual category SVG, with
 * the source state reflected in the DOM. New uploaded URLs reset naturally.
 */
export function ProjectThumbnail({kind,title,uploadedUrl=null,priority=false,className='',decorative=false}:{
 kind:string;title:string;uploadedUrl?:string|null;priority?:boolean;
 className?:string;decorative?:boolean;
}){
 const verified=safePackageCover(uploadedUrl);
 const [failedUrl,setFailedUrl]=useState<string|null>(null);
 const uploaded=Boolean(verified&&verified!==failedUrl);
 const fallback=defaultProjectThumbnailUrl(kind,import.meta.env.BASE_URL);
 const src=uploaded?verified!:fallback;
 const alt=decorative?'':uploaded
   ?'Thumbnail supplied by the creator for '+title
   :'Default ANEVUM '+projectThumbnailPreset(kind).label+' thumbnail for '+title;
 return <img className={'av136-project-thumbnail '+className}
   src={src} alt={alt} data-thumbnail-source={uploaded?'creator':'default'}
   data-thumbnail-kind={projectThumbnailPreset(kind).asset}
   loading={priority?'eager':'lazy'} fetchPriority={priority?'high':'auto'}
   decoding="async" referrerPolicy="same-origin" draggable={false}
   onError={uploaded?()=>setFailedUrl(verified):undefined}/>;
}
