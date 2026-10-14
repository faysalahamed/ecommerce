// Generates the Daraz Clone developer user manual as a .docx file.
// Run with: node /home/z/my-project/scripts/generate-manual.js
//   (or: bun run /home/z/my-project/scripts/generate-manual.js)

const {
  Document, Packer, Paragraph, TextRun, Header, Footer,
  AlignmentType, HeadingLevel, PageNumber, PageBreak,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType,
  TableLayoutType, LevelFormat, Tab, TabStopType, TabStopPosition,
} = require('docx')
const fs = require('fs')

// ============================================================================
// PALETTE — Cool tech (matches the sky-blue app theme)
// ============================================================================
const P = {
  primary:   '#0A1628',
  body:      '#1A2B40',
  secondary: '#6878A0',
  accent:    '#0EA5E9',
  surface:   '#F0F9FF',
  codeBg:    '#F1F5F9',
  codeText:  '#0F172A',
  warnBg:    '#FEF3C7',
  warnText:  '#92400E',
}
const c = (hex) => hex.replace('#', '')

// ============================================================================
// BORDER HELPERS — for cover wrapper table (MANDATORY: allNoBorders)
// ============================================================================
const NB = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
const noBorders = { top: NB, bottom: NB, left: NB, right: NB }
const allNoBorders = {
  top: NB, bottom: NB, left: NB, right: NB,
  insideHorizontal: NB, insideVertical: NB,
}

// ============================================================================
// COVER RECIPE — R1 (Pure Paragraph Left, dark background)
// ============================================================================
function calcTitleLayout(title, maxWidthTwips, preferredPt = 40, minPt = 24) {
  const charWidth = (pt) => pt * 20
  const charsPerLine = (pt) => Math.floor(maxWidthTwips / charWidth(pt))
  let titlePt = preferredPt
  let lines
  while (titlePt >= minPt) {
    const cpl = charsPerLine(titlePt)
    if (cpl < 2) { titlePt -= 2; continue }
    lines = splitTitleLines(title, cpl)
    if (lines.length <= 3) break
    titlePt -= 2
  }
  if (!lines || lines.length > 3) {
    const cpl = charsPerLine(minPt)
    lines = splitTitleLines(title, cpl)
    titlePt = minPt
  }
  return { titlePt, titleLines: lines }
}

function splitTitleLines(title, charsPerLine) {
  if (title.length <= charsPerLine) return [title]
  const breakAfter = new Set([...' \t-_—–·/'])
  const lines = []
  let remaining = title
  while (remaining.length > charsPerLine) {
    let breakAt = -1
    for (let i = charsPerLine; i >= Math.floor(charsPerLine * 0.6); i--) {
      if (i < remaining.length && breakAfter.has(remaining[i - 1])) {
        breakAt = i
        break
      }
    }
    if (breakAt === -1) {
      const limit = Math.min(remaining.length, Math.ceil(charsPerLine * 1.3))
      for (let i = charsPerLine + 1; i < limit; i++) {
        if (breakAfter.has(remaining[i - 1])) { breakAt = i; break }
      }
    }
    if (breakAt === -1) breakAt = charsPerLine
    lines.push(remaining.slice(0, breakAt).trim())
    remaining = remaining.slice(breakAt).trim()
  }
  if (remaining) lines.push(remaining)
  return lines
}

function calcCoverSpacing(params) {
  const {
    titleLineCount = 1, titlePt = 36, hasSubtitle = false,
    hasEnglishLabel = false, metaLineCount = 0,
    fixedHeight = 800, pageHeight = 16838,
  } = params
  const SAFETY = 1200
  const usableHeight = pageHeight - SAFETY
  const titleHeight = titleLineCount * (titlePt * 23 + 200)
  const subtitleHeight = hasSubtitle ? (12 * 23 + 600) : 0
  const englishLabelHeight = hasEnglishLabel ? (9 * 23 + 600) : 0
  const metaHeight = metaLineCount * (10 * 23 + 100)
  const implicitParaHeight = 3 * 300
  const contentHeight = titleHeight + subtitleHeight + englishLabelHeight + metaHeight + fixedHeight + implicitParaHeight
  const remainingSpace = usableHeight - contentHeight
  const safeRemaining = Math.max(remainingSpace, 400)
  const FOOTER_MIN = 800
  const rawTop = Math.floor(safeRemaining * 0.45)
  const rawBottom = Math.floor(safeRemaining * 0.45)
  const bottomSpacing = Math.max(rawBottom, FOOTER_MIN)
  const topSpacing = Math.max(rawTop - Math.max(0, FOOTER_MIN - rawBottom), 400)
  return { topSpacing, bottomSpacing }
}

function buildCoverR1(config) {
  const padL = 1200, padR = 800
  const availableWidth = 11906 - padL - padR - 300
  const { titlePt, titleLines } = calcTitleLayout(config.title, availableWidth, 40, 24)
  const titleSize = titlePt * 2
  const spacing = calcCoverSpacing({
    titleLineCount: titleLines.length, titlePt,
    hasSubtitle: !!config.subtitle, hasEnglishLabel: !!config.englishLabel,
    metaLineCount: (config.metaLines || []).length,
    fixedHeight: 400,
  })

  const accentLeft = { style: BorderStyle.SINGLE, size: 8, color: c(P.accent), space: 12 }
  const children = []

  // Top whitespace
  children.push(new Paragraph({ spacing: { before: spacing.topSpacing } }))

  // English label
  if (config.englishLabel) {
    children.push(new Paragraph({
      indent: { left: padL, right: padR }, spacing: { after: 500 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: c(P.accent), space: 8 } },
      children: [new TextRun({
        text: config.englishLabel.split('').join('  '),
        size: 18, color: c(P.accent),
        font: { ascii: 'Calibri' }, characterSpacing: 40,
      })],
    }))
  }

  // Title
  for (let i = 0; i < titleLines.length; i++) {
    children.push(new Paragraph({
      indent: { left: padL },
      spacing: {
        after: i < titleLines.length - 1 ? 100 : 300,
        line: Math.ceil(titlePt * 23), lineRule: 'atLeast',
      },
      children: [new TextRun({
        text: titleLines[i], size: titleSize, bold: true,
        color: c(P.primary), font: { ascii: 'Arial' },
      })],
    }))
  }

  // Subtitle
  if (config.subtitle) {
    children.push(new Paragraph({
      indent: { left: padL }, spacing: { after: 800 },
      children: [new TextRun({
        text: config.subtitle, size: 24, color: c(P.secondary),
        font: { ascii: 'Arial' },
      })],
    }))
  }

  // Meta lines
  for (const line of (config.metaLines || [])) {
    children.push(new Paragraph({
      indent: { left: padL + 200 }, spacing: { after: 80 },
      border: { left: accentLeft },
      children: [new TextRun({
        text: line, size: 24, color: c(P.secondary),
        font: { ascii: 'Arial' },
      })],
    }))
  }

  // Bottom whitespace
  children.push(new Paragraph({ spacing: { before: spacing.bottomSpacing } }))

  // Footer
  children.push(new Paragraph({
    indent: { left: padL, right: padR },
    border: { top: { style: BorderStyle.SINGLE, size: 2, color: c(P.accent), space: 8 } },
    spacing: { before: 200 },
    children: [
      new TextRun({ text: config.footerLeft || '', size: 16, color: c(P.secondary), font: { ascii: 'Arial' } }),
      new TextRun({ text: '                                        ' }),
      new TextRun({ text: config.footerRight || '', size: 16, color: c(P.secondary), font: { ascii: 'Arial' } }),
    ],
  }))

  return [new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: allNoBorders,
    rows: [new TableRow({
      height: { value: 16838, rule: 'exact' },
      children: [new TableCell({
        shading: { type: ShadingType.CLEAR, fill: c(P.surface) },
        borders: noBorders,
        children,
      })],
    })],
  })]
}

// ============================================================================
// BODY HELPERS
// ============================================================================
function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 480, after: 200 },
    keepNext: true,
    children: [new TextRun({
      text, bold: true, size: 32, color: c(P.primary),
      font: { ascii: 'Calibri' },
    })],
  })
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 360, after: 160 },
    keepNext: true,
    children: [new TextRun({
      text, bold: true, size: 26, color: c(P.primary),
      font: { ascii: 'Calibri' },
    })],
  })
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 240, after: 120 },
    keepNext: true,
    children: [new TextRun({
      text, bold: true, size: 22, color: c(P.accent),
      font: { ascii: 'Calibri' },
    })],
  })
}

function body(text, opts = {}) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: 312, after: 120 },
    children: [new TextRun({
      text, size: 22, color: c(P.body),
      font: { ascii: 'Calibri' },
    })],
  })
}

function bodyRich(runs) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: 312, after: 120 },
    children: runs.map(r => new TextRun({
      text: r.text,
      size: 22,
      color: c(r.color || P.body),
      bold: !!r.bold,
      italic: !!r.italic,
      font: r.code ? { ascii: 'Consolas' } : { ascii: 'Calibri' },
    })),
  })
}

function bullet(text, level = 0) {
  return new Paragraph({
    bullet: { level },
    spacing: { line: 312, after: 80 },
    children: [new TextRun({
      text, size: 22, color: c(P.body),
      font: { ascii: 'Calibri' },
    })],
  })
}

function bulletRich(runs, level = 0) {
  return new Paragraph({
    bullet: { level },
    spacing: { line: 312, after: 80 },
    children: runs.map(r => new TextRun({
      text: r.text,
      size: 22,
      color: c(r.color || P.body),
      bold: !!r.bold,
      italic: !!r.italic,
      font: r.code ? { ascii: 'Consolas' } : { ascii: 'Calibri' },
    })),
  })
}

function numbered(text, ref = 'default-numbering') {
  return new Paragraph({
    numbering: { reference: ref, level: 0 },
    spacing: { line: 312, after: 80 },
    children: [new TextRun({
      text, size: 22, color: c(P.body),
      font: { ascii: 'Calibri' },
    })],
  })
}

// Code block — light gray background, monospace, preserve whitespace
function code(lines) {
  if (typeof lines === 'string') lines = lines.split('\n')
  const cellChildren = lines.map((line, idx) => new Paragraph({
    spacing: { line: 280, before: 0, after: 0 },
    children: [new TextRun({
      text: line === '' ? ' ' : line,
      size: 20,
      color: c(P.codeText),
      font: { ascii: 'Consolas' },
    })],
  }))

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: c(P.secondary) },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: c(P.secondary) },
      left: { style: BorderStyle.SINGLE, size: 4, color: c(P.accent) },
      right: { style: BorderStyle.SINGLE, size: 4, color: c(P.secondary) },
      insideHorizontal: NB, insideVertical: NB,
    },
    rows: [new TableRow({
      cantSplit: false,
      children: [new TableCell({
        shading: { type: ShadingType.CLEAR, fill: c(P.codeBg) },
        margins: { top: 200, bottom: 200, left: 240, right: 240 },
        children: cellChildren,
      })],
    })],
  })
}

// Inline code
function codeInline(text) {
  return new TextRun({
    text, size: 20, color: c(P.codeText),
    font: { ascii: 'Consolas' },
    shading: { type: ShadingType.CLEAR, fill: c(P.codeBg) },
  })
}

// Callout/warning block
function callout(title, text, variant = 'info') {
  const bg = variant === 'warn' ? P.warnBg : P.surface
  const txt = variant === 'warn' ? P.warnText : P.body
  const accentColor = variant === 'warn' ? '#F59E0B' : P.accent
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: {
      top: NB, bottom: NB, right: NB,
      left: { style: BorderStyle.SINGLE, size: 24, color: c(accentColor) },
      insideHorizontal: NB, insideVertical: NB,
    },
    rows: [new TableRow({
      cantSplit: true,
      children: [new TableCell({
        shading: { type: ShadingType.CLEAR, fill: c(bg) },
        margins: { top: 160, bottom: 160, left: 240, right: 240 },
        children: [
          new Paragraph({
            spacing: { after: 80, line: 280 },
            children: [new TextRun({
              text: title, bold: true, size: 22, color: c(txt),
              font: { ascii: 'Calibri' },
            })],
          }),
          new Paragraph({
            spacing: { line: 300 },
            children: [new TextRun({
              text, size: 20, color: c(txt),
              font: { ascii: 'Calibri' },
            })],
          }),
        ],
      })],
    })],
  })
}

// Simple table (header + rows)
function simpleTable(headers, rows) {
  const headerRow = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: headers.map(h => new TableCell({
      shading: { type: ShadingType.CLEAR, fill: c(P.accent) },
      margins: { top: 120, bottom: 120, left: 160, right: 160 },
      children: [new Paragraph({
        spacing: { line: 280 },
        children: [new TextRun({
          text: h, bold: true, size: 20, color: 'FFFFFF',
          font: { ascii: 'Calibri' },
        })],
      })],
    })),
  })

  const dataRows = rows.map((row, idx) => new TableRow({
    cantSplit: true,
    children: row.map((cell) => new TableCell({
      shading: { type: ShadingType.CLEAR, fill: idx % 2 === 0 ? 'FFFFFF' : c(P.surface) },
      margins: { top: 100, bottom: 100, left: 160, right: 160 },
      children: [new Paragraph({
        spacing: { line: 280 },
        children: [new TextRun({
          text: String(cell), size: 20, color: c(P.body),
          font: { ascii: cell.match(/^[a-zA-Z][a-zA-Z0-9._-]*$/) ? 'Consolas' : 'Calibri' },
        })],
      })],
    })),
  }))

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.AUTOFIT,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: c(P.accent) },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: c(P.accent) },
      left: NB, right: NB,
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: 'E2E8F0' },
      insideVertical: NB,
    },
    rows: [headerRow, ...dataRows],
  })
}

// ============================================================================
// CONTENT — Daraz Clone Developer Manual
// ============================================================================
const coverConfig = {
  title: 'Daraz Clone — Developer Setup & Installation Manual',
  subtitle: 'Comprehensive setup guide for Next.js, PostgreSQL, Prisma, SMS OTP integration, and deployment',
  englishLabel: 'DEVELOPER MANUAL',
  metaLines: [
    'Tech Stack: Next.js 16  •  TypeScript  •  PostgreSQL  •  Prisma  •  Tailwind CSS 4  •  shadcn/ui',
    'Version: 1.0',
    'Date: 2026',
  ],
  footerLeft: 'Daraz Clone Project',
  footerRight: 'Confidential — Developer Use',
  palette: {
    bg: c(P.surface),
    titleColor: c(P.primary),
    subtitleColor: c(P.secondary),
    metaColor: c(P.secondary),
    accent: c(P.accent),
    footerColor: c(P.secondary),
  },
}

const body1 = [
  // ---- Chapter 1: Project Overview ----
  h1('1. Project Overview'),
  body('This manual walks you through setting up the Daraz-style e-commerce application from scratch — installing dependencies, configuring the database (with focus on PostgreSQL), wiring up SMS OTP providers, and seeding demo data so you can start development immediately. Every code snippet is copy-paste ready.'),

  h2('1.1 What Is Being Built'),
  body('The application is a full-stack e-commerce marketplace inspired by daraz.com.bd. It supports three user roles (Admin, Retailer, Customer), phone-based authentication with SMS OTP verification, product catalog with categories and flash sales, shopping cart, checkout with multiple payment methods (Cash on Delivery, bKash, Nagad, Card), role-based dashboards, and a one-click demo-data seeder. The UI is built with a sky-blue theme matching the Daraz visual language.'),

  h2('1.2 Tech Stack'),
  simpleTable(
    ['Layer', 'Technology', 'Why'],
    [
      ['Frontend framework', 'Next.js 16 (App Router)', 'Server-rendered React with hybrid RSC/client components'],
      ['Language', 'TypeScript 5', 'Type safety across the entire stack'],
      ['Styling', 'Tailwind CSS 4 + shadcn/ui', 'Utility-first CSS with accessible component primitives'],
      ['Database ORM', 'Prisma 6', 'Type-safe database access with migrations'],
      ['Database', 'PostgreSQL (prod) / SQLite (dev)', 'Configurable via a single env var — switch any time'],
      ['Authentication', 'JWT sessions (jose) + bcryptjs', 'Cookie-based sessions, no NextAuth complexity'],
      ['State management', 'Zustand', 'Lightweight client-side store for SPA-like view routing'],
      ['Server state', 'TanStack Query (optional)', 'Used in some views for cached data fetching'],
      ['Forms', 'React Hook Form + Zod', 'Type-safe form validation'],
      ['Notifications', 'Sonner', 'Toast notifications with auto-dismiss'],
      ['SMS OTP providers', 'Twilio, Vonage, SSL COMPUZ, REVE, Metech', 'Pluggable abstraction; demo mode for development'],
      ['Icons', 'lucide-react', 'Consistent icon set across the app'],
      ['Charts', 'Recharts', 'Used in admin dashboard for stats'],
    ]
  ),

  h2('1.3 Folder Structure'),
  body('The project follows the standard Next.js App Router layout. Here is the top-level structure with the role of each directory.'),
  code([
    'my-project/',
    '|-- prisma/',
    '|   |-- schema.prisma          # Database models (User, Product, Order, OtpCode, etc.)',
    '|-- src/',
    '|   |-- app/',
    '|   |   |-- page.tsx            # Single-page app entry, renders all views via Zustand store',
    '|   |   |-- layout.tsx          # Root layout with Toaster + metadata',
    '|   |   |-- api/                # Backend API routes (auth, products, cart, orders, payment, ...)',
    '|   |   |-- globals.css         # Tailwind + theme tokens',
    '|   |-- components/',
    '|   |   |-- ui/                 # shadcn/ui primitives (button, card, dialog, etc.)',
    '|   |   |-- ecommerce/          # Header, Footer, ProductCard, AuthModal',
    '|   |   |-- views/              # HomeView, ProductDetailView, CartView, CheckoutView, DashboardView, ...',
    '|   |-- lib/',
    '|   |   |-- db.ts               # Prisma client singleton',
    '|   |   |-- auth.ts             # JWT session helpers (hash, createToken, getSession)',
    '|   |   |-- otp.ts              # OTP generation, sending, verification',
    '|   |   |-- sms.ts              # SMS provider abstraction (Twilio/Vonage/SSL COMPUZ/REVE/Metech)',
    '|   |   |-- store.ts            # Zustand store (view routing, user, cart)',
    '|   |   |-- format.ts           # BDT currency formatting, discount %',
    '|   |   |-- utils.ts            # shadcn/ui cn() helper',
    '|   |-- hooks/                  # use-toast, use-mobile',
    '|-- public/                     # Static assets (logo, robots.txt)',
    '|-- .env                         # Your local env (DO NOT commit)',
    '|-- .env.example                 # Template — copy and fill in',
    '|-- package.json',
    '|-- tsconfig.json',
    '|-- tailwind.config.ts',
  ]),

  // ---- Chapter 2: Prerequisites & Installation ----
  h1('2. Prerequisites & Installation'),

  h2('2.1 System Requirements'),
  bullet('Node.js 20 LTS or newer (Node 22+ recommended)'),
  bullet('Bun 1.0+ (used as the package manager — installs in seconds)'),
  bullet('PostgreSQL 14+ for production (or a managed Postgres: Neon, Supabase, Railway)'),
  bullet('Git for cloning and version control'),
  bullet('A code editor with TypeScript support (VS Code recommended with the Prisma extension for schema highlighting)'),

  h2('2.2 Install Bun'),
  body('Bun is the recommended package manager — it is dramatically faster than npm/yarn and is the runner used throughout this manual.'),
  code([
    '# Linux / macOS / WSL',
    'curl -fsSL https://bun.sh/install | bash',
    '',
    '# Verify',
    'bun --version   # should print 1.x.x',
  ]),

  h2('2.3 Install PostgreSQL'),
  body('You have three options. Pick whichever fits your situation:'),

  h3('Option A — Local PostgreSQL (recommended for offline development)'),
  numbered('Install PostgreSQL on your machine. On Ubuntu/Debian: sudo apt install postgresql postgresql-contrib. On macOS with Homebrew: brew install postgresql@16.', 'num1'),
  numbered('Start the service: sudo systemctl start postgresql (Linux) or brew services start postgresql (macOS).', 'num1'),
  numbered('Create a database and user: open the psql shell as the postgres superuser and run the commands below.', 'num1'),
  code([
    'sudo -u postgres psql',
    '',
    '-- Inside the psql shell:',
    "CREATE USER daraz_user WITH PASSWORD 'change_me_in_prod';",
    'CREATE DATABASE daraz OWNER daraz_user;',
    'GRANT ALL PRIVILEGES ON DATABASE daraz TO daraz_user;',
    '\\q',
  ]),
  numbered('Your local connection string becomes: postgresql://daraz_user:change_me_in_prod@localhost:5432/daraz?schema=public', 'num1'),

  h3('Option B — Neon (free managed PostgreSQL, fastest setup)'),
  numbered('Go to https://neon.tech and sign up with GitHub — free tier gives 0.5 GB which is plenty for development.', 'num2'),
  numbered('Create a new project, copy the connection string. It looks like postgresql://daraz:password@ep-xxx-pooler.region.aws.neon.tech/daraz?schema=public&sslmode=require.', 'num2'),
  numbered('Note the sslmode=require — Neon requires SSL. The Prisma client handles this automatically when the URL contains it.', 'num2'),

  h3('Option C — Supabase (free, with extra features)'),
  numbered('Go to https://supabase.com and create a new project.', 'num3'),
  numbered('In the project dashboard, go to Project Settings → Database → Connection string → URI. Copy the postgresql://... string.', 'num3'),
  numbered('Replace [YOUR-PASSWORD] with the database password you set during project creation.', 'num3'),

  callout('Tip — connection string format', 'All three options produce a connection string in the same format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public. Paste it into your .env file as DATABASE_URL. Prisma accepts the connection string as-is, no extra parsing needed.', 'info'),

  h2('2.4 Get the Source Code'),
  body('If you are reading this manual you likely already have the source. If you are starting fresh, clone the project repository:'),
  code([
    'git clone <your-repo-url> my-project',
    'cd my-project',
  ]),

  h2('2.5 Install Dependencies'),
  code([
    'cd my-project',
    'bun install',
  ]),
  body('This installs everything listed in package.json — Next.js, React, Prisma client, all shadcn/ui dependencies, Zustand, jose, bcryptjs, and so on. The install typically completes in under 10 seconds thanks to Bun.'),

  // ---- Chapter 3: Environment Configuration ----
  h1('3. Environment Configuration'),

  h2('3.1 The .env File'),
  body('The application reads configuration from a .env file at the project root. A .env.example template is shipped with the project — copy it and fill in your real values.'),
  code([
    'cp .env.example .env',
  ]),
  body('Then open .env in your editor and configure the variables described below.'),

  h2('3.2 Database Variables'),
  simpleTable(
    ['Variable', 'Required', 'Example / Description'],
    [
      ['DATABASE_PROVIDER', 'Yes', 'sqlite for local dev, postgresql for production'],
      ['DATABASE_URL', 'Yes', 'See connection string format in chapter 2'],
      ['JWT_SECRET', 'Yes', 'A long random hex string — use openssl rand -hex 32 to generate'],
    ]
  ),

  h3('Example — Local SQLite (default, zero-config)'),
  code([
    'DATABASE_PROVIDER=sqlite',
    'DATABASE_URL=file:/home/z/my-project/db/custom.db',
  ]),

  h3('Example — Local PostgreSQL'),
  code([
    'DATABASE_PROVIDER=postgresql',
    'DATABASE_URL=postgresql://daraz_user:change_me_in_prod@localhost:5432/daraz?schema=public',
  ]),

  h3('Example — Neon (managed PostgreSQL, free tier)'),
  code([
    'DATABASE_PROVIDER=postgresql',
    'DATABASE_URL=postgresql://daraz:password@ep-cool-name-pooler.ap-southeast-1.aws.neon.tech/daraz?schema=public&sslmode=require',
  ]),

  h3('Example — Supabase'),
  code([
    'DATABASE_PROVIDER=postgresql',
    'DATABASE_URL=postgresql://postgres.xxxxx:your_password@db.xxxxxx.supabase.co:5432/postgres',
  ]),

  h2('3.3 JWT Secret'),
  body('The JWT_SECRET is used to sign and verify session cookies. Never reuse a secret across environments, and never commit a real secret to git. Generate a strong random one:'),
  code([
    'openssl rand -hex 32',
    '# Output looks like: 8a3f1c9b2d4e6f8a0c2b4d6e8f0a2c4e6b8d0a2c4e6f8a0b2d4c6e8f0a2c4e6',
  ]),
  body('Paste the output as the value of JWT_SECRET in your .env file.'),

  h2('3.4 SMS OTP Variables'),
  body('SMS_PROVIDER controls which SMS gateway is used. Set it to "demo" for development (the OTP code is returned in the API response and shown in a toast notification — no real SMS is sent). Set it to one of the supported providers for production. Each provider needs its own set of credentials.'),
  simpleTable(
    ['SMS_PROVIDER', 'Required env vars', 'Notes'],
    [
      ['demo', '(none)', 'Default. OTP shown in toast. Use this for development.'],
      ['twilio', 'TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_FROM', 'International, easy to set up. Buy a Twilio number (~$1/mo).'],
      ['vonage', 'VONAGE_API_KEY, VONAGE_API_SECRET, VONAGE_FROM', 'International. Vonage account required.'],
      ['sslcompuz', 'SSL_COMPUZ_API_KEY, SSL_COMPUZ_SID, SSL_COMPUZ_FROM', 'Bangladesh bulk SMS. Popular for BD e-commerce.'],
      ['reve', 'REVE_API_KEY, REVE_SENDER_ID', 'Bangladesh SMS provider.'],
      ['metech', 'METECH_API_KEY, METECH_SENDER_ID', 'Bangladesh SMS provider.'],
    ]
  ),

  // ---- Chapter 4: Database Setup & Migrations ----
  h1('4. Database Setup & Migrations'),

  h2('4.1 Switch from SQLite to PostgreSQL'),
  body('The schema is provider-agnostic. To switch from SQLite (default) to PostgreSQL:'),
  numbered('Provision a PostgreSQL database (see chapter 2.3 for options).', 'num4'),
  numbered('Open your .env file.', 'num4'),
  numbered('Change DATABASE_PROVIDER from sqlite to postgresql.', 'num4'),
  numbered('Change DATABASE_URL to your PostgreSQL connection string (see chapter 3.2).', 'num4'),
  numbered('Run the schema push command (this creates all tables in the new database):', 'num4'),
  code([
    'bun run db:push',
  ]),
  numbered('Seed demo data so the app is not empty:', 'num4'),
  code([
    '# Start the dev server first (next chapter), then:',
    'curl -X POST http://localhost:3000/api/seed',
  ]),

  callout('Important — data is not migrated automatically', 'bun run db:push creates the schema in the new database but does NOT copy data from SQLite. To re-populate, call the /api/seed endpoint after switching. If you have real user data you need to preserve, dump the SQLite database to SQL and re-import into Postgres (out of scope for this manual — see the Prisma migrate documentation for production data workflows).', 'warn'),

  h2('4.2 Database Schema Overview'),
  body('The schema defines 8 models. The diagram below shows their relationships.'),
  code([
    'User        — phone (unique, required), email (optional, unique), password, role, phoneVerified',
    'Category    — name, slug, icon, parentId (self-reference for sub-categories)',
    'Product     — name, slug, price, comparePrice, images (JSON array), stock, rating, isFlashSale,',
    '              isFeatured, brand, categoryId, retailerId',
    'CartItem    — userId, productId, quantity',
    'Order       — userId, orderNumber, total, subtotal, shipping, status, paymentStatus,',
    '              paymentMethod, paymentRef, address, phone, recipientName',
    'OrderItem   — orderId, productId, name (snapshot), price (snapshot), image (snapshot), quantity',
    'Review      — productId, userId, rating, comment',
    'Wishlist    — userId, productId (unique pair)',
    'OtpCode     — phone, code, purpose, expiresAt, consumed (no FK to User — registration OTPs',
    '              are created before the user exists)',
  ]),

  h2('4.3 Useful Prisma Commands'),
  simpleTable(
    ['Command', 'What it does'],
    [
      ['bun run db:push', 'Push current schema to DB (creates/updates tables). Fast, no migration files. Use in development.'],
      ['bun run db:generate', 'Regenerate the Prisma Client after schema changes (usually auto-run by db:push).'],
      ['bun run db:migrate', 'Create a migration file in prisma/migrations/ and apply it. Use in production.'],
      ['bun run db:reset', 'Drop all data and re-run all migrations. DESTRUCTIVE — dev only.'],
    ]
  ),

  h2('4.4 Inspecting the Database'),
  body('For local PostgreSQL, the easiest way to inspect tables is via psql:'),
  code([
    'psql postgresql://daraz_user:change_me_in_prod@localhost:5432/daraz',
    '',
    '-- Inside psql:',
    '\\dt                          # list all tables',
    'SELECT phone, name, role FROM "User";',
    'SELECT COUNT(*) FROM "Product";',
  ]),
  body('For hosted PostgreSQL (Neon, Supabase), the dashboard provides a SQL editor with the same capability. Prisma Studio is also useful — start it with bunx prisma studio and it opens a web UI for browsing and editing rows.'),

  // ---- Chapter 5: SMS OTP Integration ----
  h1('5. SMS OTP Integration'),

  h2('5.1 How OTP Works in This App'),
  body('The OTP flow has three steps: generate, dispatch via SMS, verify. The user enters their phone number, the backend creates an OtpCode row with a 6-digit code, sends it via the configured SMS provider, and the user types the code back to verify. After successful verification, the OTP is marked consumed so it cannot be reused. OTPs expire 5 minutes after creation. There is a 60-second cooldown between OTP sends to the same phone number to prevent abuse.'),

  h2('5.2 The SMS Provider Abstraction'),
  body('All SMS dispatch goes through a single file: src/lib/sms.ts. The function sendSms(to, text) reads SMS_PROVIDER from env and routes to the appropriate provider implementation. To add a new provider, add a new case in the switch statement and a new function sendViaX().'),

  h2('5.3 Switching Providers'),
  body('You switch providers by changing ONE environment variable. No code changes needed.'),

  h3('For development — demo mode (no real SMS, OTP shown in toast)'),
  code([
    '# .env',
    'SMS_PROVIDER=demo',
    '# No other SMS vars needed',
  ]),
  body('In demo mode, the /api/auth/send-otp response includes the OTP code in the JSON, and the frontend shows a toast like "OTP sent! Demo code: 422133". This is great for local development where you do not want to spend real money sending SMS to yourself.'),

  h3('For production — Twilio (international)'),
  body('Step 1 — Sign up at https://www.twilio.com and verify your account. Step 2 — Buy a Twilio phone number (about $1/month, plus per-SMS fees ~$0.0079 to Bangladesh). Step 3 — Copy your Account SID and Auth Token from the Twilio console dashboard. Step 4 — Add them to your .env:'),
  code([
    '# .env',
    'SMS_PROVIDER=twilio',
    'TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    'TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    'TWILIO_PHONE_FROM=+1XXXXXXXXXX      # your purchased Twilio number, E.164 format',
  ]),

  h3('For production — Vonage (international)'),
  body('Sign up at https://www.vonage.com, get an API key and secret from the dashboard. Vonage does not require a dedicated sender number — you set a sender alphanumeric ID.'),
  code([
    '# .env',
    'SMS_PROVIDER=vonage',
    'VONAGE_API_KEY=xxxxxxxx',
    'VONAGE_API_SECRET=xxxxxxxx',
    'VONAGE_FROM=Daraz       # alphanumeric sender ID (max 11 chars)',
  ]),

  h3('For production in Bangladesh — SSL COMPUZ'),
  body('SSL COMPUZ is the most popular bulk SMS provider in Bangladesh. Step 1 — Sign up at https://www.sslcompuz.com and purchase an SMS package (per-SMS rates around ৳0.30-0.50 for bulk). Step 2 — Get your API key and Sender ID (SID) from the dashboard. Step 3 — Configure:'),
  code([
    '# .env',
    'SMS_PROVIDER=sslcompuz',
    'SSL_COMPUZ_API_KEY=xxxxxxxx',
    'SSL_COMPUZ_SID=xxxxxxxx           # your sender ID, e.g. DarazBD',
    'SSL_COMPUZ_FROM=DarazBD',
  ]),
  body('Note: the exact API endpoint URL and payload shape varies slightly across SSL COMPUZ product tiers (Bulk SMS Pro, Mask SMS, etc.). Confirm with your SSL COMPUZ account manager and update the sendViaSslCompuz function in src/lib/sms.ts if needed.'),

  h3('For production in Bangladesh — REVE SMS'),
  code([
    '# .env',
    'SMS_PROVIDER=reve',
    'REVE_API_KEY=xxxxxxxx',
    'REVE_SENDER_ID=Daraz',
  ]),

  h3('For production in Bangladesh — Metech SMS'),
  code([
    '# .env',
    'SMS_PROVIDER=metech',
    'METECH_API_KEY=xxxxxxxx',
    'METECH_SENDER_ID=Daraz',
  ]),

  h2('5.4 Adding a New SMS Provider'),
  body('If you want to use a provider not yet supported (e.g., Banglalink, Grameenphone, a custom gateway), follow these steps:'),
  numbered('Add a new case in the sendSms() switch in src/lib/sms.ts: case "myprovider": return sendViaMyProvider(to, text);', 'num5'),
  numbered('Implement the sendViaMyProvider() function following the same pattern as the others — read env vars, normalize the phone to E.164, make an HTTP request to the provider API, return { ok: true } or { ok: false, error: ... }.', 'num5'),
  numbered('Add the new env vars to .env.example and document them in this manual.', 'num5'),
  numbered('Set SMS_PROVIDER=myprovider in .env and restart the dev server.', 'num5'),

  h2('5.5 Testing the OTP Flow'),
  body('After configuring your provider, test the full flow with curl:'),
  code([
    '# 1. Send an OTP for registration',
    'curl -X POST http://localhost:3000/api/auth/send-otp \\',
    '  -H "Content-Type: application/json" \\',
    '  -d \'{"phone":"01712345678","purpose":"REGISTER"}\'',
    '',
    '# 2. Verify the OTP (replace 123456 with the actual code you received on your phone)',
    'curl -X POST http://localhost:3000/api/auth/verify-otp \\',
    '  -H "Content-Type: application/json" \\',
    '  -d \'{"phone":"01712345678","code":"123456","purpose":"REGISTER"}\'',
    '',
    '# 3. Forgot password — sends OTP to the phone associated with the account',
    'curl -X POST http://localhost:3000/api/auth/forgot-password \\',
    '  -H "Content-Type: application/json" \\',
    '  -d \'{"phoneOrEmail":"customer@daraz.local"}\'',
  ]),
  body('In production mode, the response will NOT include the code — you must check the actual phone for the SMS. In demo mode, the code is returned in the JSON response and shown via a toast notification in the UI.'),

  h2('5.6 SMS Message Format'),
  body('The SMS body sent by the application looks like this:'),
  code('Daraz Clone: Your verification code is 422133. It expires in 5 minutes. Do not share this code with anyone.'),
  body('To customize the message, edit the smsBody template in src/lib/otp.ts (the sendOtp function). Keep the message under 160 characters to fit in a single SMS segment.'),

  // ---- Chapter 6: Running the App ----
  h1('6. Running the App'),

  h2('6.1 Start the Dev Server'),
  code([
    'bun run dev',
  ]),
  body('This starts the Next.js dev server on port 3000 with Turbopack for fast hot-module replacement. Open http://localhost:3000 in your browser. The first compile takes a few seconds; subsequent page loads are instant.'),

  h2('6.2 Seed Demo Data'),
  body('On first load, the app shows an empty-state prompt with a "Seed Demo Data" button. Click it to populate the database with 4 demo users (admin, retailer, customer), 8 categories, and 26 sample products. Alternatively, call the seed API directly:'),
  code([
    'curl -X POST http://localhost:3000/api/seed',
  ]),
  body('After seeding, the home page populates with the hero banner, categories grid, flash sale products, and featured products.'),

  h2('6.3 Demo Accounts'),
  body('After seeding, you can log in with any of these accounts. The Login dialog has demo-account buttons that auto-fill the form.'),
  simpleTable(
    ['Role', 'Phone (login)', 'Email (also login)', 'Password'],
    [
      ['Admin', '8801700000001', 'admin@daraz.local', 'admin123'],
      ['Retailer (Tech Bazar)', '8801700000002', 'retailer@daraz.local', 'retailer123'],
      ['Retailer (Fashion Hub)', '8801700000003', 'fashion@daraz.local', 'retailer123'],
      ['Customer', '8801700000004', 'customer@daraz.local', 'customer123'],
    ]
  ),
  body('You can enter the phone number with or without the +88 prefix — the backend normalizes the input. Both "8801700000004" and "+8801700000004" log you in as the customer.'),

  h2('6.4 Lint & Type-check'),
  body('Before pushing, always run lint to catch issues early:'),
  code([
    'bun run lint',
  ]),
  body('This uses ESLint with the Next.js plugin. Common rules: no unused imports, React hooks dependency arrays, no any types, image alt text required. The codebase should always lint clean.'),

  h2('6.5 Building for Production'),
  body('When you are ready to deploy, build the standalone bundle:'),
  code([
    'bun run build',
  ]),
  body('This creates a .next/standalone/ directory with a self-contained Node server (no node_modules needed on the target machine beyond what is copied). To start the production server:'),
  code([
    'bun run start',
  ]),

  // ---- Chapter 7: API Reference (compact) ----
  h1('7. API Reference (Compact)'),
  body('All endpoints are server-side API routes under src/app/api/. They accept and return JSON. Authenticated endpoints read the JWT session cookie set by /api/auth/login.'),
  simpleTable(
    ['Method', 'Endpoint', 'Description', 'Auth'],
    [
      ['POST', '/api/auth/register', 'Register with phone + OTP-verified + optional email', 'Public'],
      ['POST', '/api/auth/login', 'Login with phone OR email + password', 'Public'],
      ['POST', '/api/auth/logout', 'Clear session cookie', 'Public'],
      ['GET', '/api/auth/me', 'Get current user from session cookie', 'Public'],
      ['POST', '/api/auth/send-otp', 'Send OTP for REGISTER/RESET_PASSWORD/LOGIN', 'Public'],
      ['POST', '/api/auth/verify-otp', 'Verify an OTP code', 'Public'],
      ['POST', '/api/auth/forgot-password', 'Send reset OTP to user phone', 'Public'],
      ['POST', '/api/auth/reset-password', 'Reset password with verified OTP', 'Public'],
      ['GET/POST', '/api/products', 'List products / create new product', 'Public / RETAILER or ADMIN'],
      ['GET/PUT/DELETE', '/api/products/[id]', 'Get/update/delete one product', 'Public / owner or ADMIN'],
      ['GET/POST', '/api/categories', 'List/create categories', 'Public / ADMIN'],
      ['GET/POST/PUT/DELETE', '/api/cart', 'Manage current user cart', 'Customer'],
      ['GET/POST/PUT', '/api/orders', 'List/create/update orders', 'Auth / ADMIN to update'],
      ['GET/POST', '/api/wishlist', 'List/toggle wishlist items', 'Customer'],
      ['POST', '/api/payment', 'Simulated payment gateway (COD/bKash/Nagad/Card)', 'Public'],
      ['GET/PUT', '/api/admin/users', 'List all users / change user role', 'ADMIN only'],
      ['POST', '/api/seed', 'Seed demo data (idempotent)', 'Public'],
    ]
  ),

  // ---- Chapter 8: Troubleshooting ----
  h1('8. Troubleshooting'),

  h2('8.1 Database Connection Refused'),
  body('Symptom: bun run db:push fails with "Connection refused" or "ECONNREFUSED". Cause: PostgreSQL is not running, or your DATABASE_URL points to the wrong host. Fix: verify PostgreSQL is running (sudo systemctl status postgresql on Linux), verify the connection string format (postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public), and ensure the user has GRANT privileges on the database.'),

  h2('8.2 Prisma "Unknown argument" Errors After Schema Changes'),
  body('Symptom: After adding a new field to the Prisma schema, the API returns 500 with "Unknown argument phoneVerified" (or similar). Cause: the runtime Prisma client is cached. Fix: stop the dev server, run bun run db:generate to regenerate the client, then restart the dev server. The schema and the client MUST always be in sync.'),

  h2('8.3 OTP Not Received on Real Phone'),
  body('Symptom: In production mode (SMS_PROVIDER=twilio etc.), the user clicks "Send OTP" but no SMS arrives. Diagnostic steps: (1) Check the dev.log for "SMS dispatch failed" messages. (2) Verify all required env vars for the chosen provider are set. (3) Test the provider API directly with curl using the same credentials. (4) Check that the destination phone number is in E.164 format — the app normalizes automatically but some providers reject numbers from countries they do not support. (5) For Twilio trial accounts, you can only send SMS to verified phone numbers — upgrade the account for production.'),

  h2('8.4 "Phone number must be verified with OTP" on Register'),
  body('Symptom: The /api/auth/register endpoint returns this error. Cause: The frontend did not first call /api/auth/send-otp and /api/auth/verify-otp. The register endpoint requires otpVerified: true in the body AND a recently-consumed OTP record in the database for the same phone + REGISTER purpose. Fix: ensure the frontend follows the two-step flow — Step 1: fill details, click "Send OTP". Step 2: enter the code, click "Verify & Create Account" (this calls verify-otp first, then register).'),

  h2('8.5 Login Fails with "Account not found"'),
  body('Symptom: A user enters their phone number but login fails. Cause: The phone was stored in normalized form (without + or spaces) but the user typed it differently. The login endpoint normalizes the input, so "+880 1711-111111" becomes "880171111111" which should match. If it still fails, check the actual stored phone in the database: SELECT phone, name FROM "User"; — the user may have registered with a different phone number than they remember.'),

  h2('8.6 SMS_PROVIDER Demo Mode in Production'),
  body('If you forget to change SMS_PROVIDER from "demo" to a real provider in production, users will see OTPs in toast notifications and the API response — a critical security hole. Always check your .env (or production environment variables) before deploying. A simple sanity check:'),
  code([
    'echo $SMS_PROVIDER',
    '# Should print: twilio, vonage, sslcompuz, reve, or metech — NOT demo',
  ]),

  // ---- Chapter 9: Next Steps ----
  h1('9. Next Steps'),
  body('Once you have the app running locally with PostgreSQL and a real SMS provider, here are the recommended next steps to take it to production:'),

  h2('9.1 Deploy to Production'),
  bullet('Choose a host: Vercel (easiest for Next.js), a VPS (Hetzner, DigitalOcean), or a container platform (Railway, Render).'),
  bullet('Set environment variables in the host dashboard — copy them from your .env, but use the production DATABASE_URL and a fresh JWT_SECRET.'),
  bullet('Run bun run db:push against the production database once to create the schema.'),
  bullet('Run the seed endpoint ONLY if you want demo data in production — otherwise skip it and let real users populate the database.'),

  h2('9.2 Enable HTTPS'),
  body('Bun\'s dev server uses HTTP. For production, always serve over HTTPS. Most hosts (Vercel, Railway, Render) terminate TLS automatically. If you deploy on a VPS, use Caddy or nginx with Let\'s Encrypt.'),

  h2('9.3 Add Rate Limiting'),
  body('The OTP endpoint already has a 60-second cooldown per phone, but you should add IP-based rate limiting too (e.g., 10 OTP requests per hour per IP) to prevent abuse. A simple implementation can use the OtpCode table or an in-memory Map.'),

  h2('9.4 Remove Demo Code'),
  body('Before going live, remove the demo conveniences: the demo-account autofill buttons in the Auth Modal, the code field in the /api/auth/send-otp response (only present in demo mode, but double-check), and the "Demo code: XXX" toast. Search for "isDemo" in the codebase to find all demo-mode branches.'),

  h2('9.5 Monitor SMS Costs'),
  body('SMS providers charge per message. Set up alerts in your SMS provider dashboard to notify you when spending exceeds a threshold. Consider caching successful verifications per phone for a short window (e.g., 24 hours) so users who log out and back in do not need a new OTP every time.'),

  body('With the manual in hand, you should now be able to set up the project on any machine, switch from SQLite to PostgreSQL, plug in any SMS provider, seed demo data, and start developing new features. Good luck!'),
]

// ============================================================================
// NUMBERING CONFIG — for numbered lists (used in step-by-step instructions)
// ============================================================================
const numberingConfig = {
  config: [
    { reference: 'num1', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.START, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    { reference: 'num2', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.START, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    { reference: 'num3', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.START, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    { reference: 'num4', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.START, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    { reference: 'num5', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.START, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    { reference: 'default-numbering', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.START, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
  ],
}

// ============================================================================
// DOCUMENT ASSEMBLY
// ============================================================================
const doc = new Document({
  creator: 'Daraz Clone Developer Manual',
  title: 'Daraz Clone — Developer Setup & Installation Manual',
  description: 'Comprehensive setup guide for Next.js, PostgreSQL, Prisma, SMS OTP integration',
  numbering: numberingConfig,
  styles: {
    default: {
      document: {
        run: { font: { ascii: 'Calibri' }, size: 22, color: c(P.body) },
        paragraph: { spacing: { line: 312 } },
      },
    },
  },
  sections: [
    // Cover section
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 0, bottom: 0, left: 0, right: 0 },
        },
      },
      children: buildCoverR1(coverConfig),
    },
    // Body section
    {
      properties: {
        page: {
          margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 },
          pageNumbers: { start: 1 },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({
              text: 'Daraz Clone — Developer Manual',
              size: 18, color: c(P.secondary), font: { ascii: 'Calibri' },
            })],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'Page ', size: 18, color: c(P.secondary), font: { ascii: 'Calibri' } }),
              new TextRun({ children: [PageNumber.CURRENT], size: 18, color: c(P.secondary), font: { ascii: 'Calibri' } }),
              new TextRun({ text: ' of ', size: 18, color: c(P.secondary), font: { ascii: 'Calibri' } }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: c(P.secondary), font: { ascii: 'Calibri' } }),
            ],
          })],
        }),
      },
      children: body1,
    },
  ],
})

const OUT = '/home/z/my-project/download/Daraz-Clone-Developer-Manual.docx'
Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(OUT, buf)
  console.log(`✓ Manual generated: ${OUT}`)
  console.log(`  Size: ${(buf.length / 1024).toFixed(1)} KB`)
})
