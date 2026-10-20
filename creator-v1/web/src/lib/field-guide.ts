/**
 * The ANEVUM Field Guide is first-party educational material, not a catalogue.
 * Training scenarios are hypothetical, explicitly labelled, and never submitted
 * to the public project API, member endpoints, reputation ledger or analytics.
 */
export type FieldExercise = {
  id: string;
  scenario: string;
  question: string;
  choices: readonly [string, string, string];
  correctIndex: 0 | 1 | 2;
  success: string;
  retry: string;
};
export type FieldChapter = {
  id: string;
  serial: string;
  title: string;
  kicker: string;
  description: string;
  icon: string;
  exercises: readonly FieldExercise[];
};

export const chapters: readonly FieldChapter[] = [
  {
    id: "discover", serial: "01", title: "READ THE SIGNAL", kicker: "DISCOVER / NAVIGATE",
    description: "Find a real release and understand what its project page actually promises.",
    icon: "explore",
    exercises: [
      {
        id: "browse", scenario: "TRAINING SCENARIO / YOU ARE LOOKING FOR A GAME",
        question: "Where should you start to browse the current public games catalogue?",
        choices: ["Explore the Games category", "Invent a creator name to search", "Wait for someone to message you"],
        correctIndex: 0,
        success: "Correct. Category portals open real published catalogue filters, even when there are no releases yet.",
        retry: "You can browse a category directly. No made-up creator or membership is needed."
      },
      {
        id: "launch", scenario: "TRAINING SCENARIO / A PROJECT HAS TWO DESTINATIONS",
        question: "A project lists a hosted demo and a source-code repository. Which is the intended first stop if you want to try it?",
        choices: ["Assume the source link installs the app", "Check the hosted demo destination and its domain", "Download an unrelated attachment"],
        correctIndex: 1,
        success: "Correct. A hosted demo is for trying the project; source code is a separate destination. Both are external and deserve scrutiny.",
        retry: "Do not assume source code is a playable demo. Inspect the hosted destination and its domain."
      },
      {
        id: "pricing", scenario: "TRAINING SCENARIO / A CARD SAYS FREE",
        question: "What does a free-to-use label tell you today?",
        choices: ["ANEVUM has audited all future charges", "Every download is automatically safe", "The creator declared it free; confirm terms yourself"],
        correctIndex: 2,
        success: "Correct. A published free flag is the creator's declaration, not a third-party pricing or safety guarantee.",
        retry: "Free status is publisher-declared. Confirm the destination and terms before using an external product."
      }
    ]
  },
  {
    id: "safe", serial: "02", title: "PLAY IT SMART", kicker: "SAFETY / TRUST",
    description: "Keep your account, device and attention safe when visiting a project outside ANEVUM.",
    icon: "status",
    exercises: [
      {
        id: "signin", scenario: "TRAINING SCENARIO / AN EXTERNAL APP ASKS FOR YOUR PASSWORD",
        question: "What should you do before typing any account credentials?",
        choices: ["Confirm the service and its exact trusted sign-in origin", "Paste your ANEVUM password into the external form", "Send credentials to the creator in a message"],
        correctIndex: 0,
        success: "Correct. ANEVUM listing a link does not authenticate that third-party service or authorize password sharing.",
        retry: "Never reuse or send your ANEVUM password to an external project. Check the origin first."
      },
      {
        id: "download", scenario: "TRAINING SCENARIO / AN UNFAMILIAR PROJECT OFFERS A DOWNLOAD",
        question: "Which choice is safest?",
        choices: ["Disable device protection to make it run", "Verify publisher, permissions and provenance before installing", "Run the file without checking"],
        correctIndex: 1,
        success: "Correct. A visible project is not a security endorsement. Treat unfamiliar executables cautiously.",
        retry: "A published page is not a malware scan or security certification. Verify before installing."
      },
      {
        id: "permissions", scenario: "TRAINING SCENARIO / AN APP WANTS MORE ACCESS THAN IT NEEDS",
        question: "What is the sensible response?",
        choices: ["Grant everything because the page is listed", "Assume the permissions have no cost", "Decline unnecessary access and investigate the request"],
        correctIndex: 2,
        success: "Correct. Access requests should be proportionate to what the tool actually needs.",
        retry: "Question excessive permissions. Discovery is not an endorsement of an external app."
      }
    ]
  },
  {
    id: "feedback", serial: "03", title: "GIVE REAL FEEDBACK", kicker: "PEOPLE / COMMUNITY",
    description: "Help independent makers improve their work instead of chasing ratings or attention.",
    icon: "community",
    exercises: [
      {
        id: "actionable", scenario: "TRAINING SCENARIO / A GAME BUTTON OVERLAPS ON MOBILE",
        question: "Which comment would help the creator most?",
        choices: ["On my phone at narrow width, the Play button overlaps the menu", "Terrible. Fix everything", "Five stars for five stars"],
        correctIndex: 0,
        success: "Correct. Name the device or context, the problem, and what happened. Specific feedback is actionable.",
        retry: "Good feedback explains an observable problem; insults and review exchanges do not."
      },
      {
        id: "respect", scenario: "TRAINING SCENARIO / YOU DISAGREE WITH A CREATIVE CHOICE",
        question: "How can you respond usefully?",
        choices: ["Demand the creator change it to your preference", "Explain your experience respectfully, with an example", "Post repeated identical comments"],
        correctIndex: 1,
        success: "Correct. Helpful disagreement is clear, specific and respectful of the person making the work.",
        retry: "Describe your experience respectfully; avoid demands, harassment and repeated spam."
      },
      {
        id: "reputation", scenario: "TRAINING SCENARIO / YOU WANT TO EARN RECOGNITION",
        question: "Which action belongs in a fair contribution system?",
        choices: ["Refresh the page hundreds of times", "Purchase a stronger vote", "Provide an original, useful contribution that can be verified"],
        correctIndex: 2,
        success: "Correct. Repeated clicks, paid rank and fake engagement do not belong in earned progression.",
        retry: "Legitimate recognition is about verified contributions, not clicks, payments or activity farming."
      }
    ]
  },
  {
    id: "open", serial: "04", title: "BUILD IN THE OPEN", kicker: "CREATORS / RIGHTS",
    description: "Read licensing and attribution details before copying, adapting or contributing code.",
    icon: "create",
    exercises: [
      {
        id: "license", scenario: "TRAINING SCENARIO / A GITHUB REPOSITORY IS PUBLIC",
        question: "Can you assume every reuse or redistribution is permitted?",
        choices: ["No. Check the actual license and the relevant rights", "Yes. Public means public domain", "Yes, if you remove the author's name"],
        correctIndex: 0,
        success: "Correct. Public visibility is not a license. Confirm terms and rights before reuse.",
        retry: "Public code is still copyrighted by default; visibility alone does not grant unrestricted reuse."
      },
      {
        id: "contribute", scenario: "TRAINING SCENARIO / YOU WANT TO HELP FIX A BUG",
        question: "What is a useful first contribution step?",
        choices: ["Replace the entire project without asking", "Read contributing guidance and file a clear reproducible issue", "Claim ownership of the original project"],
        correctIndex: 1,
        success: "Correct. Small, reproducible, respectful contributions help maintainers much more than unilateral rewrites.",
        retry: "Check the project's guidelines and give maintainers a specific reproducible problem."
      },
      {
        id: "attribution", scenario: "TRAINING SCENARIO / A PROJECT USES OTHERS' WORK OR AI TOOLS",
        question: "How should the project represent that work?",
        choices: ["Hide the origin because it might lower ratings", "Claim all third-party material as original", "Credit sources and disclose material AI assistance where relevant"],
        correctIndex: 2,
        success: "Correct. Honest credits, licenses and disclosures help people understand how work was made.",
        retry: "Transparent credits and disclosures are part of responsible independent publishing."
      }
    ]
  }
];

export function gradeChoice(chapterId: string, exerciseIndex: number, choiceIndex: number) {
  const chapter = chapters.find(item => item.id === chapterId);
  const exercise = chapter?.exercises[exerciseIndex];
  if (!exercise || !Number.isInteger(exerciseIndex) || !Number.isInteger(choiceIndex) ||
      choiceIndex < 0 || choiceIndex >= exercise.choices.length)
    throw new RangeError("Unknown practice exercise or choice");
  const correct = choiceIndex === exercise.correctIndex;
  return { correct, feedback: correct ? exercise.success : exercise.retry };
}

export function guideProgress(completed: readonly string[], steps: Readonly<Record<string, number>>) {
  const done = chapters.filter(chapter => completed.includes(chapter.id));
  const answered = chapters.reduce((sum, chapter) => {
    if (completed.includes(chapter.id)) return sum + chapter.exercises.length;
    const value = steps[chapter.id] ?? 0;
    return sum + Math.max(0, Math.min(chapter.exercises.length, Math.floor(Number.isFinite(value) ? value : 0)));
  }, 0);
  const total = chapters.reduce((sum, chapter) => sum + chapter.exercises.length, 0);
  return { completed: done.length, answered, total };
}
