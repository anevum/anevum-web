import type { ReactNode } from "react";

export default function PageIntro({
  kicker,
  title,
  children,
  aside
}: {
  kicker: string;
  title: string;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <section className="page-intro">
      <div>
        <p className="kicker">{kicker}</p>
        <h1>{title}</h1>
      </div>
      <div className="page-intro-copy">{children}</div>
      {aside && <div className="page-intro-aside">{aside}</div>}
    </section>
  );
}
