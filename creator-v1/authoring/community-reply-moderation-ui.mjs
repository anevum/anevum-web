// Owner-only Cloudflare Access Studio UI: vetted reply approval / hiding only.
// User-generated text is written with textContent; never executable HTML.
export const REPLIES_PANEL=String.raw`<section id="communityReplyModeration" class="panel" aria-labelledby="communityReplyTitle">
 <span class="kicker">MODERATION / REPLIES</span>
 <h2 id="communityReplyTitle">Review community replies</h2>
 <p class="muted">Reply submissions are private until approved. Every decision requires a reason and is recorded separately from XP and voting.</p>
 <div class="community-reply-toolbar"><button id="pendingCommunityReplies" type="button" class="secondary">Pending replies</button>
 <button id="publishedCommunityReplies" type="button" class="secondary">Published replies</button></div>
 <div id="communityReplyQueue" aria-live="polite">Checking pending replies…</div>
</section>`;
export const REPLIES_STYLE=String.raw`
#communityReplyModeration{margin-top:24px}
#communityReplyModeration .community-reply-toolbar{display:flex;flex-wrap:wrap;gap:9px;margin:12px 0 16px}
#communityReplyModeration .community-reply{padding:15px 0;border-bottom:1px solid var(--border)}
#communityReplyModeration .community-reply strong{display:block;overflow-wrap:anywhere}
#communityReplyModeration .community-reply small{display:block;margin:5px 0;color:var(--muted)}
#communityReplyModeration .community-reply p{white-space:pre-wrap;overflow-wrap:anywhere;max-height:185px;overflow:auto}
#communityReplyModeration .community-reply button{margin:6px 9px 0 0;font-size:12px}
`;
export const REPLIES_APP=String.raw`
(function(){
 const root=document.getElementById('communityReplyQueue');
 const pending=document.getElementById('pendingCommunityReplies');
 const published=document.getElementById('publishedCommunityReplies');
 let current='pending_review';
 async function read(path,options={}){
   const response=await fetch(path,{credentials:'same-origin',headers:{'Content-Type':'application/json'},...options});
   const data=await response.json();
   if(!response.ok)throw Error(data.error||'Reply moderation service unavailable');
   return data;
 }
 async function decision(reply,action){
   const reason=prompt('Reason for '+action+' reply (minimum 12 characters):');
   if(!reason||reason.trim().length<12||reason.length>800)return;
   try{
     await read('/api/community-post-replies/'+reply.id+'/'+action,{
       method:'POST',body:JSON.stringify({revision:reply.revision,reason:reason.trim()})
     });
     await refresh();
   }catch(error){alert(error.message);}
 }
 async function refresh(){
   root.replaceChildren();
   try{
     const data=await read('/api/community-post-replies?status='+encodeURIComponent(current));
     if(!data.items.length){root.textContent=current==='published'?'No published replies in the recent review window.':'No pending replies.';return;}
     for(const reply of data.items){
       const card=document.createElement('article');card.className='community-reply';
       const title=document.createElement('strong');title.textContent='RE: '+reply.postTitle;
       const author=document.createElement('small');author.textContent='@'+reply.authorHandle+' · parent '+reply.postStatus+' · revision '+reply.revision;
       const text=document.createElement('p');text.textContent=reply.body;
       card.append(title,author,text);
       const actions=current==='published'?[['hide','Hide published reply']]:[['publish','Approve reply'],['reject','Reject reply']];
       for(const [action,label] of actions){
         const button=document.createElement('button');button.type='button';button.textContent=label;
         if(action==='publish'&&reply.postStatus!=='published')button.disabled=true;
         button.onclick=()=>decision(reply,action);card.append(button);
       }
       root.append(card);
     }
   }catch(error){root.textContent='Could not load reply queue: '+error.message;}
 }
 pending.addEventListener('click',()=>{current='pending_review';void refresh()});
 published.addEventListener('click',()=>{current='published';void refresh()});
 void refresh();
})();`;
