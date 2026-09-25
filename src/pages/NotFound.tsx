import { Link } from "react-router-dom";
import Mark from "../components/Mark";

export default function NotFound() {
  return (
    <section className="not-found">
      <Mark />
      <p className="kicker">404 / NO RECORD</p>
      <h1>Nothing here.</h1>
      <p>This route is not part of the current ANEVUM map.</p>
      <Link className="primary-link" to="/">Return home <span>↗</span></Link>
    </section>
  );
}
