import {Component,type ReactNode} from "react";
import {Link,useLocation} from "react-router-dom";

/** Keep the shared navigation available after a route render or lazy-import failure.
 * Never render exception messages: they can contain private request details. */
class RouteBoundary extends Component<{children:ReactNode},{failed:boolean}>{
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  render(){
    if(!this.state.failed)return this.props.children;
    return <section className="state-card av79-route-recovery" role="alert">
      <span className="state-code">CONNECTION INTERRUPTED</span>
      <h1>This page could not open.</h1>
      <p>Reload to request the current page again, or return to discovery.</p>
      <div><button type="button" className="button" onClick={()=>window.location.reload()}>Reload page</button>
        <Link to="/discover" className="button secondary">Explore projects</Link></div>
    </section>;
  }
}
export function RouteRecovery({children}:{children:ReactNode}){
  const location=useLocation();
  return <RouteBoundary key={location.pathname+location.search}>{children}</RouteBoundary>;
}
