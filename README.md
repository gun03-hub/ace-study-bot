# ACE Study Bot – AI Test Generator

ACE Study Bot is an AI-powered test generation application that helps students practice smarter by generating questions and assessments based on input topics. The app is built with a modern React + TypeScript stack and integrates external services (AI + Supabase) for scalable functionality.

This is a **frontend-first** project with clean separation of concerns and production-ready tooling.

---

## Tech Stack

* **Frontend:** React, TypeScript, Vite
* **Styling:** Tailwind CSS, PostCSS
* **State Management:** React Context API
* **Backend Services:** Supabase
* **AI Integration:** External LLM APIs
* **Tooling:** ESLint, npm

If you don’t know why each of these is here, learn it before you put this on your resume.

---

## Prerequisites

Make sure you have the following installed:

* **Node.js** (v16+ recommended)
* **npm**

Check:

```bash
node -v
npm -v
```

If this fails, stop and fix your environment first.

---

## Installation

Install dependencies using npm:

```bash
npm install
```

> ⚠️ This project uses **npm**, not bun.
> Do **not** use `bun install` or `bun run`.

---

## Running the Application

Start the development server:

```bash
npm run dev
```

The app will be available at the local URL shown in your terminal (commonly `http://localhost:5173`).

If `dev` doesn’t run, your `package.json` scripts are broken — that’s on you.

---

## Environment Variables

Create a `.env` file in the root directory and add required keys:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_AI_API_KEY=your_ai_api_key
```

* Never commit `.env`
* If your app crashes without these, that’s expected

---

## Project Structure

```text
ACE-STUDY-BOT/
├── public/                # Static assets
├── src/
│   ├── components/        # Reusable UI components
│   ├── contexts/          # Global state providers
│   ├── hooks/             # Custom React hooks
│   ├── integrations/      # AI and external API integrations
│   ├── lib/               # Shared utilities and helpers
│   ├── pages/             # Page-level components
│   ├── test/              # Unit and integration tests
│   ├── types/             # TypeScript type definitions
│   ├── App.tsx            # Root component
│   ├── main.tsx           # Entry point
│   ├── index.css          # Global styles
│   ├── App.css            # App-specific styles
│   └── vite-env.d.ts      # Vite TS environment types
│
├── supabase/              # Supabase configuration
├── .env                   # Environment variables
├── .gitignore
├── index.html             # HTML entry point
├── package.json
├── package-lock.json
├── tailwind.config.ts
├── postcss.config.js
├── eslint.config.js
└── README.md
```

---

## Key Features

* AI-generated tests and questions
* Modular, scalable React architecture
* Type-safe codebase with TypeScript
* Supabase integration for backend services
* Clean separation of UI, logic, and integrations

If you add features, update this list. Stale READMEs are a red flag.

---

## Build for Production

```bash
npm run build
```

This generates an optimized production build.

---

## Common Issues

* **Dependencies fail to install**
  Delete `node_modules` and `package-lock.json`, then retry `npm install`.

* **App runs but shows blank screen**
  Check browser console errors before blaming React.

* **Env errors**
  Missing `.env` values — this is not optional.

---

## License

This project is for educational and demonstration purposes.