import type { SystemName } from "../../lib/system-display";

// These are qualitative activity instruments, never price, forecast or P&L charts.
function IrenCore() {
  return <><ellipse cx="160" cy="82" rx="108" ry="48" className="instrument-grid" /><ellipse cx="160" cy="82" rx="64" ry="66" className="instrument-grid" />
    <path d="M160 12V150M52 82H268" className="instrument-trace" /><rect x="150" y="38" width="20" height="88" rx="10" className="instrument-core" />
    {[60,112,208,260].map((x, i) => <circle key={x} cx={x} cy={i % 2 ? 46 : 118} r="4" className="instrument-node work-beat" style={{ animationDelay: i * .4 + "s" }} />)}
    <path d="M52 82C72 18 248 18 268 82S72 146 52 82" className="instrument-signal" /></>;
}
function RhenEngine() {
  return <>{[42,82,122].map(y => <g key={y}><path d={"M18 " + y + "H302"} className="instrument-grid" /><path d={"M18 " + y + "H102l14 -12 16 24 16 -12H302"} className="instrument-trace" /></g>)}
    <path d="M18 82H102l14 -12 16 24 16 -12H302" className="instrument-signal" /><rect x="232" y="24" width="3" height="116" rx="1.5" className="instrument-core work-scan" />
    {[26,70,190,286].map(x => <circle key={x} cx={x} cy="82" r="3" className="instrument-node" />)}</>;
}
function GraenLattice() {
  const nodes = [[62,82],[111,38],[111,126],[160,82],[209,38],[209,126],[258,82]];
  return <><path d="M62 82L111 38 160 82 111 126ZM160 82L209 38 258 82 209 126ZM111 38H209M111 126H209M62 82H258" className="instrument-grid" />
    <path d="M62 82L111 38 160 82 209 126 258 82" className="instrument-trace" />
    <path d="M62 82L111 38 160 82 209 126 258 82" className="instrument-signal" />
    {nodes.map(([x,y], i) => <circle key={i} cx={x} cy={y} r={i===3 ? 7 : 4} className="instrument-node work-beat" style={{animationDelay: i * .3 + "s"}} />)}</>;
}
function NostraFutures() {
  return <><path d="M30 82H122M122 82Q200 74 290 20M122 82Q200 78 290 54M122 82H290M122 82Q200 86 290 110M122 82Q200 90 290 144" className="instrument-grid" />
    <path d="M122 82Q200 74 290 20V144Q200 90 122 82Z" className="instrument-band" />
    <path d="M30 82H122Q200 78 290 54M122 82Q200 86 290 110" className="instrument-trace" />
    <path d="M30 82H122Q200 78 290 54" className="instrument-signal" />
    <circle cx="122" cy="82" r="7" className="instrument-node work-beat" />
    {[20,54,82,110,144].map(y => <circle key={y} cx="290" cy={y} r="3" className="instrument-node" />)}</>;
}
function VelumReplay() {
  return <><path d="M22 130H298M55 122V138M125 122V138M195 122V138M265 122V138" className="instrument-grid" />
    <path d="M22 98C74 10 102 142 155 65S225 130 298 38" className="instrument-grid replay-ghost" />
    <path d="M22 104C74 24 102 128 155 72S225 116 298 52" className="instrument-trace" />
    <path d="M22 104C74 24 102 128 155 72S225 116 298 52" className="instrument-signal" />
    <path d="M160 24V142" className="instrument-core work-scan" />
    <circle cx="160" cy="68" r="5" className="instrument-node" /></>;
}
const INSTRUMENTS = { IREN: IrenCore, RHEN: RhenEngine, GRAEN: GraenLattice, NOSTRA: NostraFutures, VELUM: VelumReplay };
export default function SystemInstrument({ name }: { name: SystemName }) {
  const Instrument = INSTRUMENTS[name];
  return <svg className="system-instrument" viewBox="0 0 320 164" aria-hidden="true"><Instrument /></svg>;
}
