import { modules } from "../../data/products";

export default function ModuleGrid() {
  return (
    <div className="module-grid">
      {modules.map((module) => (
        <article key={module.name} className="module-card">
          <header><span>{module.category}</span><b>{module.status}</b></header>
          <h3>{module.name}</h3>
          <p>{module.purpose}</p>
          <footer><span>OWNER</span><strong>{module.owner}</strong></footer>
        </article>
      ))}
    </div>
  );
}
