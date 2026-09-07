export type PublicObject = {
  id: string;
  title: string;
  type: string;
  route: string;
  summary: string;
};

export const publicObjects: PublicObject[] = [
  {
    id: "transmission.enter-anevum-transcosmic",
    title: "ENTER ANEVUM // TRANSCOSMIC",
    type: "TRANSMISSION",
    route: "/transmissions/enter-anevum-transcosmic",
    summary: "The present comes first. The history is still there.",
  },
  {
    id: "story.transcosmic-present",
    title: "THE TRANSCOSMIC PRESENT",
    type: "STORY",
    route: "/stories/transcosmic",
    summary: "Human civilization already spans connected worlds. The story begins after the impossible became infrastructure.",
  },
  {
    id: "place.serein-skygate",
    title: "SEREIN SKYGATE",
    type: "PLACE",
    route: "/explore/serein-skygate",
    summary: "An inhabited orbital city wrapped around one of civilization's most important pieces of public infrastructure.",
  },
  {
    id: "person.talin-vel",
    title: "TALIN VEL",
    type: "PERSON",
    route: "/archive/people/talin-vel",
    summary: "Boundary systems specialist. Gateborn. Very good at fixing systems she understands.",
  },
  {
    id: "science.roads-skygates",
    title: "ROADS & SKYGATES",
    type: "SCIENCE",
    route: "/archive/science/roads-skygates",
    summary: "The connection looks simple. Keeping both worlds certain they opened the same door is not.",
  },
  {
    id: "transmission.lattice-iren-ordinary-life",
    title: "LATTICE / IREN // ORDINARY LIFE",
    type: "IN-UNIVERSE RECORD",
    route: "/transmissions/lattice-iren-ordinary-life",
    summary: "The mature network remembers, translates and assists. It does not get the final vote.",
  },
];
