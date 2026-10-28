import {useRef,useState} from "react";
import type {Project} from "../lib/api";
import {buildProjectLaunchKit} from "../lib/launch-kit-v136018";
import "./project-launch-kit-v136018.css";

/** A small additive free distribution instrument, not a launch approval flow.
 * The parent only renders after the canonical public project endpoint succeeds.
 */
export function ProjectLaunchKit({project}:{project:Pick<Project,"id"|"title">}){
  const [notice,setNotice]=useState("");
  const linkRef=useRef<HTMLInputElement>(null);
  const announcementRef=useRef<HTMLInputElement>(null);
  const announcementDetailsRef=useRef<HTMLDetailsElement>(null);
  const embedRef=useRef<HTMLTextAreaElement>(null);
  const embedDetailsRef=useRef<HTMLDetailsElement>(null);
  const origin=typeof window==="undefined"?"https://anevum.com":window.location.origin;
  let kit:ReturnType<typeof buildProjectLaunchKit>;
  try{kit=buildProjectLaunchKit(project,origin,import.meta.env.BASE_URL);}catch{return null;}
  const nativeShare=typeof navigator!=="undefined"&&typeof navigator.share==="function";

  async function copy(value:string,what:"link"|"badge"|"announcement"){
    try{
      if(!navigator.clipboard?.writeText)throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(value);
      setNotice(what==="link"?"Project link copied.":what==="announcement"?"Launch announcement copied.":"Embed link copied.");
    }catch{
      // A denied clipboard permission is common on embedded/console browsers.
      // Keep the actual public copy selectable, never claim a successful copy.
      if(what==="announcement"&&announcementDetailsRef.current)
        announcementDetailsRef.current.open=true;
      if(what==="badge"&&embedDetailsRef.current)
        embedDetailsRef.current.open=true;
      const field=what==="link"?linkRef.current:
        what==="announcement"?announcementRef.current:embedRef.current;
      field?.focus({preventScroll:true});
      field?.select();
      setNotice("Automatic copying is unavailable. The "+
        (what==="link"?"project link":what==="announcement"?"announcement":"embed HTML")+
        " is available for manual copying.");
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
    <input ref={linkRef} id="avp-launch-kit-link" type="text" readOnly value={kit.url}
      onFocus={event=>event.currentTarget.select()} aria-label="Shareable public project link"/>
    <div className="avp-launch-kit-actions">
      <button type="button" onClick={()=>void copy(kit.url,"link")}>Copy link</button>
      <button type="button" onClick={()=>void copy(kit.shareText,"announcement")}>Copy announcement</button>
      {nativeShare&&<button type="button" onClick={()=>void share()}>Share</button>}
    </div>
    <details ref={announcementDetailsRef} className="avp-launch-kit-announcement">
      <summary>Announcement text for manual copying</summary>
      <label className="avp-launch-kit-label" htmlFor="avp-launch-kit-announcement">ANNOUNCEMENT TEXT</label>
      <input ref={announcementRef} id="avp-launch-kit-announcement" type="text" readOnly
        value={kit.shareText} onFocus={event=>event.currentTarget.select()}/>
      <p className="member-caption">Select the text to copy it manually if your browser blocks the clipboard.</p>
    </details>
    <details ref={embedDetailsRef} className="avp-launch-kit-embed">
      <summary>Embeddable project link</summary>
      <p>Plain HTML for a website or README. No scripts, badges claiming awards, or analytics pixels.</p>
      <label className="avp-launch-kit-label" htmlFor="avp-launch-kit-html">EMBED HTML</label>
      <textarea ref={embedRef} id="avp-launch-kit-html" readOnly value={kit.embedHtml} rows={3}
        onFocus={event=>event.currentTarget.select()}/>
      <button type="button" onClick={()=>void copy(kit.embedHtml,"badge")}>Copy embed HTML</button>
    </details>
    {notice&&<p className="avp-launch-kit-notice" role="status" aria-live="polite">{notice}</p>}
  </section>;
}
