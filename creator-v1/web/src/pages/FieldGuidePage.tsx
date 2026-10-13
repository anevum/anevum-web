import { useState } from "react";
import { Link } from "react-router-dom";
import { chapters, gradeChoice, guideProgress } from "../lib/field-guide";
import { Icon } from "../components/Icons";
import { OrbitalMark } from "../components/OrbitalMark";
import { PortalHeading } from "../components/PortalHeading";

export function FieldGuidePage() {
  const [active, setActive] = useState(chapters[0].id);
  const [steps, setSteps] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<number | null>(null);
  const [completed, setCompleted] = useState<string[]>([]);
  const chapter = chapters.find(item => item.id === active) ?? chapters[0];
  const currentIndex = Math.min(steps[chapter.id] ?? 0, chapter.exercises.length - 1);
  const exercise = chapter.exercises[currentIndex];
  const finished = completed.includes(chapter.id);
  const result = !finished && selected !== null ? gradeChoice(chapter.id, currentIndex, selected) : null;
  const progress = guideProgress(completed, steps);
  const nextChapter = chapters.find((item, index) => index > chapters.findIndex(entry => entry.id === chapter.id) && !completed.includes(item.id));

  function selectChapter(id: string) {
    setActive(id);
    setSelected(null);
  }
  function chooseAnswer(index: number) {
    if (finished || result?.correct) return;
    setSelected(index);
  }
  function advance() {
    if (!result?.correct) return;
    if (currentIndex + 1 === chapter.exercises.length) {
      setCompleted(previous => previous.includes(chapter.id) ? previous : [...previous, chapter.id]);
    } else {
      setSteps(previous => ({ ...previous, [chapter.id]: currentIndex + 1 }));
    }
    setSelected(null);
  }
  function replayChapter() {
    setSteps(previous => ({ ...previous, [chapter.id]: 0 }));
    setCompleted(previous => previous.filter(id => id !== chapter.id));
    setSelected(null);
  }
  function resetVisit() {
    setActive(chapters[0].id);
    setSteps({});
    setCompleted([]);
    setSelected(null);
  }

  return <div className="field-guide-page">
    <PortalHeading
      eyebrow="ANEVUM / FREE FIELD GUIDE"
      title="LEARN THE"
      accent="UNDERGROUND."
      description="A hands-on introduction to discovering original work, navigating external apps, giving useful feedback and respecting creators. No account or submitted project required."
      index="GUIDE / 004"
      action={{ to: "/start", label: "BACK TO START HERE" }}
    />
    <div className="guide-ribbon">
      <span><Icon name="explore" size={16}/> FOUR FIELD CHAPTERS</span>
      <span><Icon name="star" size={16}/> TWELVE PRACTICE DECISIONS</span>
      <span><Icon name="people" size={16}/> FREE / NO SIGN-IN</span>
      <span>NO XP / NO PUBLIC ACTIVITY</span>
    </div>
    <div className="guide-layout">
      <aside className="guide-nav" aria-label="Field Guide chapter navigation">
        <div className="guide-nav-heading">
          <span className="kicker">YOUR FIELD MANUAL / THIS VISIT</span>
          <strong>SELECT A CHAPTER.</strong>
          <p>You can change chapters whenever you like. Practice is kept in this page only, not saved to an account.</p>
        </div>
        <div className="guide-chapters">
          {chapters.map(item => {
            const done = completed.includes(item.id);
            const step = steps[item.id] ?? 0;
            return <button type="button" key={item.id}
              className={"guide-chapter" + (active === item.id ? " guide-chapter-active" : "") + (done ? " guide-chapter-done" : "")}
              aria-pressed={active === item.id}
              onClick={() => selectChapter(item.id)}>
              <span className="guide-chapter-index">{item.serial}</span>
              <span className="guide-chapter-copy">
                <small>{item.kicker}</small>
                <strong>{item.title}</strong>
                <span>{done ? "PRACTICED THIS VISIT" : step + " / " + item.exercises.length + " EXERCISES"}</span>
              </span>
              <span className="guide-chapter-icon" aria-hidden="true"><Icon name={item.icon} size={19}/></span>
            </button>;
          })}
        </div>
        <div className="guide-visit-progress">
          <span className="kicker">PRACTICE PROGRESS / NOT XP</span>
          <strong>{progress.answered} <small>/ {progress.total} EXERCISES</small></strong>
          <div role="progressbar" aria-label="Practice decisions completed this visit"
            aria-valuemin={0} aria-valuemax={progress.total} aria-valuenow={progress.answered}>
            <span style={{ width: (progress.answered / progress.total * 100) + "%" }}/>
          </div>
          <p>{progress.completed} of {chapters.length} chapters practiced. Nothing here affects your member level, achievements, reputation or published activity.</p>
          <button type="button" onClick={resetVisit}>RESET THIS VISIT</button>
        </div>
      </aside>

      <div className="guide-main">
        <section className="guide-training" aria-labelledby="guide-training-title">
          <header className="guide-training-header">
            <span className="kicker">INTERACTIVE FIELD EXERCISES</span>
            <span className="guide-training-serial">ANEVUM / {chapter.serial} / PRACTICE</span>
          </header>
          <div className="guide-training-hero">
            <div className="guide-training-headline">
              <span className="guide-training-tag">{chapter.kicker}</span>
              <h2 id="guide-training-title">{chapter.title}</h2>
              <p>{chapter.description}</p>
              <span className="guide-training-notice">Illustrative learning scenarios only. Not actual submissions, users or site activity.</span>
            </div>
            <div className="guide-training-art" aria-hidden="true">
              <div className="guide-training-rings"/>
              <div className="guide-training-medallion"><OrbitalMark/></div>
              <span>{chapter.serial} / 04</span>
            </div>
          </div>
          {finished ?
            <div className="guide-complete" role="status">
              <div className="guide-complete-mark"><Icon name="star" size={34}/></div>
              <span className="kicker">CHAPTER PRACTICED / THIS VISIT ONLY</span>
              <h3>YOU FOUND YOUR WAY.</h3>
              <p>You practiced all {chapter.exercises.length} decisions in {chapter.title.toLowerCase()}. This is educational practice, not a badge, XP award, credential or saved account milestone.</p>
              <div className="guide-actions">
                {nextChapter && <button type="button" className="button primary" onClick={() => selectChapter(nextChapter.id)}>NEXT CHAPTER <Icon name="arrow" size={16}/></button>}
                <button type="button" className="button secondary" onClick={replayChapter}>PRACTICE AGAIN</button>
                {!nextChapter && <Link className="button secondary" to="/discover">EXPLORE REAL WORK</Link>}
              </div>
            </div>
          :
            <div className="guide-practice">
              <div className="guide-step-heading">
                <span className="kicker">PRACTICE DECISION / {String(currentIndex + 1).padStart(2, "0")} OF {String(chapter.exercises.length).padStart(2, "0")}</span>
                <div className="guide-step-indicators" aria-hidden="true">
                  {chapter.exercises.map((item, i) => <span key={item.id} className={i <= currentIndex ? "active" : ""}/>)}
                </div>
              </div>
              <div className="guide-question">
                <span className="guide-scenario">{exercise.scenario}</span>
                <h3>{exercise.question}</h3>
              </div>
              <div className="guide-answer-grid" role="group" aria-label="Choose your response">
                {exercise.choices.map((choice, index) =>
                  <button type="button" key={index}
                    className={"guide-answer" + (selected === index ? (result?.correct ? " guide-answer-correct" : " guide-answer-try") : "")}
                    aria-pressed={selected === index}
                    disabled={result?.correct === true}
                    onClick={() => chooseAnswer(index)}>
                    <span className="guide-answer-index">{String.fromCharCode(65 + index)}</span>
                    <span>{choice}</span>
                    <Icon name="arrow" size={17}/>
                  </button>
                )}
              </div>
              <div className={"guide-feedback" + (result ? (result.correct ? " guide-feedback-correct" : " guide-feedback-retry") : "")}
                role="status" aria-live="polite">
                {result ?
                  <><strong>{result.correct ? "GOOD DECISION." : "THINK IT THROUGH."}</strong><p>{result.feedback}</p></> :
                  <><strong>YOUR CALL.</strong><p>Choose one response. Feedback is immediate, and you can try again without losing progress.</p></>}
              </div>
              <div className="guide-actions guide-practice-actions">
                <button type="button" className="button primary" disabled={!result?.correct} onClick={advance}>
                  {currentIndex + 1 === chapter.exercises.length ? "FINISH PRACTICE" : "NEXT DECISION"} <Icon name="arrow" size={16}/>
                </button>
                <span>NO SCORES, PAYWALLS OR TRACKING.</span>
              </div>
            </div>
          }
        </section>

        <section className="guide-next" aria-labelledby="guide-next-title">
          <div className="guide-next-heading">
            <span className="kicker">REAL PLACES / NO PRACTICE DATA</span>
            <h2 id="guide-next-title">GO EXPLORE.</h2>
            <p>The Field Guide is independent of the live catalogue. When you're ready, these links open actual ANEVUM pages.</p>
          </div>
          <nav className="guide-next-links" aria-label="Continue exploring ANEVUM">
            <Link to="/discover"><Icon name="explore" size={22}/><span><strong>DISCOVER</strong><small>Real approved projects</small></span><Icon name="arrow" size={18}/></Link>
            <Link to="/community"><Icon name="community" size={22}/><span><strong>COMMUNITY</strong><small>Current plans and boundaries</small></span><Icon name="arrow" size={18}/></Link>
            <Link to="/status"><Icon name="status" size={22}/><span><strong>BUILD STATUS</strong><small>What is live or still gated</small></span><Icon name="arrow" size={18}/></Link>
          </nav>
        </section>
      </div>
    </div>
  </div>;
}
