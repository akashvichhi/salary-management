# Prompts and AI workflow

## Tools

- **Claude Code** (CLI) for planning, writing docs and writing code.
- **`CLAUDE.md`** steers it. It is the rules file every session reads first: design principles, folder structure, naming, the API contract, testing, and the commit workflow. When the AI gets something wrong, I fix the rule there, so the fix applies to every later prompt and not just one answer.

## How I work with AI

- **Plan before code.** Clarifying questions, requirements, architecture and decisions were written and reviewed before any code.
- **A rules file**, not repeated instructions (`CLAUDE.md`).
- **One focused prompt per step.** Never "build the app"; each prompt does one step and stops.
- **I review every change before it is committed.** The AI shows the files, a summary, the proposed commit message and the check results, then waits for my OK. Approval covers one commit only. Pushing needs its own approval.
- **Test first.** Red, green and refactor commits, each approved separately.
- **AI commits are marked** with a `Co-Authored-By` trailer, so the history shows where AI was used.

---

The log has one entry per step, oldest first, in the format `CLAUDE.md` sets.

## 2026-10-30 to 2026-11-03 — Planning session

- **Prompt / instruction:** I gave the AI the assessment brief and email, and asked it to help plan the stack, hosting, rules and steps before writing any code. Follow-up questions included "do we need charts?", "what are we missing?", "does the backend use the same pagination shape as the frontend?", "camelCase or kebab-case CSS classes?", "how do we stop a JS error leaving a blank page?" and "how do we optimise React and FastAPI?".
- **What the AI produced:**
  - a draft of the clarifying questions
  - a stack proposal (FastAPI, SQLite, React with Ant Design)
  - a hosting comparison from a web search
  - the rules file
  - a step-by-step plan with one prompt per step
- **What I changed, rejected, or corrected, and why:**
  - **Clarifying questions:** I removed "AI in the product" (the brief never asks for it) and the deployment question (the platform is our choice).
  - **Component library:** I chose Mantine over the suggested Ant Design.
  - **Hosting:** I proposed running locally only; I accepted Render's free tier after the AI pointed out that "deployed" is a requirement.
  - **Charts:** I asked whether we need them, and we kept tables first.
  - **CI:** the AI added a GitHub Actions pipeline; I removed it, because Render deploys on push and local checks are the gate.
  - **Committing:** the AI first planned to commit as it went; I changed this to my approval before every commit.
  - **Commit order:** the AI put `.gitignore` alone in the first commit; I put the requirements first, as the brief implies.
  - **Rules I added:**
    - one React Query file per resource, and all query keys in one file
    - a `common/` folder for components shared by 2+ pages
    - `I` and `T` prefixes, and no untyped variables
    - skeletons instead of spinners
    - httpOnly cookies, and the `master` branch
    - Mantine first, then SCSS with tokens and no hardcoded values
    - error boundaries
    - checks run once, when the work is done
  - **AI changes to my examples, kept:**
    - no `deploy` npm script
    - ESLint formatting rules moved to `@stylistic`
    - one import alias, `@src`
    - targeted memoisation instead of wrapping everything
  - **"What are we missing?":** the AI fixed its own contradictions (untyped examples, React 19's `JSX` type, a case-conversion bug in 422 field errors), and I accepted 7 additions:
    - SPA serving and a health check
    - this log
    - no personal data in logs
    - committed lock files
    - input hygiene
    - UX rules
    - enforced coverage
  - **Optimisation:** of 20 ideas, 10 were already covered, I added 6, and 4 are deliberately skipped (recorded as improvements).
  - **3 Nov, notes vs. the sent email:** the AI compared my planning notes with the email I actually sent and found three mismatches: 7 questions were sent, not 6; the timeline question was still in; and the email promised to start on documented defaults, while the plan said to wait for a reply. I corrected the notes and decided to start on documented assumptions.
  - **3 Nov, the brief:** the AI had not opened the assessment link from the email; I pointed it to the document, and it read the brief and confirmed the plan matched.
  - **3 Nov, the answers:** the AI suggested answers to my six questions. I accepted five and changed currency to **USD only**. The AI had first suggested local currency with no conversion, then corrected itself to local currency plus fixed-rate USD.
  - **3 Nov, setup problems the AI flagged:** a coverage threshold that would fail single-file test runs, Windows line endings breaking the LF lint rule, the ignore file missing its leading dot, and `uv` and `make` not installed.
- **How it was verified:** I compared the plan with the brief and with the email as sent, tested GitHub SSH access, and checked the installed tool versions.

## 2026-11-03 — Step 3: git setup

- **Prompt / instruction:** "Run `git init -b master`, add the remote, run `git status` and show me the output. Don't commit anything."
- **What the AI produced:** the repo on `master` with the `origin` remote. It took my GitHub username from the SSH check instead of asking, confirmed the remote repo exists and is empty, and renamed `gitignore` to `.gitignore`.
- **What I changed, rejected, or corrected, and why:** I created a `salary-management` folder for the repo, so the AI moved the repo and project files into it (safe, with no commits yet).
- **How it was verified:** `git status`, `git remote -v` and `git rev-parse --show-toplevel` in the new folder.

## 2026-11-03 — Step 4: clarifications and requirements (`e0456a9`)

- **Prompt / instruction:** write `docs/clarifications.md` (each question, the answer or an "Assumed" answer, and its build impact) and a one-page `docs/requirements.md`; list conflicts with `CLAUDE.md` without editing it.
- **What the AI produced:** both docs (requirements in 430 words), and a list of 8 conflicts with line numbers (currency in examples, the pending-auth rule, a missing department filter, a missing salary index).
- **What I changed, rejected, or corrected, and why:**
  - I removed the timeline question from the clarifications, because it doesn't affect the build; the intro now says "product questions".
  - I kept the AI's own choices: a department filter, measurable performance targets (to be proven later in `docs/performance.md`), and charts left out.
- **How it was verified:** word count for the one-page limit; the requirements checked against the brief; the conflicts found by searching `CLAUDE.md`.

## 2026-11-03 — Step 5: align the rules (`eda0a2c`)

- **Prompt / instruction:** update `CLAUDE.md` to match the requirements and fix every listed conflict; I also asked the AI to update any other files affected by the day's decisions.
- **What the AI produced:**
  - `CLAUDE.md` with USD only, auth in scope and built last, the department filter and the salary index
  - the coverage threshold moved to `make check`
  - the `.gitignore` timing rule
  - a new `.gitattributes` forcing LF line endings
- **What I changed, rejected, or corrected, and why:** after commit 2, I asked for every commit to use my name and Zoho email. The AI rewrote both unpushed commits with the new author and set the identity for this repo only.
- **How it was verified:** a search for leftover currency and pending-auth wording; `git ls-files --eol` showed LF everywhere; after the rewrite, `git diff` between the old and new commits was empty.

## 2026-11-03 — Step 6: architecture and data model (`90d9c6d`)

- **Prompt / instruction:** write `docs/architecture.md`: overview, system diagram, layers with a sequence diagram, data model, API outline, frontend data flow, startup. Only what's in scope; anything undecided goes in "Open questions".
- **What the AI produced:** the document with 4 Mermaid diagrams, the data model with a reason for every index, and 9 open questions (e.g. create and edit as routes or modals, insights endpoint shapes, fixed lists or free text, seed data).
- **What I changed, rejected, or corrected, and why:** accepted as written. The AI flagged the one thing it added beyond the sources (`uvicorn` as the server).
- **How it was verified:** checked against the requirements and `CLAUDE.md`; a word count for the 5-minute reading target. The diagrams are checked once they render on GitHub.

## 2026-11-03 — Step 7: design decisions (`3f0aac2`)

- **Prompt / instruction:** write `docs/decisions.md` as 14 short ADRs (Context / Options / Decision / Consequences), recording only decisions already made.
- **What the AI produced:** 14 ADRs and an empty "Runtime dependencies" section, to be filled as dependencies are added.
- **What I changed, rejected, or corrected, and why:** accepted as written. Before showing it, the AI corrected itself in three places: ADR 13 was missing its Options line, ADR 14 overstated the thread-pool benefit (SQLite still allows only one writer), and ADR 5 was reworded for clarity.
- **How it was verified:** each ADR has exactly four fields (56 = 14 × 4), and each decision traces to the requirements, the clarifications or `CLAUDE.md`.

## 2026-11-03 — Step 8: start this log

- **Prompt / instruction:** create this file: tools, how I work with AI, and one entry per step so far, with the planning session first.
- **What the AI produced:** this file.
- **What I changed, rejected, or corrected, and why:** nothing yet; anything I change in review is added here before the commit.
- **How it was verified:** each entry checked against the commit history (`git log`) and the review of each step.
