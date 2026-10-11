import {Link} from "react-router-dom";
import {rhenLessons,rhenLessonBySlug,type RhenLesson} from "../data/rhen-learning";

/** Public, static and free. No member, broker, payment or market-data request. */
function LessonCard({lesson}:{lesson:RhenLesson}) {
  return <article className="c2-card rh-learn-card">
    <p className="c2-kicker">LESSON {String(lesson.number).padStart(2,"0")} · FREE</p>
    <h2><Link to={"/products/rhen/learn/"+lesson.slug}>{lesson.title}</Link></h2>
    <p>{lesson.summary}</p>
    <p className="rh-learn-meta">Reading time: about {lesson.estimatedMinutes} minutes · Reviewed <time dateTime={lesson.reviewedOn}>{lesson.reviewedOn}</time></p>
    <Link className="c2-text-link" to={"/products/rhen/learn/"+lesson.slug}>Read full lesson →</Link>
  </article>;
}

export function RhenLessonCards() {
  return <div className="c2-grid rh-learn-grid" data-lesson-cards="2">
    {rhenLessons.map(lesson=><LessonCard key={lesson.slug} lesson={lesson}/>)}
  </div>;
}

function LessonIndex() {
  return <div className="c2-page rh-learn" data-rhen-learning="index">
    <nav className="rh-learn-crumb" aria-label="Breadcrumb">
      <Link to="/learn">Learning</Link><span aria-hidden="true">/</span>
      <Link to="/products/rhen">RHEN</Link><span aria-hidden="true">/</span><span aria-current="page">Lessons</span>
    </nav>
    <header className="c2-intro">
      <p className="c2-kicker">RHEN OPEN / LEARNING</p>
      <h1>Understand the market. Test the evidence.</h1>
      <p>Two complete, practical lessons to read on any device. No registration, subscription, funded brokerage account or trade is required.</p>
    </header>
    <div className="c2-truth"><strong>Educational, not operational.</strong> Examples use invented numbers and are not investment recommendations, demonstrated returns or evidence that RHEN is trading. Member brokerage connections and execution remain separately gated.</div>
    <RhenLessonCards/>
    <section className="c2-section" aria-labelledby="rh-learning-method">
      <h2 id="rh-learning-method">How to use this material</h2>
      <p>Read lesson 1 before lesson 2. Work each example on paper, then reveal the self-check answers. The references are external primary sources; the explanations, examples and summaries are written for this curriculum. Corrections are versioned in the website source.</p>
      <div className="c2-action-row"><Link to="/field-notes">Published Field Notes</Link><Link to="/help">Suggest a correction</Link></div>
    </section>
  </div>;
}

function LessonDetail({lesson}:{lesson:RhenLesson}) {
  const next=rhenLessons.find(item=>item.number===lesson.number+1);
  return <article className="c2-page rh-learn rh-lesson" data-rhen-learning="lesson" data-lesson-slug={lesson.slug}>
    <nav className="rh-learn-crumb" aria-label="Breadcrumb">
      <Link to="/learn">Learning</Link><span aria-hidden="true">/</span>
      <Link to="/products/rhen/learn">RHEN lessons</Link><span aria-hidden="true">/</span><span aria-current="page">Lesson {lesson.number}</span>
    </nav>
    <header className="c2-intro rh-lesson-intro">
      <p className="c2-kicker">RHEN OPEN · LESSON {String(lesson.number).padStart(2,"0")}</p>
      <h1>{lesson.title}</h1><p>{lesson.summary}</p>
      <div className="rh-learn-meta">Version {lesson.version} · Reviewed <time dateTime={lesson.reviewedOn}>{lesson.reviewedOn}</time> · About {lesson.estimatedMinutes} minutes</div>
    </header>
    <div className="c2-truth"><strong>Free public education.</strong> No account or money is needed. Prices and trade examples are synthetic. This material does not activate orders, guarantee a result or replace individual financial advice.</div>
    <section className="c2-section" aria-labelledby="rh-lesson-outcomes">
      <h2 id="rh-lesson-outcomes">What you will learn</h2>
      <ul className="rh-learn-list">{lesson.outcomes.map(item=><li key={item}>{item}</li>)}</ul>
    </section>
    {lesson.sections.map((section,index)=><section key={section.heading} className="rh-lesson-section" aria-labelledby={"rh-section-"+index}>
      <span className="rh-learn-index">{String(index+1).padStart(2,"0")}</span>
      <h2 id={"rh-section-"+index}>{section.heading}</h2>
      {section.paragraphs.map((paragraph,j)=><p key={j}>{paragraph}</p>)}
      {section.points&&<ul className="rh-learn-list">{section.points.map(item=><li key={item}>{item}</li>)}</ul>}
      {section.example&&<aside className="rh-learn-example" aria-label={section.example.title}>
        <h3>{section.example.title}</h3>
        <ol>{section.example.steps.map((step,j)=><li key={j}>{step}</li>)}</ol>
        <p><strong>Result:</strong> {section.example.conclusion}</p>
      </aside>}
    </section>)}
    <section className="c2-section" aria-labelledby="rh-lesson-glossary">
      <h2 id="rh-lesson-glossary">Glossary</h2>
      <dl className="rh-learn-glossary">{lesson.glossary.map(entry=><div key={entry.term}>
        <dt>{entry.term}</dt><dd>{entry.definition}</dd></div>)}</dl>
    </section>
    <section className="c2-section" aria-labelledby="rh-lesson-check">
      <h2 id="rh-lesson-check">Check your understanding</h2>
      <p>Try answering before opening the explanation. This self-check runs entirely on the page; it does not send answers to ANEVUM or mark your account complete.</p>
      <div className="rh-learn-check">{lesson.check.map((item,index)=><details key={item.question}>
        <summary><span>{index+1}.</span> {item.question}</summary>
        <div><strong>Answer: {item.answer}</strong><p>{item.explanation}</p></div>
      </details>)}</div>
    </section>
    <section className="c2-section" aria-labelledby="rh-lesson-sources">
      <h2 id="rh-lesson-sources">Sources and review</h2>
      <p>These primary references support the factual explanations. Worked numbers, worksheets and questions are educational examples, not actual trading records. Last editorial review: <time dateTime={lesson.reviewedOn}>{lesson.reviewedOn}</time>.</p>
      <ul className="rh-learn-sources">{lesson.sources.map(source=><li key={source.url}>
        <a href={source.url} target="_blank" rel="noopener noreferrer">{source.name} ↗</a><span>{source.context}</span>
      </li>)}</ul>
    </section>
    <footer className="rh-learn-footer">
      {next?<Link className="rh-learn-next" to={"/products/rhen/learn/"+next.slug}>Continue: {next.title} →</Link>:
       <Link className="rh-learn-next" to="/products/rhen/learn">Return to the learning index →</Link>}
      <Link to="/field-notes">Read published research records</Link><Link to="/help">Report an error</Link>
    </footer>
  </article>;
}

export default function RhenLearning({slug}:{slug?:string}) {
  if(slug===undefined)return <LessonIndex/>;
  const lesson=rhenLessonBySlug(slug);
  if(!lesson)return <div className="c2-page rh-learn" data-rhen-learning="missing">
    <nav className="rh-learn-crumb" aria-label="Breadcrumb"><Link to="/products/rhen/learn">RHEN lessons</Link></nav>
    <h1>Lesson not found</h1>
    <p>There is no reviewed RHEN lesson at this address. The published lessons are available to everyone.</p>
    <Link className="c2-text-link" to="/products/rhen/learn">Browse actual lessons →</Link>
  </div>;
  return <LessonDetail lesson={lesson}/>;
}
