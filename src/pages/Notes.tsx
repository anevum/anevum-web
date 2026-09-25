import PageIntro from "../components/PageIntro";

const notes = [
  ["SYSTEMS", "Why ANEVUM cannot be one project", "A permanent home should survive changes in what is currently being built.", "25 SEP 2026"],
  ["MARKETS", "What early trading evidence actually proves", "Execution can work before an edge is statistically established. Those are different claims.", "24 SEP 2026"],
  ["DESIGN", "A website should become quieter as the information gets stronger", "The interface should not need spectacle to make real work feel important.", "25 SEP 2026"],
  ["ARCHIVE", "Preserving obsolete work without letting it run the present", "Archive old directions explicitly instead of deleting them or keeping them mixed into active documentation.", "25 SEP 2026"]
];

export default function Notes() {
  return (
    <>
      <PageIntro kicker="NOTES" title="Working thoughts.">
        <p>
          Notes are not announcements. They are the slower layer of ANEVUM: ideas, explanations,
          research threads, design decisions, and things worth keeping long enough to revisit.
        </p>
      </PageIntro>

      <section className="content-section notes-list">
        {notes.map(([tag, title, summary, date]) => (
          <article className="note-row" key={title}>
            <span>{tag}</span>
            <div><h2>{title}</h2><p>{summary}</p></div>
            <time>{date}</time>
            <b>↗</b>
          </article>
        ))}
      </section>

      <section className="notes-empty">
        <p>The publishing system for full notes is the next layer after the React migration.</p>
      </section>
    </>
  );
}
