import { Link } from "react-router-dom";
import { OrbitalMark } from "../components/OrbitalMark";

const copy:Record<string,[string,string,string]>= {
 community:["COMMUNITY","FIND YOUR PEOPLE.","Project feedback, discussion and collaboration open only after identity and moderation acceptance."],
 create:["CREATE","PUT YOUR WORK IN ORBIT.","Creator drafts and moderation are being validated in staging. Public submission is not open yet."],
 library:["LIBRARY","KEEP WHAT YOU FIND.","Saved projects and follows belong to your private member account. Public account access remains gated."],
 account:["PROFILE","YOUR PLACE IN THE NETWORK.","Profiles, achievements and contribution history are part of V1. Public registration is not open yet."]
};
export function ComingPage({kind}:{kind:string}){
 const [kicker,title,detail]=copy[kind]||copy.community;
 return <section className="coming-page"><OrbitalMark className="coming-mark"/><span className="kicker">{kicker} / V1</span><h1>{title}</h1><p>{detail}</p><div><Link className="button primary" to="/status">SEE BUILD STATUS</Link><Link className="button secondary" to="/discover">EXPLORE PUBLIC WORK</Link></div></section>;
}
