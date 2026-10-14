// Included solely in signed Cloudflare Access owner Studio, never public pages.
export const POSTS_PANEL=String.raw`<section id="communityPostModeration" class="panel" aria-labelledby="discussionModerationTitle">
 <span class="kicker">MODERATION / COMMUNITY DISCUSSIONS</span>
 <h2 id="discussionModerationTitle">Discussion submissions</h2>
 <p class="muted">Creator posts stay private until reviewed by signed staff. Approval requires an editorial reason; hiding immediately removes an existing post from public queries.</p>
 <button type="button" id="refreshCommunityPosts" class="secondary">Refresh pending posts</button>
 <div id="communityPostQueue" aria-live="polite">Awaiting first review…</div>
</section>`;
export const POSTS_STYLE=String.raw`
#communityPostModeration{margin-top:22px}
#communityPostModeration .community-post-review{padding:16px 0;border-bottom:1px solid var(--border)}
#communityPostModeration .community-post-review:last-child{border-bottom:0}
#communityPostModeration .community-post-review strong{display:block;font-size:17px;overflow-wrap:anywhere}
#communityPostModeration .community-post-review span{font-size:12px;color:var(--muted)}
#communityPostModeration .community-post-review p{white-space:pre-wrap;overflow-wrap:anywhere;max-height:165px;overflow:auto}
#communityPostModeration .community-post-review button{margin:5px 9px 5px 0;font-size:12px}
`;
export const POSTS_APP=String.raw`
(function(){
 const root=document.getElementById('communityPostQueue');
 const refresh=document.getElementById('refreshCommunityPosts');
 async function request(path,options={}){
   const response=await fetch(path,{credentials:'same-origin',headers:{'Content-Type':'application/json'},...options});
   const body=await response.json();
   if(!response.ok)throw Error(body.error||'Review service unavailable');
   return body;
 }
 async function review(post,action){
   const reason=prompt('Record a moderation reason for '+action+' (12–800 characters):');
   if(!reason||reason.trim().length<12||reason.length>800)return;
   try{
     await request('/api/community-posts/'+post.id+'/'+action,{
       method:'POST',body:JSON.stringify({reason:reason.trim(),revision:post.revision})
     });
     await load();
   }catch(error){alert(error.message);}
 }
 async function load(){
   root.replaceChildren();
   try{
     const data=await request('/api/community-posts?status=pending_review');
     if(!data.items.length){root.textContent='No pending community discussions.';return;}
     for(const post of data.items){
       const row=document.createElement('article');row.className='community-post-review';
       const title=document.createElement('strong');title.textContent=post.title;
       const info=document.createElement('span');info.textContent='@'+post.authorHandle+' · '+post.topic.toUpperCase()+' · revision '+post.revision;
       const content=document.createElement('p');content.textContent=post.body;
       row.append(title,info,content);
       if(post.linkedProjectId){
         const context=document.createElement('p');
         context.textContent=post.contextAvailable&&post.project?'About published project: '+post.project.title+' / @'+post.project.creatorHandle:'Linked project unavailable. Publication is blocked; reject or wait for the project to become public again.';
         row.append(context);
       }
       for(const [action,label] of [['publish','Approve and publish'],['reject','Reject submission']]){
         const button=document.createElement('button');button.type='button';
         button.disabled=action==='publish'&&post.contextAvailable===false;
         button.textContent=label;button.onclick=()=>review(post,action);row.append(button);
       }
       root.append(row);
     }
   }catch(error){root.textContent='Unable to read moderation queue: '+error.message;}
 }
 refresh.addEventListener('click',load);
 load();
})();`;
