import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { chapters, gradeChoice, guideProgress } from "../web/src/lib/field-guide.ts";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const guide = read("web/src/pages/FieldGuidePage.tsx");
const app = read("web/src/App.tsx");
const shell = read("web/src/components/Shell.tsx");
const start = read("web/src/pages/StartPage.tsx");
const css = read("web/src/field-guide.css");

test("the Field Guide has four truthful independent chapters with three practice decisions each", () => {
  assert.deepEqual(chapters.map(item => item.id), ["discover", "safe", "feedback", "open"]);
  assert.equal(chapters.reduce((n, c) => n + c.exercises.length, 0), 12);
  const ids = new Set();
  for (const chapter of chapters) {
    assert.equal(chapter.exercises.length, 3);
    for (const exercise of chapter.exercises) {
      assert.ok(exercise.scenario.startsWith("TRAINING SCENARIO /"), exercise.id);
      assert.equal(exercise.choices.length, 3);
      assert.equal(typeof exercise.choices[exercise.correctIndex], "string");
      assert.ok(exercise.success.length > 35);
      assert.ok(exercise.retry.length > 35);
      assert.ok(!ids.has(exercise.id), "Duplicate exercise ID " + exercise.id);
      ids.add(exercise.id);
    }
  }
});

test("every question accepts only its intended answer; invalid input fails closed", () => {
  for (const chapter of chapters) {
    chapter.exercises.forEach((exercise, step) => {
      assert.deepEqual(gradeChoice(chapter.id, step, exercise.correctIndex), {
        correct: true, feedback: exercise.success
      });
      for (let i = 0; i < 3; i++) {
        if (i === exercise.correctIndex) continue;
        assert.deepEqual(gradeChoice(chapter.id, step, i), {
          correct: false, feedback: exercise.retry
        });
      }
    });
  }
  for (const args of [["unknown", 0, 0], ["discover", -1, 0], ["discover", 9, 0], ["discover", 0, -1], ["discover", 0, 3], ["discover", 0, 0.5]])
    assert.throws(() => gradeChoice(...args), RangeError);
});

test("progress counts only practice completed during this page visit", () => {
  assert.deepEqual(guideProgress([], {}), { completed: 0, answered: 0, total: 12 });
  assert.deepEqual(guideProgress([], { discover: 2, safe: 1 }), { completed: 0, answered: 3, total: 12 });
  assert.deepEqual(guideProgress(["discover"], { discover: 1, safe: 1 }), { completed: 1, answered: 4, total: 12 });
  assert.deepEqual(guideProgress(chapters.map(x => x.id), {}), { completed: 4, answered: 12, total: 12 });
  assert.deepEqual(guideProgress(["discover", "discover", "invented"], { safe: 9, feedback: -5 }), { completed: 1, answered: 6, total: 12 });
});

test("public routing connects a real guide without gated accounts or publications", () => {
  assert.match(app, /path="guide" element={<FieldGuidePage\/>}/);
  assert.match(shell, /to="\/guide">Field Guide<\/Link>/);
  assert.match(start, /to: "\/guide", label: "TRY THE FREE FIELD GUIDE"/);
  for (const url of ["/discover", "/community", "/status"])
    assert.ok(guide.includes('to="' + url + '"'), url);
  assert.match(guide, /action={{ to: "\/start", label: "BACK TO START HERE" }}/);
  for (const disallowed of ["member-api", "memberCreateProject", "memberVote", "memberProgress", "localStorage", "sessionStorage", "fetch(", "Award XP", "achievementUnlocked"])
    assert.ok(!guide.includes(disallowed), disallowed);
  assert.match(guide, /not a badge, XP award, credential or saved account milestone/);
  assert.match(guide, /Practice is kept in this page only/);
});

test("exercise player supports accessible keyboard controls and bounded chapter replay", () => {
  assert.match(guide, /aria-pressed={active === item.id}/);
  assert.match(guide, /aria-pressed={selected === index}/);
  assert.match(guide, /aria-live="polite"/);
  assert.match(guide, /aria-valuenow={progress.answered}/);
  assert.match(guide, /disabled={!result\?\.correct}/);
  assert.match(guide, /if \(!result\?\.correct\) return;/);
  assert.match(guide, /function replayChapter\(\)/);
  assert.match(guide, /function resetVisit\(\)/);
  assert.match(css, /@media\(max-width:820px\)/);
  assert.match(css, /@media\(max-width:560px\)/);
  assert.match(css, /prefers-reduced-motion:reduce/);
});
