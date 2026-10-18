/**
 * Porchlight pilot safety contract. Preview data ONLY.
 * This module deliberately has no network or storage integrations.
 */
export const EVENT_END = "2026-10-31T23:00:00.000Z"; // 7 PM EDT, Oct 31
export const OFFICIAL_EVENT = Object.freeze({
  name: "St. Cloud Trunk or Treat",
  date: "Saturday, October 31, 2026",
  hours: "5:00–7:00 PM ET",
  venue: "Centennial Park, 1214 10th Street",
  url: "https://www.stcloudfl.gov/Calendar.aspx?EID=5614",
  source: "City of St. Cloud",
  affiliated: false
});
export const SERVICES = Object.freeze([
  {
    id: "city",
    name: "City of St. Cloud",
    description: "City-address collection schedules. Verify your actual city service boundary and route before setting a reminder.",
    url: "https://www.stcloudfl.gov/907/Public-Works",
    provider: "City Solid Waste Division"
  },
  {
    id: "county",
    name: "Unincorporated Osceola County",
    description: "County collection schedules, service requests and curbside guidance. The county route is not interchangeable with City of St. Cloud service.",
    url: "https://www.osceola.org/My-Property/Waste-and-Recycling/Curbside-Collection-Services",
    provider: "Osceola County / Waste Management"
  }
]);
export const SAMPLE_HOMES = Object.freeze([
  {id:"S01",label:"Amber Lantern",x:2.0,z:1.3,roof:"#a45a69",amenities:["Treats","Decorations"],hours:"5–7 PM",status:"approved",adultAttested:true,consentToPublish:true,verifiedByOrganizer:true,synthetic:true,privateNote:"NEVER A REAL ADDRESS"},
  {id:"S02",label:"Blue Comet",x:6.8,z:1.6,roof:"#426891",amenities:["Non-food treats"],hours:"5–7 PM",status:"approved",adultAttested:true,consentToPublish:true,verifiedByOrganizer:true,synthetic:true,privateNote:"NEVER A REAL ADDRESS"},
  {id:"S03",label:"Nebula House",x:10.9,z:2.1,roof:"#735a9b",amenities:["Decorations"],hours:"5–6 PM",status:"approved",adultAttested:true,consentToPublish:true,verifiedByOrganizer:true,synthetic:true,privateNote:"NEVER A REAL ADDRESS"},
  {id:"S04",label:"Pending House",x:3.1,z:7.8,roof:"#69856c",amenities:["Treats"],hours:"5–7 PM",status:"pending",adultAttested:true,consentToPublish:true,verifiedByOrganizer:false,synthetic:true,privateNote:"NEVER A REAL ADDRESS"},
  {id:"S05",label:"Private House",x:8.9,z:8.3,roof:"#87746a",amenities:["Decorations"],hours:"5–7 PM",status:"approved",adultAttested:true,consentToPublish:false,verifiedByOrganizer:true,synthetic:true,privateNote:"NEVER A REAL ADDRESS"},
  {id:"S06",label:"Starlit Porch",x:12.7,z:7.5,roof:"#995f52",amenities:["Treats"],hours:"5–7 PM",status:"approved",adultAttested:true,consentToPublish:true,verifiedByOrganizer:true,synthetic:true,privateNote:"NEVER A REAL ADDRESS"}
]);
export function isEligible(host, at = Date.now()) {
  const now = typeof at === "number" ? at : new Date(at).getTime();
  return Boolean(host && host.synthetic === true && host.status === "approved" &&
    host.adultAttested === true && host.consentToPublish === true &&
    host.verifiedByOrganizer === true && Number.isFinite(now) &&
    now < Date.parse(EVENT_END));
}
export function publicHost(host, at = Date.now()) {
  if (!isEligible(host, at)) return null;
  // Deliberate allowlist: no private note, residence, identity or child fields.
  const safeAmenities = ["Treats", "Non-food treats", "Decorations"];
  return {
    id: String(host.id),
    label: String(host.label).slice(0, 50),
    x: Number(host.x),
    z: Number(host.z),
    roof: String(host.roof),
    amenities: (Array.isArray(host.amenities) ? host.amenities : []).filter(v => safeAmenities.includes(v)),
    hours: String(host.hours).slice(0, 30),
    synthetic: true
  };
}
export function publicDirectory(hosts, at = Date.now()) {
  return hosts.map(h => publicHost(h, at)).filter(Boolean);
}
