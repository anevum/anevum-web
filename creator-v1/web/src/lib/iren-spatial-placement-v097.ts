/**
 * IREN V097: pure visual-viewport placement for a non-modal guide.
 * Coordinates are CSS pixels in the layout viewport, not device pixels.
 */
export type IrenRect={left:number;top:number;width:number;height:number};
export type IrenSize={width:number;height:number};
export type IrenPlacementOptions={
  headerBottom?:number;
  safeTop?:number;
  safeBottom?:number;
  safeSides?:number;
  obstacles?:readonly IrenRect[];
};
export type IrenPlacement={
  botLeft:number;botTop:number;
  bubbleLeft:number;bubbleTop:number;
  bubbleWidth:number;
  side:"left"|"right";
  compact:boolean;
  targetVisible:boolean;
  score:number;
};
const clamp=(n:number,low:number,high:number)=>Math.max(low,Math.min(n,Math.max(low,high)));
function intersection(a:IrenRect,b:IrenRect){
  return Math.max(0,Math.min(a.left+a.width,b.left+b.width)-Math.max(a.left,b.left))*
    Math.max(0,Math.min(a.top+a.height,b.top+b.height)-Math.max(a.top,b.top));
}
function finiteRect(value:IrenRect|null):value is IrenRect{
  return Boolean(value&&[value.left,value.top,value.width,value.height].every(Number.isFinite)&&value.width>0&&value.height>0);
}
export function placeIrenSpatialGuide(
  viewport:IrenRect,
  anchor:IrenRect|null,
  bubble:IrenSize,
  bot:IrenSize,
  options:IrenPlacementOptions={}
):IrenPlacement{
  const margin=Math.max(10,options.safeSides??12),gap=7,space=14;
  const minX=viewport.left+margin;
  const maxX=viewport.left+viewport.width-margin;
  const minY=Math.max(viewport.top+margin+(options.safeTop??0),options.headerBottom??0);
  const maxY=Math.max(minY+80,viewport.top+viewport.height-margin-(options.safeBottom??0));
  const botWidth=clamp(bot.width,40,90);
  const botHeight=clamp(bot.height,45,105);
  const bubbleWidth=clamp(bubble.width,152,Math.max(152,maxX-minX-botWidth-gap));
  const bubbleHeight=clamp(bubble.height,68,Math.max(68,maxY-minY));
  const groupWidth=botWidth+gap+bubbleWidth;
  const groupHeight=Math.max(botHeight,bubbleHeight);
  const validAnchor=finiteRect(anchor);
  const target=validAnchor?anchor:null;
  const centerX=target?target.left+target.width/2:viewport.left+viewport.width/2;
  const centerY=target?target.top+target.height/2:viewport.top+viewport.height/2;
  // Test nearby, corner and intermediate placements. On a narrow phone there
  // may be no free space immediately next to an anchor, but a short companion
  // bubble can often fit elsewhere without covering Search or primary actions.
  const maxTop=Math.max(minY,maxY-groupHeight);
  const maxLeft=Math.max(minX,maxX-groupWidth);
  const proposals:{x:number;y:number;order:number}[]=[];
  if(target){
    proposals.push(
      {x:centerX-groupWidth/2,y:target.top-groupHeight-space,order:0},
      {x:centerX-groupWidth/2,y:target.top+target.height+space,order:1},
      {x:target.left-groupWidth-space,y:centerY-groupHeight/2,order:2},
      {x:target.left+target.width+space,y:centerY-groupHeight/2,order:3}
    );
  }
  // Scan unoccupied content bands rather than blindly putting the bubble
  // directly below the heading (which commonly covers the mobile Search box).
  const bands=Math.max(1,Math.ceil((maxTop-minY)/24));
  for(let band=0;band<=bands;band++){
    const y=minY+(maxTop-minY)*band/bands;
    proposals.push({x:minX,y,order:4+band});
    if(maxLeft>minX+4)proposals.push({x:maxLeft,y,order:4+band});
    if(maxLeft>minX+28)proposals.push({x:(minX+maxLeft)/2,y,order:4+band});
  }
  let best:{
    bubbleLeft:number;botLeft:number;top:number;score:number;
    side:"left"|"right";overlap:number
  }|null=null;
  for(const proposal of proposals){
    const x=clamp(proposal.x,minX,maxLeft);
    const y=clamp(proposal.y,minY,maxTop);
    const overflow=Math.abs(x-proposal.x)+Math.abs(y-proposal.y);
    for(const side of ["left","right"] as const){
      const botLeft=side==="right"?x:x+bubbleWidth+gap;
      const bubbleLeft=side==="right"?x+botWidth+gap:x;
      const botTop=y+(groupHeight-botHeight)/2;
      const bubbleRect={left:bubbleLeft,top:y,width:bubbleWidth,height:bubbleHeight};
      const botRect={left:botLeft,top:botTop,width:botWidth,height:botHeight};
      const targetOverlap=target?intersection(bubbleRect,target)+intersection(botRect,target):0;
      const obstacleOverlap=(options.obstacles??[]).reduce((sum,item)=>finiteRect(item)?
        sum+intersection(bubbleRect,item)*1.3+intersection(botRect,item):sum,0);
      const distance=target?Math.hypot(botLeft+botWidth/2-centerX,botTop+botHeight/2-centerY):0;
      const score=targetOverlap*45+obstacleOverlap*18+overflow*1.5+
        distance*.045+proposal.order*.2;
      if(!best||score<best.score){
        best={bubbleLeft,botLeft,top:y,score,side,overlap:targetOverlap+obstacleOverlap};
      }
    }
  }
  const chosen=best??{bubbleLeft:minX+botWidth+gap,botLeft:minX,top:minY,
    score:0,side:"right" as const,overlap:0};
  return {
    botLeft:chosen.botLeft,botTop:chosen.top+(groupHeight-botHeight)/2,
    bubbleLeft:chosen.bubbleLeft,bubbleTop:chosen.top,
    bubbleWidth,side:chosen.side,
    compact:chosen.overlap>800,
    targetVisible:Boolean(target),
    score:chosen.score
  };
}
export function isIrenTargetUnobscured(anchor:IrenRect|null,placement:IrenPlacement,bubble:IrenSize,bot:IrenSize){
  if(!finiteRect(anchor))return false;
  const bubbleRect={left:placement.bubbleLeft,top:placement.bubbleTop,width:placement.bubbleWidth,height:bubble.height};
  const botRect={left:placement.botLeft,top:placement.botTop,width:bot.width,height:bot.height};
  return intersection(anchor,bubbleRect)===0&&intersection(anchor,botRect)===0;
}
