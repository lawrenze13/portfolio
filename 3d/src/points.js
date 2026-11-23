// Every small star in the cloud: a real feature, tool, script or pull request.
// Each one checked against the repos it comes from.
// { cluster, parent (project id), name, line }
const ai = (parent, name, line) => ({ cluster: 'ai', parent, name, line })
const ui = (name, line) => ({ cluster: 'interface', parent: 'uikit', name, line })
const pf = (parent, name, line) => ({ cluster: 'platform', parent, name, line })
const qa = (parent, name, line) => ({ cluster: 'quality', parent, name, line })

export const POINTS = [
  // LawStack aiops and its hub (personal)
  ai('aiops', 'Cost kill switch', 'Warns at US$5 and stops a run at US$15, with higher caps for implementation.'),
  ai('aiops', 'Mid-run questions', 'Pauses an agent when it is stuck, then resumes it from your answer in chat.'),
  ai('aiops', 'Specialist reviewers', 'Adds security, performance and deploy-check agents beside the plan reviewer.'),
  ai('aiops', 'QA fix loop', "Turns QA's Jira comments into new requirements and starts a fresh fix cycle."),
  ai('aiops', 'Script test runner', 'Runs the Playwright lane as a plain script, so a deterministic job costs no tokens.'),
  ai('aiops', 'One-line installer', 'Installs the console on a laptop, behind your own proxy, or on a VPS with TLS.'),
  ai('aiops', 'Test-plan judge', 'Asks a model which extra test suites a change needs; it can add suites, never drop them.'),
  ai('aiops', 'Coverage brief', 'Hands the test-writing agent the exact coverage gaps instead of a blank page.'),
  ai('aiops', 'Support desk assists', 'Drafts replies, tags and summarises support tickets, and never sends anything itself.'),
  // Porto (employer)
  ai('porto', 'Answers with sources', 'Answers product questions from the published guides and lists its sources.'),
  ai('porto', 'Confirm before change', 'Proposes issue changes on a card and makes them only when the person confirms.'),
  ai('porto', 'Ask the codebase', "Explains how the product's code works, citing files and lines at a named commit."),
  ai('porto', 'Coding sessions', 'Runs a coding agent on its own branch in an isolated instance, up to three at once.'),
  ai('porto', 'Your own access', "Reads the issue tracker and wiki with each person's own sign-in, not a shared one."),
  ai('porto', 'Morning briefing', 'Writes each person a short morning briefing with up to three things to start on.'),
  ai('porto', 'Living mascot', "Porto's face glances about, dozes when idle and hops when an answer is ready."),
  // ORKESTRA (employer)
  ai('orkestra', 'Support triage agent', 'Reads each new support ticket and returns priority, related issues and a draft reply.'),
  ai('orkestra', 'Cited findings', "Each triage finding cites the source line it came from, at the customer's version."),
  ai('orkestra', 'Priority floor', "Never lets the agent lower a ticket's priority without flagging it for a person."),
  ai('orkestra', 'Redaction first', 'Removes secrets and personal details from tickets before any agent reads them.'),
  ai('orkestra', 'Redaction canary tests', 'Measures redaction against 1,200 seeded documents and thousands of look-alikes.'),
  ai('orkestra', 'Shadow mode', 'Posts triage cards to a private staff channel while the agent earns trust.'),
  // Max (employer)
  ai('max', 'Triage and draft', 'Triages a support email and drafts a reply for a person to check before it goes.'),
  ai('max', 'Reply leak check', "Holds back any draft with an ID, amount or email that isn't that customer's."),
  ai('max', 'Read-only tools', 'Lets Max look things up in business systems but blocks any tool that changes data.'),
  ai('max', 'One customer per run', "Stops a run the moment a lookup reaches for another customer's records."),
  ai('max', 'Ticket replay grading', "Replays resolved tickets and grades Max's triage against what really happened."),
  ai('max', 'Learning from edits', 'Records every change staff make to a draft as a candidate correction.'),

  // Freelance (personal)
  pf('freelance', 'Clinic Android app', "An Android app for a clinic's patients, schedules, prescriptions and instalments."),
  pf('freelance', 'Online dental booking', 'Patients book dental appointments online and get an email once staff approve.'),
  pf('freelance', 'Treatment payment links', 'Emails patients a link to pay for their treatment online through PayMongo.'),
  pf('freelance', 'Clinic appointment calendar', "A calendar of a clinic's appointments, with today's list and patient photo records."),
  pf('freelance', 'Online store checkout', 'Shoppers fill a cart, pay by GCash or card, and choose delivery or pickup.'),
  pf('freelance', 'Store back office', 'Tracks stock, purchases and sales, with an audit trail and one-click backups.'),
  pf('freelance', 'Port trip booking', 'Travellers book boat trips by route, add passengers and upload proof of payment.'),

  // TestHub (employer)
  qa('testhub', 'Test report parsers', 'Reads Codeception and Playwright reports into results, even when one is partial.'),
  qa('testhub', 'Stable test identity', 'Gives each test one identity across runs, so its history follows it.'),
  qa('testhub', 'Retry history', 'Keeps every attempt of a test that failed, flaked or ran more than once.'),
  qa('testhub', 'CI run polling', 'Watches GitHub for new workflow runs and branch heads in each registered repo.'),
  qa('testhub', 'Module boundary test', "Fails the build when one part of the code reaches into another's internals."),
  // LawStack verdict (personal)
  qa('verdict', 'Run upload API', 'Takes a test report with screenshots and traces from any CI in one HTTP call.'),
  qa('verdict', 'Flake rate ranking', 'Ranks tests by how often they failed across their last 50 runs.'),
  qa('verdict', 'Spec history timeline', "Shows a test's recent passes and failures as dots, and flags when it flips."),
  qa('verdict', 'Spec catalogue', 'A searchable list of every test seen across runs, each with its own history.'),
  qa('verdict', 'Run history filters', 'Filter past runs by outcome, branch or ticket key to find the one that broke.'),
  qa('verdict', 'Guided setup wizard', 'A step-by-step first-run setup that stores settings with secrets masked.'),

  // UI kit (employer): general, and only what shows an edge
  ui('Command palette', 'One keyboard shortcut to search everything and jump straight to it.'),
  ui('Dark mode brand colours', "Lightens a customer's brand colours just enough to stay readable in dark mode."),
  ui('Live component docs', 'A documentation site with a live preview of every component under any brand.'),
  ui('Agent guideline index', 'A machine-readable index of every guideline, so coding agents build to the standard.'),
  ui('Translated throughout', 'Every string translated, and the build fails if one is missing.'),
]
