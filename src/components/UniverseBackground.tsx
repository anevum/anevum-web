export default function UniverseBackground() {
  return (
    <div className="universe-background" aria-hidden="true">
      <div className="universe-nebula universe-nebula-a" />
      <div className="universe-nebula universe-nebula-b" />
      <div className="universe-galaxy">
        <span className="galaxy-core" />
        <i className="galaxy-ring galaxy-ring-a" />
        <i className="galaxy-ring galaxy-ring-b" />
        <i className="galaxy-ring galaxy-ring-c" />
      </div>
      <div className="universe-stars universe-stars-far" />
      <div className="universe-stars universe-stars-mid" />
      <div className="universe-stars universe-stars-near" />
      <div className="universe-vignette" />
    </div>
  );
}
