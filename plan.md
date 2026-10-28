You are redesigning the UI of my app "Khata Judge". It is a frontend-only React + Vite + MUI app. There is NO backend and there must never be one. Everything runs in the browser: the Gemini API is called directly from the frontend using the user's own key, and all data is saved on the user's device in IndexedDB.

Your job is a full UI/UX redesign. Do NOT break or rewrite the working logic (Gemini calls, scoring, rubric math, IndexedDB saving, history, presets, file upload). Only change layout, wording, visual design and user flow. If you must touch logic, keep behaviour identical.

## Who uses this app
A university student (not a developer). They paste an exam question and their own answer. They want to know:
1. What score they would get.
2. Where they lost marks, and why.
3. A corrected, full-mark version of THEIR answer that they can study and write in the exam.
The app should feel like a calm, friendly study tool, not a developer dashboard.

## Rule 1: Remove all technical jargon from the UI
No user should ever see words like API, Gemini 2.5 Flash, model, IndexedDB, Storage, MUI, Workbench, Preset, Rubric, Parameter, Benchmark, Session, Candidate, Script, Prompt, chars, tokens.
Rename everything using this map (adjust similar items the same way):

| Current text | New text |
| - | - |
| Khata Judge + "MUI Workbench" badge | Khata Judge (remove the badge). Tagline: "Check your answer. Get the full-mark version." |
| Load Sample QA | Try an example |
| Gemini 2.5 Flash dropdown | Move to Settings as "Checking quality: Fast / Best". Hide by default |
| IndexedDB chip, Storage button | Remove from header. Put "Saved on this device" plus "Clear my data" inside Settings |
| History | My past answers |
| Set Key / "Gemini API Key Required" banner | One-time setup card: "Connect your free Google AI key to start checking answers", with a "How do I get one?" link and step-by-step help. After it is set, hide it completely and show a small "Connected" status in Settings |
| Question Specification / Question Prompt | Your question |
| Max Marks | Total marks |
| Reference / Model Answer & Key Points (Optional Benchmark) | Add your teacher's answer or key points (optional) |
| Multi-Parameter Rubric | How marks are given |
| "AI evaluates each parameter individually..." | "Your answer is checked on each of these points" |
| Parameter & Criteria | What is checked |
| Sum: 20 / 20M | "Marks add up to 20 of 20" (or a warning: "Marks add up to 18. They must add up to 20") |
| Save Preset | Save this marking style |
| Category chips (University Academic Examination, etc.) | "Choose exam type" with plain names: University exam, Software / system design, Job and civil service exams, Essay and writing |
| Candidate Script / Answer | Your answer |
| "Enter or paste the response to be judged against the rubric" | "Type, paste or upload the answer you wrote" |
| 207 words • 1327 chars | 207 words (no chars). Also show a suggested length for the marks, for example "About 250 to 350 words is ideal for 5 marks" |
| Reset Session | Start over (ask for confirmation) |
| Run Gemini Answer Judge | Check my answer |

Error and loading messages must also be plain, for example "Checking your answer..." and "Something went wrong. Please try again." Never show raw API errors, status codes or JSON to the user. Log them to the console only.
Special cases in plain words:
- Wrong or missing key: "Your Google AI key is not working. Please check it in Settings."
- Usage limit reached: "You have reached today's free limit. Please try again later."
- No internet: "You seem to be offline. Please check your connection."

## Rule 2: New user flow (3 clear steps)
Replace the current two-panel dashboard with a simple guided flow and a visible step indicator:

Step 1. Your question
- Question box, total marks, exam type.
- "How marks are given" is COLLAPSED by default and filled in automatically from the exam type. Advanced users can expand it to edit the points and marks. Hide delete icons until the user hovers or opens edit mode.
- The teacher's answer field is collapsed and optional.

Step 2. Your answer
- Large, comfortable writing area with Paste and Upload buttons.
- Word count and suggested length.
- One big main button: "Check my answer".

Step 3. Your result (new results page or full-width section)
- At the top: a big score like "14 / 20", with a short plain-language verdict ("Good answer, but missing key examples") and a grade band (Excellent / Good / Needs work).
- Marks by point: for each marking point show the marks given, then "What you did well" and "What lost you marks" in one or two simple sentences each.
- "Your full-mark answer": the corrected, improved version of the student's OWN answer. Keep their structure and words where they were correct, and fix or add only what is needed. Give it a Copy button and a Download button (PDF and text).
- "What changed": a clear side-by-side or highlighted comparison of the original and the improved answer. Added parts in one style, removed or corrected parts in another, so the student learns exactly what to fix.
- "Tips for next time": 3 to 5 short bullet points.
- Buttons: "Edit my answer and check again", "Save to my past answers", "Check a new question".

## Rule 3: Visual design
- Clean, calm and academic. Plenty of white space, one main accent colour, soft neutral background, rounded cards and readable type (16px minimum body text, comfortable line height for long answers).
- Each screen has exactly ONE main action button. Everything else is secondary (text or outlined buttons).
- A simple header: logo and name on the left; "My past answers" and a Settings (gear) icon on the right. Nothing else.
- Fully responsive. It must work well on a phone (stack everything vertically, keep buttons large enough to tap).
- Support light and dark mode.
- Empty states should guide the user, for example "Paste a question to get started" with a "Try an example" link.
- Show a friendly progress state while checking ("Reading your answer...", "Giving marks...", "Writing your full-mark version...") instead of a bare spinner.
- Accessible: proper labels, keyboard navigation, good colour contrast, focus states.
- Prefer simple and familiar over clever. If unsure, choose the more minimal option.

## Rule 4: Settings drawer
Move all the technical controls here, in plain words:
- Google AI key (connect, change, remove), with simple instructions.
- Checking quality: Fast / Best (this maps to the existing model choice).
- Saved marking styles (presets): rename, delete.
- Data: "Your answers are saved only on this device", "Download all my data", "Clear all my data" (with confirmation).

## Rule 5: Make sure the AI output supports the new results page
The Gemini request is built in the frontend code. Find it and check the prompt and response parsing. The response must contain: total score, per-point marks with "did well" and "lost marks" notes, the improved full-mark version of the student's own answer, and tips.
If it does not, extend the prompt text and the parsing in the frontend only. Ask Gemini for JSON output and validate it safely: if parsing fails, show a friendly retry message instead of crashing. Do not change how the key is stored or how the request is sent.

## Rule 6: Frontend only (strict)
- Do NOT add a backend, server, API routes, proxy, serverless functions, database, login or accounts.
- Do NOT add a .env setup that needs a server. The user's key stays in the browser, as it does now.
- Keep IndexedDB as the only storage. Do not change the shape of existing saved data. If a change is unavoidable, migrate old saved data in the browser so past answers are not lost.
- Do not add heavy new libraries. Prefer MUI components that are already installed. If something new is truly needed (for example a text-diff library for the "What changed" view), it must be small, run fully in the browser, and you must tell me before adding it.
- PDF and text downloads must be generated in the browser.
- The app must still work as a static build (npm run build) that can be hosted on any static host.

## How to work
1. First, read the codebase and list every user-visible string and component you will change. Then show me the plan before editing.
2. Make the changes component by component. Keep the existing state management and storage.
3. At the end, give me a short summary of what changed, and confirm that checking an answer, saving, past answers, saved marking styles, upload and the static build (npm run build) still work.