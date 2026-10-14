export type OrbitPhase="ready"|"playing"|"paused"|"complete";

export const INITIAL_ORBITS:readonly [number,number,number]=[6,3,5];

export interface OrbitGameState {
  phase:OrbitPhase;
  slots:readonly number[];
  moves:number;
}

export type OrbitAction =
  |{type:"start"}
  |{type:"pause"}
  |{type:"resume"}
  |{type:"reset"}
  |{type:"rotate";ring:number};

export function initialOrbitState():OrbitGameState {
  return {phase:"ready",slots:[...INITIAL_ORBITS],moves:0};
}

export function orbitReducer(state:OrbitGameState,action:OrbitAction):OrbitGameState {
  switch(action.type){
    case "start":return state.phase==="ready"?{...state,phase:"playing"}:state;
    case "pause":return state.phase==="playing"?{...state,phase:"paused"}:state;
    case "resume":return state.phase==="paused"?{...state,phase:"playing"}:state;
    case "reset":return initialOrbitState();
    case "rotate":{
      if(state.phase!=="playing"||!Number.isInteger(action.ring)||action.ring<0||action.ring>=state.slots.length)return state;
      const next=state.slots.map((slot,index)=>index===action.ring?(slot+1)%8:slot);
      return {slots:next,moves:state.moves+1,phase:next.every(slot=>slot===0)?"complete":"playing"};
    }
  }
}
