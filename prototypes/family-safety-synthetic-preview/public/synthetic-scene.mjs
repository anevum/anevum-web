/**
 * ANEVUM Family Field — purely fictional, procedurally generated 3D test city.
 *
 * Streets, houses, parks, illuminated nodes, creek, relief shapes and building
 * heights are invented illustrative geometry; NOT real parcels/navigation data.
 * All features are deterministic and local; no external geolocation lookups.
 *
 * The approximate city center is only a camera reference, not a home/location.
 */
import {DEFAULT_CENTER} from "./synthetic-engine.mjs";
const [CX,CY]=DEFAULT_CENTER;
const result=(features=[])=>({type:"FeatureCollection",features});
const polygon=(points,properties)=>({type:"Feature",properties,geometry:{type:"Polygon",coordinates:[points]}});
const line=(points,properties)=>({type:"Feature",properties,geometry:{type:"LineString",coordinates:points}});
const point=(coord,properties)=>({type:"Feature",properties,geometry:{type:"Point",coordinates:coord}});
const rect=(lon,lat,w,h)=>[[lon-w/2,lat-h/2],[lon+w/2,lat-h/2],[lon+w/2,lat+h/2],[lon-w/2,lat+h/2],[lon-w/2,lat-h/2]];
const metric=(s)=>s-Math.floor(s);
const random=(i,j,k=0)=>metric(Math.sin((i+19)*127.1+(j+7)*311.7+(k+2)*97.37)*43758.5453);
const X=.00192, Y=.00146;
const ROAD_W=.00021;
function parcelCenter(i,j){return [CX+i*X,CY+j*Y];}

export function createIllustrativeNeighborhood(){
  const features=[];
  // A transparent-looking distant continuation for a softer spatial horizon.
  features.push(polygon(rect(CX,CY,.061,.043),{kind:"district",title:"Fictional simulation district"}));
  // Parkland, water and shadows are stylized, not actual protected lands.
  const parks=[
    [-4,2,1.6,.9],[-1,-3,1.2,1.1],[2,2,1.2,1.1],[4,-2,1.1,.9],
    [-6,-2,1.3,.75],[0,4,1.5,.65]
  ];
  for(let q=0;q<parks.length;q++){
    const [i,j,sx,sy]=parks[q],c=parcelCenter(i,j);
    features.push(polygon(rect(c[0],c[1],X*sx,Y*sy),{kind:"park",title:"Invented landscaped area"}));
  }
  // Fictional greenway and water channel, wrapped around blocks.
  const creek=[];
  for(let k=-13;k<=13;k++){
    const latitude=CY+k*.0017;
    creek.push([CX+.0108+.00035*Math.sin(k*.8),latitude]);
  }
  features.push(line(creek,{kind:"creek",title:"Invented creek"}));
  // Evenly spaced street grid, with two boulevards and a diagonal avenue.
  for(let i=-15;i<=15;i++){
    const lon=CX+i*X;
    const major=i===0||Math.abs(i)===5||Math.abs(i)===10;
    features.push(line([[lon,CY-.024],[lon,CY+.024]],{
      kind:"road",rank:major?"arterial":"residential",title:"Fictional street"
    }));
  }
  for(let j=-12;j<=12;j++){
    const lat=CY+j*Y;
    const major=j===0||Math.abs(j)===5||Math.abs(j)===10;
    features.push(line([[CX-.036,lat],[CX+.036,lat]],{
      kind:"road",rank:major?"arterial":"residential",title:"Fictional street"
    }));
  }
  features.push(line([[CX-.025,CY-.014],[CX+.026,CY+.017]],{kind:"road",rank:"arterial",title:"Invented diagonal boulevard"}));

  // Street block infill with perimeter buildings. No actual residences.
  for(let i=-12;i<=12;i++){
    for(let j=-10;j<=10;j++){
      const c=[CX+(i+.5)*X,CY+(j+.5)*Y];
      const dx=X*(.78+.03*random(i,j,7));
      const dy=Y*(.77+.04*random(j,i,8));
      const park=parks.some(([pi,pj,sx,sy]) =>
        Math.abs((i+.5)-pi)<sx*.66&&Math.abs((j+.5)-pj)<sy*.72
      );
      const nearWater=Math.abs(c[0]-(CX+.0108))<.0009;
      if(park||nearWater)continue;
      if(random(i,j,1)>.955) {
        // A plaza opens up occasionally rather than filling every block.
        features.push(polygon(rect(c[0],c[1],dx,dy),{kind:"plaza",title:"Invented civic plaza"}));
        continue;
      }
      features.push(polygon(rect(c[0],c[1],dx,dy),{kind:"parcel",title:"Illustrative street block"}));
      const central=Math.abs(i)<3&&Math.abs(j)<3;
      const boulevard=Math.abs(i)<1||Math.abs(j)<1;
      const count=central?2:(random(i,j,2)>.83?2:4);
      const padX=dx*.37;
      const padY=dy*.34;
      const centers=count===2?
        [[-padX*.63,-padY*.18],[padX*.63,padY*.18]]:
        [[-padX*.66,-padY*.53],[padX*.66,-padY*.53],
         [-padX*.66,padY*.53],[padX*.66,padY*.53]];
      for(let b=0;b<centers.length;b++){
        const [ox,oy]=centers[b];
        const chance=random(i,j,b+11);
        if(chance>.92)continue;
        const wide=central?(dx*.38):(dx*.31+.00004*chance);
        const deep=central?(dy*.41):(dy*.30+.00003*random(j,i,b+20));
        let h=7+13*random(i,j,b+4);
        if(central)h=21+42*random(j,i,b+6);
        else if(boulevard && random(i,j,b+8)>.70)h=18+18*random(j,i,b);
        const levels=Math.max(1,Math.round(h/3.2));
        features.push(polygon(rect(c[0]+ox,c[1]+oy,wide,deep),{
          kind:"building",height:Math.round(h),levels,
          material:central?"tower":chance>.68?"coral":"stone",
          title:"Fictional "+(central?"civic building":"residence")
        }));
      }
    }
  }
  // Decorative wayfinding lamps for a subtle neon institute atmosphere.
  for(let i=-10;i<=10;i+=2){
    for(let j=-8;j<=8;j+=2){
      if(random(i,j,40)>.55)continue;
      const c=parcelCenter(i,j);
      features.push(point([c[0]+.00022,c[1]+.00014],{kind:"beacon",title:"Illustrative illumination"}));
    }
  }
  return result(features);
}

export const SYNTHETIC_STYLE={
  version:8,
  name:"Family Field — fictional relief",
  glyphs:"https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
  sources:{
    "field-fabric":{type:"geojson",data:createIllustrativeNeighborhood()}
  },
  layers:[
    {id:"field-background",type:"background",paint:{"background-color":"#071524"}},
    {id:"field-district",type:"fill",source:"field-fabric",filter:["==",["get","kind"],"district"],
      paint:{"fill-color":"#0e2437","fill-opacity":.96}},
    {id:"field-park-glow",type:"fill",source:"field-fabric",filter:["==",["get","kind"],"park"],
      paint:{"fill-color":"#2c6159","fill-opacity":.70}},
    {id:"field-park-edge",type:"line",source:"field-fabric",filter:["==",["get","kind"],"park"],
      paint:{"line-color":"#73d1b4","line-opacity":.25,"line-width":2}},
    {id:"field-parcels",type:"fill",source:"field-fabric",filter:["==",["get","kind"],"parcel"],
      paint:{"fill-color":"#182d40","fill-outline-color":"#354e6588","fill-opacity":.72}},
    {id:"field-plazas",type:"fill",source:"field-fabric",filter:["==",["get","kind"],"plaza"],
      paint:{"fill-color":"#36425b","fill-opacity":.7}},
    {id:"field-creek-halo",type:"line",source:"field-fabric",filter:["==",["get","kind"],"creek"],
      paint:{"line-color":"#6adce9","line-width":27,"line-blur":6,"line-opacity":.25}},
    {id:"field-creek",type:"line",source:"field-fabric",filter:["==",["get","kind"],"creek"],
      paint:{"line-color":"#285574","line-width":17,"line-opacity":.96}},
    {id:"field-road-shoulder",type:"line",source:"field-fabric",
      filter:["all",["==",["get","kind"],"road"]],
      paint:{"line-color":"#496a80","line-width":["match",["get","rank"],"arterial",22,12],"line-opacity":.70}},
    {id:"field-road-surface",type:"line",source:"field-fabric",
      filter:["==",["get","kind"],"road"],
      paint:{"line-color":["match",["get","rank"],"arterial","#243e53","#1b3448"],
        "line-width":["match",["get","rank"],"arterial",17,9],"line-opacity":1}},
    {id:"field-road-midline",type:"line",source:"field-fabric",
      filter:["all",["==",["get","kind"],"road"],["==",["get","rank"],"arterial"]],
      paint:{"line-color":"#91d6e5","line-width":1.1,"line-opacity":.20,"line-dasharray":[3,7]}},
    {id:"field-building-shadows",type:"fill",source:"field-fabric",
      filter:["==",["get","kind"],"building"],
      paint:{"fill-color":"#07182b","fill-opacity":.95}},
    {id:"field-building-volumes",type:"fill-extrusion",source:"field-fabric",
      filter:["==",["get","kind"],"building"],minzoom:10,
      paint:{
        "fill-extrusion-color":["match",["get","material"],"tower","#8388b8","coral","#c2839d","#728aa3"],
        "fill-extrusion-height":["interpolate",["linear"],["zoom"],11,0,14,["get","height"]],
        "fill-extrusion-base":0,"fill-extrusion-opacity":.95
      },layout:{visibility:"visible"}},
    {id:"field-neighborhood-beacons",type:"circle",source:"field-fabric",
      filter:["==",["get","kind"],"beacon"],minzoom:12,
      paint:{"circle-color":"#e2b3fa","circle-radius":2.5,"circle-opacity":.74,
        "circle-blur":.4,"circle-stroke-color":"#8468ca","circle-stroke-width":1}},
  ]
};

export const SYNTHETIC_LAYER_IDS=Object.freeze(
  SYNTHETIC_STYLE.layers.filter(l=>l.id.includes("building")).map(l=>l.id)
);
