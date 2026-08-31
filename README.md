# 🚀 SkillPilot

**Know what you know. Discover what you need to learn.**

SkillPilot is an adaptive, AI-powered technical assessment and skill-diagnostic platform built with **Next.js 14**, **TypeScript**, **PostgreSQL**, **Prisma**, and **Groq / Featherless AI**. 

Unlike traditional platforms reliant on static, pre-written question banks, SkillPilot dynamically plans concept blueprints, fetches or generates targeted questions, evaluates answers in real time, and synthesizes personalized skill profiles on demand.

---

## ✨ Key Features

- ⚡ **Dynamic Concept Blueprinting**: AI automatically breaks down any technical subject (Python, JS, SQL, Git, Docker, Linux, etc.) into prerequisite trees and targeted concept blueprints.
- 🏎️ **Multi-Tier AI Inference Router**:
  - **Groq API Tier**: Ultra-low-latency question generation and response classification.
  - **Featherless AI Tier**: Deep reasoning, prerequisite diagnostics, and holistic report generation.
  - **Structured Validation**: Zod-validated response enforcement with automatic retries and JSON fallback extractors.
- 🧩 **Hybrid Question Supply Chain**: Real-time integration with **QuizAPI.io** using random offsets to guarantee question freshness, with automatic AI top-up fallback when needed.
- 📈 **Adaptive Bayesian Skill Estimation**: Real-time per-concept proficiency tracking ($0.0 \rightarrow 1.0$), state classification (`STRONG`, `DEVELOPING`, `WEAK`, `UNCERTAIN`), and difficulty ceiling estimation.
- 🕸️ **Interactive Skill Graph**: Prerequisite trees and mastery visualization powered by **ReactFlow** (`@xyflow/react`) and **Recharts**.
- 💬 **Context-Aware AI Tutor**: Embedded subject tutor chat directly on the dashboard to help learners study weak areas immediately.
- ⚡ **Non-Blocking Architecture**: Instant string-match response evaluation with asynchronous background analytics writes for sub-100ms UI responsiveness.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router & Server Actions)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database & ORM**: [PostgreSQL](https://www.postgresql.org/) via [Prisma ORM](https://www.prisma.io/)
- **AI Inference Providers**:
  - [Groq API](https://groq.com/) (Llama 3.x / GPT-OSS low-latency tier)
  - [Featherless AI](https://featherless.ai/) (Qwen 3.5/3.6, DeepSeek-V4 reasoning tier)
- **Styling & UI**: [Tailwind CSS](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/), [Radix UI](https://www.radix-ui.com/), [Lucide Icons](https://lucide.dev/)
- **Data Visualization**: [ReactFlow](https://reactflow.dev/) (`@xyflow/react`), [Recharts](https://recharts.org/)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/) with Prisma Adapter & Guest cookie fallback

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v18.17.0` or higher
- **Package Manager**: `npm` or `pnpm`
- **PostgreSQL Database**: A running Postgres instance (e.g. [Neon](https://neon.tech/))

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Jeet161/skill-pilot.git
   cd skill-pilot
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   Fill in your PostgreSQL connection string, Groq API key, Featherless API key, and QuizAPI key (see table below).

4. **Initialize Database Schema**:
   ```bash
   npx prisma migrate dev --name init
   ```

5. **Start the Development Server**:
   ```bash
   npm run dev
   ```..

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 👥 Authors & License

Created by **Jeet Dey** and **Kabigyan Deb**.

This project is open-source under the [MIT License](LICENSE).......
..