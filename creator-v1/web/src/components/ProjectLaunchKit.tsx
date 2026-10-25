import {useState} from "react";
import type {Project} from "../lib/api";
import {buildProjectLaunchKit} from "../lib/launch-kit-v136018";
import "./project-launch-kit-v136018.css";

/** A small additive free distribution instrument, not a launch approval flow.
 * The parent only renders after the canonical public project endpoint succeeds.
 */
export function ProjectLaunchKit({project}:{project:Pick<Project,"id"|"title">}){
  const [notice,setNotice]=useState("");
  const origin=typeof window==="undefined"?"https://anevum.com":window.location.origin;
  let kit:ReturnType<typeof buildProjectLaunchKit>;
  try{kit=buildProjectLaunchKit(project,origin);}catch{return null;}
  const nativeShare=typeof navigator!=="undefined"&&typeof navigator.share==="function";

  async function copy(value:string,what:"link"|"badge"){
    try{
      if(!navigator.clipboard?.writeText)throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(value);
      setNotice(what==="link"?"Project link copied.":"Embed link copied.");
    }catch{
      setNotice("Automatic copying is unavailable. Select the field and copy it manually.");
    }
  }
  async function share(){
    if(!nativeShare){await copy(kit.url,"link");return;}
    try{
      await navigator.share({title:project.title,text:"Explore this project on ANEVUM",url:kit.url});
      setNotice("");
    }catch(error){
      if(error instanceof Error&&error.name==="AbortError")return;
      setNotice("Sharing is unavailable. You can copy the link instead.");
    }
  }

  return <section className="portal-sidebox avp-launch-kit" aria-labelledby="avp-launch-kit-title">
    <span className="kicker">CREATOR SIGNAL / FREE</span>
    <h2 id="avp-launch-kit-title">SHARE THIS RELEASE</h2>
    <p>Every approved project has a shareable page. No paid placement or tracking link required.</p>
    <label className="avp-launch-kit-label" htmlFor="avp-launch-kit-link">PUBLIC PROJECT LINK</label>
    <input id="avp-launch-kit-link" type="text" readOnly value={kit.url}
      onFocus={event=>event.currentTarget.select()} aria-label="Shareable public project link"/>
    <div className="avp-launch-kit-actions">
      <button type="button" onClick={()=>void copy(kit.url,"link")}>Copy link</button>
      {nativeShare&&<button type="button" onClick={()=>void share()}>Share</button>}
    </div>
    <details className="avp-launch-kit-embed">
      <summary>Embeddable project link</summary>
      <p>Plain HTML for a website or README. No scripts, badges claiming awards, or analytics pixels.</p>
      <label className="avp-launch-kit-label" htmlFor="avp-launch-kit-html">EMBED HTML</label>
      <textarea id="avp-launch-kit-html" readOnly value={kit.embedHtml} rows={3}
        onFocus={event=>event.currentTarget.select()}/>
      <button type="button" onClick={()=>void copy(kit.embedHtml,"badge")}>Copy embed HTML</button>
    </details>
    {notice&&<p className="avp-launch-kit-notice" role="status" aria-live="polite">{notice}</p>}
  </section>;
}
