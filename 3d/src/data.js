// The site's content and colour tokens: the 3D view, the plain view, llms.txt and resume.json all read it.

export const SITE_URL = 'https://lawrenzem.space'
// The plain view sits beside the 3D: /plain/ (rendered by src/plain/render.js).
export const PLAIN_URL = './plain/'

export const INTRO = {
  name: 'Lawrenze Maranan',
  title: 'Full-Stack & AI Engineer',
  lead: 'Eight years building software, and now the AI that runs inside it.',
  cloud: "Every point out there is something I've shipped, placed by what it's about.",
  description: 'Full-stack and AI engineer. Eight years building software, and now the AI that runs inside it.',
}


export const PALETTE = {
  bg: '#05110C',
  surface: '#0A1C14',
  line: '#1A3A2A',
  text: '#D6F5DE',
  muted: '#7FA88F',
  ai: '#7CFFA4',
  platform: '#E08A3C',
  quality: '#4FD1C5',
  interface: '#F2C14E',
  core: '#E9F0EA',
}

export const CLUSTERS = {
  ai: { label: 'AI & agents', color: PALETTE.ai, centre: [4.2, 1.2, -1.5], spread: 2.0 },
  platform: { label: 'Platforms', color: PALETTE.platform, centre: [-4.2, -0.6, -0.8], spread: 2.1 },
  quality: { label: 'Quality', color: PALETTE.quality, centre: [0.8, -3.0, 2.2], spread: 1.4 },
  interface: { label: 'Interface', color: PALETTE.interface, centre: [-1.8, 3.0, 2.4], spread: 1.1 },
}

export const PROJECTS = [
  { id: 'aiops', name: 'LawStack aiops', cluster: 'ai', featured: true,
    blurb: 'An operator console that takes Jira tickets to pull requests, one AI agent per lane.',
    tags: ['ai', 'agents', 'orchestration', 'llm', 'automation', 'jira', 'devtools'],
    story: {
      problem: 'Every ticket went the same way: read it, branch, think it through, plan, review, build, test, open the pull request, update Jira. Most of those hours went on the same steps again, not on the hard part.',
      role: 'I designed and built it alone, 128 commits in its first three weeks from April 2026. A small team of us still takes our tickets through it.',
      how: 'Each Jira ticket moves across a board of lanes: brainstorm, plan, review, pull request, implement, test. Every lane is a Claude Code agent with its own prompt and model, working in the ticket\'s own git worktree; its output streams live and is kept as a record. The thinking lanes run on Sonnet. Implementation runs on Opus, because that is where a weaker model thrashes.',
      decisions: [
        ['No code before a person says yes', 'An agent writes code only after someone approves its brainstorm and plan. Approving commits both to the branch, opens a draft pull request and comments on the Jira ticket.'],
        ['One ticket, one worktree', 'Each ticket gets its own branch and working copy, so several can be in flight without stepping on each other.'],
        ['Agents check agents', 'Review and security agents go over the work, then the CI review verdict is read back from the pull request: a pass moves the ticket to done, a blocker sends it back to implement. This catches most mistakes before a person sees the pull request.'],
        ['A budget on every run', 'Each agent run has a cost warning and a hard stop (US$10 and US$30 for implementation), and the dashboard shows spend and throughput.'],
        ['Steps that resume', 'Approval is a chain of recorded steps (commit, push, open the pull request, notify Jira), so a failure picks up where it stopped instead of starting again.'],
      ],
      result: [['100+', 'tickets taken to a pull request'], ['< 1 hr', 'typical ticket to PR, down from hours'], ['Daily', 'still the way we work']],
      stack: 'Next.js 15, TypeScript, SQLite with Drizzle, Auth.js with Google sign-in, the Claude Code CLI, server-sent events, systemd and Caddy, and a one-command installer.',
      link: ['github.com/lawrenze13/lawstack-aiops', 'https://github.com/lawrenze13/lawstack-aiops'],
    } },
  { id: 'viptutors', name: 'VIPTutors AI Suite', cluster: 'ai', featured: true,
    blurb: 'AI learning apps for speech practice, interview prep and writing, with payments and live tutoring.',
    tags: ['ai', 'openai', 'speech', 'llm', 'education', 'stripe', 'zoom', 'laravel'],
    story: {
      problem: 'Students only got feedback in their paid lessons. Between lessons they practised alone, with no one to tell them what to fix.',
      role: 'I built it end to end, mostly on my own, in under six months in 2023: the AI apps and the platform around them.',
      how: 'Three apps on one platform: speech practice, interview prep and writing. A specialist service, SpeechSuper, scores the speech; OpenAI then turns the scores and the transcript into feedback a learner can act on, and the next thing to practise.',
      decisions: [
        ['One shared platform', 'Every app shares one set of accounts, Stripe payments and Zoom tutoring, so a new app meant building only the learning part.'],
        ['Score first, then explain', 'Scoring is left to a service built for it, and the language model only explains the result, so the feedback rests on a measurement rather than a guess.'],
        ['Practice that leads to a tutor', 'The AI covers the days between lessons and points to a live Zoom tutor for what it cannot fix.'],
      ],
      result: [['3', 'AI learning apps'], ['< 6 mo', 'built end to end'], ['1', 'platform for accounts, payments and tutoring']],
      stack: 'Laravel, OpenAI, SpeechSuper, Stripe and Zoom.',
    } },
  { id: 'max', name: 'Max', cluster: 'ai',
    blurb: 'An AI team member for an MSP: an agent that works across chat channels with real tools.',
    tags: ['ai', 'agents', 'langgraph', 'mcp', 'tools', 'chat', 'assistant'] },
  { id: 'porto', name: 'Porto', cluster: 'ai',
    blurb: 'A company assistant that answers questions about the product and its docs.',
    tags: ['ai', 'assistant', 'rag', 'llm', 'chat', 'docs'] },
  { id: 'orkestra', name: 'ORKESTRA', cluster: 'ai',
    blurb: 'A console for a team of single-purpose agents, starting with support triage, where a person approves anything risky.',
    tags: ['ai', 'agents', 'orchestration', 'automation', 'triage', 'guardrails', 'devtools'] },
  { id: 'hostednetwork', name: 'Hosted Network Tools', cluster: 'platform',
    blurb: 'Tools for managed service providers: service qualification and telco integrations.',
    tags: ['msp', 'telco', 'api', 'vue', 'integrations', 'backend'] },
  { id: 'freelance', name: 'Freelance builds', cluster: 'platform',
    blurb: 'A patient management system, a dental clinic platform, e-commerce and a therapy booking app.',
    tags: ['laravel', 'php', 'payments', 'healthcare', 'ecommerce', 'booking'] },
  { id: 'testhub', name: 'TestHub', cluster: 'quality',
    blurb: 'An end-to-end testing platform: environments, runs and evidence.',
    tags: ['testing', 'e2e', 'playwright', 'ci', 'qa'] },
  { id: 'verdict', name: 'LawStack verdict', cluster: 'quality',
    blurb: 'Test results in one place: run history, flaky tests, screenshots and traces.',
    tags: ['testing', 'flaky', 'playwright', 'reporting', 'qa'] },
  { id: 'uikit', name: 'UI kit', cluster: 'interface',
    blurb: 'A themeable design system: customer brand colours, dark mode and translations.',
    tags: ['design-system', 'ui', 'theming', 'dark-mode', 'translations', 'frontend'] },
]

// Oldest first: scrolling down the Path walks from the first job to now.
const COUNT = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve']
export const countWord = (n) => COUNT[n] || String(n)
export const WORK_HEADING = `${countWord(PROJECTS.length)} things I've built`

export const JOBS = [
  { company: 'Bats. City Gov ITSD / IM Digital', role: 'IT on-the-job training', when: '2018',
    text: 'PC diagnostics, LAN and VLAN set-up, and web development fundamentals.' },
  { company: 'Club Galaxy Boracay', role: 'Graphic Designer', when: '2018',
    text: 'Social campaigns and promotional visuals for LED displays and print.' },
  { company: 'Freelance', role: 'Full Stack Developer', when: '2018',
    text: 'A patient management system, a dental clinic platform, e-commerce and a therapy booking app.' },
  { company: 'Wiflab', role: 'Full Stack Developer', when: '2019',
    text: 'E-commerce, payroll and government systems in Laravel, CodeIgniter and PHP; Android and Flutter apps.' },
  { company: 'Cognitif Incorporated', role: 'QA Engineer', when: '2021',
    text: 'End-to-end testing with Selenium and xUnit; GitLab CI/CD; Power BI reporting.' },
  { company: 'VIPTutors Co.', role: 'Mid Full Stack Engineer', when: '2023',
    text: 'AI learning apps with OpenAI and SpeechSuper; Stripe payments and Zoom tutoring.' },
  { company: 'Hosted Network', role: 'Full-Stack & AI Engineer', when: 'Now',
    text: 'Internal tools for managed service providers: internet service qualification, telco integrations, and Max, an AI team member.' },
  { company: 'MultiPortal', role: 'Full-Stack Engineer', when: 'Now',
    text: 'Full-stack engineering across the product.' },
]

export const ABOUT = {
  heading: 'I build software, and the AI inside it.',
  body: [
    "I'm Lawrenze Maranan, a full-stack and AI engineer with eight years of building reliable, user-focused applications.",
    'Most of my backend work is in PHP frameworks; on the front end, modern JavaScript. Lately it is agents: orchestration, tools, evaluation, and keeping them honest in production.',
  ],
  facts: [
    ['8+', 'years shipping'],
    ['PHP · TypeScript · Python', 'day to day'],
    ['Agents', 'in production'],
  ],
}

export const CONTACT = {
  heading: "Let's build something.",
  email: 'marklawrenzeb@gmail.com',
  github: 'https://github.com/lawrenze13',
  linkedin: 'https://www.linkedin.com/in/lawrenzem/',
  where: 'Remote, from the Philippines. Open to full-stack and AI engineering roles.',
}

// For resume.json only. Sources: the old site's tech stack, the case studies and project tags.
export const SKILLS = [
  { name: 'Languages and frameworks', keywords: ['PHP', 'Laravel', 'Yii2', 'TypeScript', 'React', 'Vue.js', 'Node.js', 'Python', 'C#', 'MySQL', 'REST APIs'] },
  { name: 'AI', keywords: ['Agents', 'Claude Code', 'OpenAI', 'LangGraph', 'MCP', 'RAG'] },
  { name: 'Quality', keywords: ['Playwright', 'Selenium', 'xUnit', 'CI/CD'] },
]

export const STOPS = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'path', label: 'Path' },
  { id: 'work', label: 'Work' },
  { id: 'signal', label: 'Signal' },
]
