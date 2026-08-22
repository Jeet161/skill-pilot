"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Code2, Braces, FileCode2, Coffee, Database, GitBranch,
  Container, Server, Globe, Sparkles, BookOpen, Send, Loader2,
  ExternalLink, ChevronRight, MessageSquare, GraduationCap,
  ArrowLeft, CheckCircle2, RefreshCw, HelpCircle, ArrowRight,
  TrendingUp, Award, Compass, BarChart2, BookMarked, User, Clock, LogOut
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Topic {
  name: string;
  url: string;
  blurb: string;
}

interface Subject {
  id: string;
  icon: React.ComponentType<any>;
  color: string;
  hoverColor: string;
  description: string;
  topics: Topic[];
}

const SUBJECTS: Subject[] = [
  {
    id: "Python",
    icon: Code2,
    color: "from-blue-500/20 to-yellow-500/20 text-yellow-300 border-yellow-500/30",
    hoverColor: "hover:border-yellow-500/40 hover:bg-yellow-500/5",
    description: "Multi-paradigm language known for high readability, simple syntax, and immense ecosystem.",
    topics: [
      { name: "Python Docs", url: "https://docs.python.org/3/", blurb: "The official standard library and language reference manual." },
      { name: "Real Python", url: "https://realpython.com/", blurb: "Hands-on, deep-dive Python tutorials for all skill levels." },
      { name: "freeCodeCamp", url: "https://www.freecodecamp.org/", blurb: "Full-length interactive Python courses and programming certifications." },
      { name: "Programiz", url: "https://www.programiz.com/python-programming", blurb: "Step-by-step interactive Python tutorials with built-in interpreter." },
      { name: "W3Schools", url: "https://www.w3schools.com/python/", blurb: "Simple, example-driven reference guide for core language basics." },
      { name: "GeeksforGeeks", url: "https://www.geeksforgeeks.org/python-programming-language/", blurb: "Comprehensive collections of algorithms, syntax details, and data structures." },
    ]
  },
  {
    id: "JavaScript",
    icon: Braces,
    color: "from-yellow-500/20 to-amber-600/20 text-amber-300 border-amber-500/30",
    hoverColor: "hover:border-amber-500/40 hover:bg-amber-500/5",
    description: "The core programming language powering interactive dynamic experiences across the web.",
    topics: [
      { name: "MDN", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript", blurb: "Mozilla Developer Network - the definitive, authoritative reference for web standards." },
      { name: "JavaScript.info", url: "https://javascript.info/", blurb: "An outstanding, modern tutorial covering language mechanics from basics to advanced." },
      { name: "freeCodeCamp", url: "https://www.freecodecamp.org/", blurb: "Structured, interactive front-end and algorithmic JS certifications." },
      { name: "Eloquent JavaScript", url: "https://eloquentjavascript.net/", blurb: "A classic book exploring programming concepts, browser integration, and Node.js." },
      { name: "W3Schools", url: "https://www.w3schools.com/js/", blurb: "Straightforward, beginner-friendly examples for basic syntax and DOM manipulation." },
      { name: "GeeksforGeeks", url: "https://www.geeksforgeeks.org/javascript/", blurb: "Practical guides, execution contexts, hoisting, prototype chains, and code problems." },
    ]
  },
  {
    id: "TypeScript",
    icon: FileCode2,
    color: "from-blue-500/20 to-indigo-600/20 text-blue-300 border-blue-500/30",
    hoverColor: "hover:border-blue-500/40 hover:bg-blue-500/5",
    description: "A strongly typed superset of JavaScript that compiles down to raw browser-compliant JS.",
    topics: [
      { name: "TypeScript Handbook", url: "https://www.typescriptlang.org/docs/handbook/intro.html", blurb: "The official comprehensive reference to TS features and type-system design." },
      { name: "TypeScript Deep Dive", url: "https://basarat.gitbook.io/typescript/", blurb: "Basarat's highly acclaimed guide to TypeScript compiler mechanics and best practices." },
      { name: "freeCodeCamp", url: "https://www.freecodecamp.org/", blurb: "Introductory and advanced courses on typing structures and React patterns." },
      { name: "W3Schools", url: "https://www.w3schools.com/typescript/", blurb: "Basic guide on compiling, explicit vs implicit typing, and interfaces." },
      { name: "GeeksforGeeks", url: "https://www.geeksforgeeks.org/typescript/", blurb: "Practical examples explaining type-safety, generics, and compiler configurations." },
      { name: "Programiz", url: "https://www.programiz.com/typescript", blurb: "A beginner's interactive guide to writing clean type-safe TypeScript code." },
    ]
  },
  {
    id: "Java",
    icon: Coffee,
    color: "from-red-500/20 to-orange-500/20 text-orange-300 border-orange-500/30",
    hoverColor: "hover:border-orange-500/40 hover:bg-orange-500/5",
    description: "Robust, class-based object-oriented programming language designed for write-once-run-anywhere execution.",
    topics: [
      { name: "Dev.java", url: "https://dev.java/", blurb: "The official portal managed by Oracle for learning Java programming." },
      { name: "Oracle Java Docs", url: "https://docs.oracle.com/en/java/", blurb: "The definitive specification and documentation for Java SE APIs." },
      { name: "OpenJDK", url: "https://openjdk.org/", blurb: "Source documentation for the open-source implementation of the Java SE platform." },
      { name: "Programiz", url: "https://www.programiz.com/java-programming", blurb: "Interactive tutorials detailing collections, OOP concepts, and exceptions." },
      { name: "W3Schools", url: "https://www.w3schools.com/java/", blurb: "Quick reference guide covering classes, methods, and file handling basics." },
      { name: "GeeksforGeeks", url: "https://www.geeksforgeeks.org/java/", blurb: "Vast coverage of multi-threading, concurrency utilities, collections, and algorithms." },
    ]
  },
  {
    id: "SQL",
    icon: Database,
    color: "from-purple-500/20 to-indigo-500/20 text-purple-300 border-purple-500/30",
    hoverColor: "hover:border-purple-500/40 hover:bg-purple-500/5",
    description: "Structured Query Language used to manage relational database management systems and perform query operations.",
    topics: [
      { name: "PostgreSQL Docs", url: "https://www.postgresql.org/docs/", blurb: "Comprehensive standard documentation for the advanced open-source Postgres engine." },
      { name: "MySQL Docs", url: "https://dev.mysql.com/doc/", blurb: "Official manual for MySQL, the most popular open-source relational database." },
      { name: "freeCodeCamp", url: "https://www.freecodecamp.org/", blurb: "Interactive SQL certifications, query building, schema normalization, and database optimization." },
      { name: "W3Schools", url: "https://www.w3schools.com/sql/", blurb: "A classic example-filled cheat sheet for basic SELECTs, JOINs, and CRUD operations." },
      { name: "GeeksforGeeks", url: "https://www.geeksforgeeks.org/sql-tutorial/", blurb: "Deeper analysis on indexing, query planning, normalization, and ACID properties." },
      { name: "Programiz", url: "https://www.programiz.com/sql", blurb: "Interactive sandbox to practice queries directly in the browser." },
    ]
  },
  {
    id: "Git",
    icon: GitBranch,
    color: "from-orange-500/20 to-red-600/20 text-rose-300 border-rose-500/30",
    hoverColor: "hover:border-rose-500/40 hover:bg-rose-500/5",
    description: "Distributed version control system to track changes in source code during software development.",
    topics: [
      { name: "Pro Git", url: "https://git-scm.com/book/en/v2", blurb: "The complete, authoritative book covering Git internals, staging, and collaboration." },
      { name: "Git Docs", url: "https://git-scm.com/doc", blurb: "The official command reference guides and interactive tutorials." },
      { name: "GitHub Docs", url: "https://docs.github.com/en", blurb: "Guide to managing pull requests, repository settings, workflows, and SSH configurations." },
      { name: "Atlassian Git", url: "https://www.atlassian.com/git", blurb: "Beautifully visual interactive guide to branch strategies, rebasing, and workflows." },
      { name: "freeCodeCamp", url: "https://www.freecodecamp.org/", blurb: "Interactive video bootcamps covering CLI git tricks and recovery techniques." },
      { name: "GeeksforGeeks", url: "https://www.geeksforgeeks.org/git-tutorial/", blurb: "Explains head references, detached states, branch comparisons, and merge conflict resolution." },
    ]
  },
  {
    id: "Docker",
    icon: Container,
    color: "from-sky-500/20 to-blue-600/20 text-sky-300 border-sky-500/30",
    hoverColor: "hover:border-sky-500/40 hover:bg-sky-500/5",
    description: "Containerization platform to package applications with their complete runtime dependencies.",
    topics: [
      { name: "Docker Docs", url: "https://docs.docker.com/", blurb: "Official manual detailing Dockerfiles, compose specs, engines, and CLI tools." },
      { name: "Docker Guides", url: "https://docs.docker.com/get-started/", blurb: "Simple starter guides to build your first container and expose ports." },
      { name: "Docker Labs", url: "https://github.com/docker/labs", blurb: "Advanced scenarios on networking, volume management, and security sandboxing." },
      { name: "Red Hat Docs", url: "https://docs.redhat.com/", blurb: "Corporate standards for container development, Podman compatibility, and orchestration." },
      { name: "freeCodeCamp", url: "https://www.freecodecamp.org/", blurb: "Comprehensive crash courses on Dockerfiles, multi-stage builds, and deployment hooks." },
      { name: "GeeksforGeeks", url: "https://www.geeksforgeeks.org/docker-tutorial/", blurb: "Reference material detailing images vs containers, cache layer mechanisms, and volumes." },
    ]
  },
  {
    id: "Linux",
    icon: Server,
    color: "from-green-500/20 to-teal-600/20 text-teal-300 border-teal-500/30",
    hoverColor: "hover:border-teal-500/40 hover:bg-teal-500/5",
    description: "Open-source Unix-like operating system kernel and core command-line utility toolkit.",
    topics: [
      { name: "Linux Documentation", url: "https://docs.kernel.org/", blurb: "Technical reference for the Linux kernel API, drivers, and sub-systems." },
      { name: "Ubuntu Docs", url: "https://help.ubuntu.com/", blurb: "User-friendly tutorials for server administration, package management, and services." },
      { name: "ArchWiki", url: "https://wiki.archlinux.org/", blurb: "The most comprehensive, community-maintained Linux administration wiki on the planet." },
      { name: "GNU Docs", url: "https://www.gnu.org/manual/", blurb: "Manuals for standard utility suites (bash, coreutils, grep, sed, awk)." },
      { name: "Linux Journey", url: "https://linuxjourney.com/", blurb: "An absolute best beginner resource for learning CLI navigation, permissions, and routing." },
      { name: "GeeksforGeeks", url: "https://www.geeksforgeeks.org/linux-tutorials/", blurb: "Guides covering file permissions, environment variables, job scheduling, and network tools." },
    ]
  },
  {
    id: "PHP",
    icon: Globe,
    color: "from-violet-500/20 to-purple-600/20 text-violet-300 border-violet-500/30",
    hoverColor: "hover:border-violet-500/40 hover:bg-violet-500/5",
    description: "Server-side scripting language designed primarily for dynamic web development and templating.",
    topics: [
      { name: "PHP Manual", url: "https://www.php.net/manual/en/", blurb: "The official function reference and OOP reference guide for the runtime environment." },
      { name: "PHP.Watch", url: "https://php.watch/", blurb: "Modern tutorials, performance updates, and RFC feature previews for new releases." },
      { name: "freeCodeCamp", url: "https://www.freecodecamp.org/", blurb: "Video crash courses from backend basics to modern frameworks like Laravel." },
      { name: "Programiz", url: "https://www.programiz.com/php", blurb: "Simple tutorial series with basic explanations for arrays, functions, and server handles." },
      { name: "W3Schools", url: "https://www.w3schools.com/php/", blurb: "Straightforward beginner syntax cheatsheet, covering forms, cookies, and database CRUD." },
      { name: "GeeksforGeeks", url: "https://www.geeksforgeeks.org/php-tutorials/", blurb: "Explains standard arrays, session security, autoloaders, and namespaces." },
    ]
  }
];

type ActiveTab = "dashboard" | "assessments" | "discover" | "chat";

const getLevelTitle = (level: number) => {
  if (level < 5) return "Novice";
  if (level < 10) return "Adept Scholar";
  if (level < 20) return "Code Weaver";
  if (level < 30) return "Synthesizer";
  if (level < 50) return "Architect";
  return "Grandmaster";
};

export default function DashboardPage() {
  const router = useRouter();
  const { data: session } = useSession();
  
  // Navigation Tabs state
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");

  // Read active tab from URL query param on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const tab = urlParams.get("tab");
      if (tab === "dashboard" || tab === "assessments" || tab === "discover" || tab === "chat") {
        setActiveTab(tab as ActiveTab);
      }
    }
  }, []);
  
  // Core selected subject (for study details & chat tutor)
  const [activeSubject, setActiveSubject] = useState<Subject>(SUBJECTS[0]);
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null);

  // Statistics / XP State
  const [sessions, setSessions] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalAnswers: 0,
    correctAnswers: 0,
    xp: 0,
    level: 1,
    xpInLevel: 0,
    xpNextLevel: 1000,
  });
  const [loadingStats, setLoadingStats] = useState(true);
  // Redirect to create assessment page to configure options
  function startTest(subjectId: string) {
    router.push(`/assessment/new?subject=${subjectId}`);
  }

  // AI Chat state
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [chatInput, setChatInput] = useState<string>("");
  const [sendingChat, setSendingChat] = useState<boolean>(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Load progress statistics
  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/progress");
        const data = await res.json();
        if (res.ok) {
          setSessions(data.sessions || []);
          if (data.stats) {
            setStats(data.stats);
          }
        }
      } catch (err) {
        console.error("Failed to load dashboard statistics:", err);
      } finally {
        setLoadingStats(false);
      }
    }
    loadStats();
  }, [activeTab]);

  // Reset chat when subject swaps
  useEffect(() => {
    setChatMessages([
      {
        role: "assistant",
        content: `Hi! I'm your **${activeSubject.id} AI Tutor**. Ask me any question about ${activeSubject.id} syntax, libraries, or architectures!`
      }
    ]);
  }, [activeSubject]);

  // Scroll chat bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, sendingChat]);

  // Trigger suggestion card click
  const askSuggestion = (text: string) => {
    setChatInput(text);
  };

  const handleSendChat = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || sendingChat) return;

    const userMessage = chatInput;
    setChatInput("");
    const updatedMessages = [...chatMessages, { role: "user" as const, content: userMessage }];
    setChatMessages(updatedMessages);
    setSendingChat(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: activeSubject.id,
          topic: activeTopic?.name || activeSubject.id,
          messages: updatedMessages
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setChatMessages(prev => [...prev, { role: "assistant", content: data.response }]);
      } else {
        setChatMessages(prev => [...prev, { role: "assistant", content: `*Tutor experienced an issue: ${data.error}*` }]);
      }
    } catch (err) {
      setChatMessages(prev => [...prev, { role: "assistant", content: `*Connection failed. Please verify the backend.*` }]);
    } finally {
      setSendingChat(false);
    }
  };

  const getSubjectSuggestions = () => {
    switch (activeSubject.id) {
      case "Python":
        return ["What is list comprehension?", "Explain generators vs iterators", "asyncio event loop basics"];
      case "JavaScript":
        return ["Explain closures with an example", "What is prototypical inheritance?", "How does the Promise system work?"];
      case "TypeScript":
        return ["What are Record and Partial?", "Explain generic constraints", "Type assertion vs casting"];
      case "Java":
        return ["How does Java GC work?", "Explain synchronization", "Abstract Class vs Interface"];
      case "SQL":
        return ["What is database indexing?", "Explain Window Functions", "Give a nested query example"];
      default:
        return ["Explain the basics", "Give a code example", "What are common pitfalls?"];
    }
  };

  // Helper to render markdown-like backticks cleanly
  const renderMarkdown = (text: string) => {
    const parts = text.split(/```(\w*)\n?([\s\S]*?)```/g);
    return parts.map((part, i) => {
      if (i % 3 === 0) {
        // Plain text with bold markers
        const subParts = part.split(/\*\*([\s\S]*?)\*\*/g);
        return (
          <span key={i} className="leading-relaxed">
            {subParts.map((sub, idx) => {
              if (idx % 2 === 1) return <strong key={idx} className="font-semibold text-white">{sub}</strong>;
              return sub;
            })}
          </span>
        );
      }
      const code = parts[i + 1];
      if (code !== undefined) {
        return (
          <pre key={i} className="my-3 overflow-x-auto rounded-lg border border-white/10 bg-black/40 p-4 font-mono text-xs text-primary/90">
            <code>{code}</code>
          </pre>
        );
      }
      return null;
    });
  };

  // XP level ring calculation
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const xpPercent = stats.xpNextLevel > 0 ? stats.xpInLevel / stats.xpNextLevel : 0;
  const strokeDashoffset = circumference - xpPercent * circumference;

  return (
    <main className="relative min-h-screen bg-[#080d19] text-white overflow-hidden flex flex-col md:flex-row">
      
      {/* Background gradients */}
      <div className="pointer-events-none fixed inset-0 bg-[#080d19]/40 bg-radial-gradient" />
      <div className="pointer-events-none fixed -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-indigo-500/5 blur-[120px]" />
      <div className="pointer-events-none fixed top-1/3 right-10 h-[400px] w-[400px] rounded-full bg-purple-500/5 blur-[120px]" />

      {/* ── Left Sidebar (Desktop only) ── */}
      <aside className="hidden md:flex flex-col w-64 border-r border-white/5 bg-[#0b1329] p-6 shrink-0 z-20">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 mb-8 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/30">
            <Sparkles className="h-4.5 w-4.5 text-indigo-400" />
          </div>
          <span className="font-mono text-base font-bold tracking-widest text-white uppercase">
            SkillPilot
          </span>
        </Link>

        {/* Sidebar Nav links */}
        <nav className="space-y-1.5 flex-1">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "dashboard"
                ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                : "text-muted hover:text-white hover:bg-white/[0.02] border border-transparent"
            }`}
          >
            <Compass className="h-4 w-4" />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => setActiveTab("assessments")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "assessments"
                ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                : "text-muted hover:text-white hover:bg-white/[0.02] border border-transparent"
            }`}
          >
            <BookMarked className="h-4 w-4" />
            <span>My Quizzes</span>
          </button>
          <button
            onClick={() => setActiveTab("discover")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "discover"
                ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                : "text-muted hover:text-white hover:bg-white/[0.02] border border-transparent"
            }`}
          >
            <Globe className="h-4 w-4" />
            <span>Discover</span>
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "chat"
                ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                : "text-muted hover:text-white hover:bg-white/[0.02] border border-transparent"
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>AI Tutor Chat</span>
          </button>
        </nav>

        {/* User profile & Sign Out */}
        {session?.user && (
          <div className="mt-auto border-t border-white/5 pt-4 space-y-3">
            <div className="flex items-center gap-3 px-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
                <User className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">
                  {session.user.name || session.user.email}
                </p>
                <p className="text-[10px] text-muted truncate">
                  {session.user.email}
                </p>
              </div>
            </div>
            <button
              id="btn-signout"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-all border border-transparent"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        )}

      </aside>

      {/* ── Main Container ── */}
      <div className="flex-1 flex flex-col min-w-0 z-10">
        
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between px-6 py-4 bg-[#0b1329] border-b border-white/5">
          <span className="font-mono text-sm font-bold tracking-widest text-white uppercase">
            SkillPilot
          </span>
          <div className="flex items-center gap-3">
            <GraduationCap className="h-5 w-5 text-indigo-400" />
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto px-6 py-8 md:p-10 pb-24 md:pb-10">
          
          {/* TAB 1: DASHBOARD */}
          {activeTab === "dashboard" && (
            <div className="space-y-8 max-w-5xl">
              
              {/* Header Greeting & Circular Progress */}
              <div className="relative rounded-2xl border border-white/5 bg-gradient-to-br from-[#0c1630] to-[#080e1e] p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden">
                <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 h-48 w-48 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />
                
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                    Welcome back, Scholar.
                  </h1>
                  <p className="mt-1 text-sm text-muted max-w-lg">
                    Your mind is sharp. Ready to conquer today&apos;s technical challenges?
                  </p>
                  
                  {/* Horizontal Progress bar for Mobile */}
                  <div className="block md:hidden mt-4">
                    <div className="flex items-center justify-between text-xs font-mono text-muted mb-1">
                      <span>Level {stats.level} — {getLevelTitle(stats.level)}</span>
                      <span>{stats.xpInLevel}/{stats.xpNextLevel} XP</span>
                    </div>
                    <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${xpPercent * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Circular Level Ring for Desktop */}
                <div className="hidden md:flex items-center gap-4 bg-black/20 border border-white/5 rounded-xl px-5 py-3.5">
                  <div className="relative h-[76px] w-[76px] flex items-center justify-center shrink-0">
                    <svg className="absolute transform -rotate-90" width="76" height="76">
                      <circle cx="38" cy="38" r={radius} stroke="rgba(255,255,255,0.03)" strokeWidth="4" fill="transparent" />
                      <circle
                        cx="38"
                        cy="38"
                        r={radius}
                        stroke="#6366f1"
                        strokeWidth="4"
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-all duration-700 ease-out"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="text-lg font-bold font-mono text-white relative z-10">{stats.level}</span>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">Level {stats.level} — {getLevelTitle(stats.level)}</h3>
                    <p className="text-[11px] text-muted font-mono mt-0.5">
                      {stats.xpInLevel} / {stats.xpNextLevel} XP
                    </p>
                  </div>
                </div>
              </div>

              {/* Daily Challenge & Recent Quizzes Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Daily Challenge Card */}
                <Card className="lg:col-span-1 rounded-2xl border-indigo-500/20 bg-gradient-to-br from-indigo-950/20 to-purple-950/5 p-6 flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />
                  <div>
                    <div className="flex items-center gap-2 text-indigo-400 mb-4">
                      <Sparkles className="h-4 w-4 animate-pulse" />
                      <span className="text-xs font-bold uppercase tracking-wider">Daily Challenge</span>
                    </div>
                    <h3 className="text-base font-bold text-white leading-snug">
                      Advanced Python: Comprehensions & Generators
                    </h3>
                    <p className="mt-2 text-xs text-muted leading-relaxed">
                      Earn 2x XP by completing today&apos;s specialized core adaptive evaluation challenge.
                    </p>
                  </div>
                  <Link href="/assessment/new?subject=Python" className="mt-6">
                    <Button className="w-full bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg h-9 text-xs">
                      Start Challenge <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </Card>

                {/* Recent Quizzes Grid */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-muted font-mono">
                      Recent Assessments
                    </h2>
                    <button onClick={() => setActiveTab("assessments")} className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
                      View All
                    </button>
                  </div>

                  <div className="space-y-3">
                    {loadingStats ? (
                      <div className="flex items-center justify-center py-10">
                        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                      </div>
                    ) : sessions.length === 0 ? (
                      <div className="text-center py-8 rounded-xl border border-dashed border-white/5 bg-white/[0.01]">
                        <p className="text-xs text-muted">No assessments taken yet. Launch one from subjects below!</p>
                      </div>
                    ) : (
                      sessions.slice(0, 2).map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between rounded-xl border border-white/5 bg-[#0b1329]/60 p-4 transition-all hover:border-white/10"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.03] border border-white/5 text-white">
                              <BookOpen className="h-4.5 w-4.5" />
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-white">{s.subject}</h4>
                              <p className="text-[10px] text-muted flex items-center gap-1 mt-0.5">
                                <Clock className="h-3 w-3" />
                                {new Date(s.createdAt).toLocaleDateString()} • {s.askedCount}/{s.targetCount} Qs
                              </p>
                            </div>
                          </div>

                          {s.status === "COMPLETED" ? (
                            <div className="text-right">
                              <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                                {s.overallProficiency !== null 
                                  ? `${Math.round(s.overallProficiency * 100)}% Score` 
                                  : "Completed"}
                              </span>
                              <Link href={`/assessment/${s.id}/result`} className="block text-[10px] text-indigo-400 hover:underline mt-1">
                                View Report
                              </Link>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="hidden sm:inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/20">
                                In Progress
                              </span>
                              <Link href={`/assessment/${s.id}`}>
                                <Button size="sm" className="bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white border border-indigo-500/20 text-[10px] h-7 px-3">
                                  Resume
                                </Button>
                              </Link>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Categories/Core Subjects Section */}
              <div className="space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted font-mono">
                  Categories
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {SUBJECTS.map((sub) => {
                    const Icon = sub.icon;
                    return (
                      <div
                        key={sub.id}
                        className="group rounded-xl border border-white/5 bg-[#0b1329]/40 p-4 transition-all hover:border-indigo-500/30 hover:bg-white/[0.02] flex flex-col gap-3"
                      >
                        {/* Subject info row */}
                        <div className="flex items-center gap-3.5">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.03] border border-white/5 group-hover:text-indigo-400 group-hover:border-indigo-500/20 transition-all text-white">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-white">{sub.id}</h4>
                            <p className="text-[10px] text-muted mt-0.5 truncate">{sub.description.slice(0, 48)}…</p>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => startTest(sub.id)}
                            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-[11px] font-semibold h-8 transition-all"
                          >
                            <ArrowRight className="h-3 w-3" />
                            Start Test
                          </button>
                          <button
                            onClick={() => {
                              setActiveSubject(sub);
                              setActiveTab("discover");
                            }}
                            className="flex items-center justify-center h-8 w-8 rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] text-muted hover:text-white transition-all"
                            title="View resources"
                          >
                            <BookOpen className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: MY ASSESSMENTS */}
          {activeTab === "assessments" && (
            <div className="space-y-6 max-w-4xl animate-fadeIn">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                  My Quizzes
                </h1>
                <p className="text-xs text-muted mt-1">
                  Browse your active and historical adaptive evaluations.
                </p>
              </div>

              <div className="space-y-3">
                {loadingStats ? (
                  <div className="flex justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="text-center py-16 rounded-2xl border border-dashed border-white/5 bg-white/[0.01]">
                    <GraduationCap className="h-10 w-10 text-muted mx-auto mb-3" />
                    <h3 className="text-sm font-semibold text-white">No Assessments Yet</h3>
                    <p className="text-xs text-muted mt-1 max-w-xs mx-auto">
                      Go to the Discover tab to practice subjects and build your dynamic skill profile.
                    </p>
                    <Button onClick={() => setActiveTab("discover")} className="mt-4 bg-indigo-500 hover:bg-indigo-600 text-xs">
                      Discover Subjects
                    </Button>
                  </div>
                ) : (
                  sessions.map((s) => (
                    <div
                      key={s.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-xl border border-white/5 bg-[#0b1329]/60 p-5 gap-4"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.03] border border-white/5 text-white">
                          <BookOpen className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white">{s.subject}</h4>
                            <span className="text-[10px] bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-muted uppercase font-mono">
                              {s.mode}
                            </span>
                          </div>
                          <p className="text-xs text-muted mt-1">
                            Completed {new Date(s.createdAt).toLocaleDateString()} at {new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <p className="text-[11px] text-muted font-mono mt-1">
                            {s.askedCount}/{s.targetCount} questions answered
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center sm:justify-end gap-3 border-t sm:border-0 border-white/5 pt-3 sm:pt-0">
                        {s.status === "COMPLETED" ? (
                          <div className="text-left sm:text-right w-full sm:w-auto">
                            <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/20">
                              {s.overallProficiency !== null 
                                ? `${Math.round(s.overallProficiency * 100)}% Score` 
                                : "Completed"}
                            </span>
                            <Link href={`/assessment/${s.id}/result`} className="block text-xs text-indigo-400 hover:underline mt-1.5">
                              View Skill Report
                            </Link>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                            <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/20">
                              In Progress
                            </span>
                            <Link href={`/assessment/${s.id}`}>
                              <Button size="sm" className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs rounded-lg px-4 h-8">
                                Resume
                              </Button>
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: DISCOVER */}
          {activeTab === "discover" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                    Discover Subjects
                  </h1>
                  <p className="text-xs text-muted mt-1">
                    Select a core open-source subject to start practicing or review resource guides.
                  </p>
                </div>

                <div className="flex gap-1.5 bg-black/40 border border-white/5 p-1 rounded-xl overflow-x-auto max-w-full">
                  {SUBJECTS.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => setActiveSubject(sub)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                        activeSubject.id === sub.id
                          ? "bg-indigo-500 text-white"
                          : "text-muted hover:text-white"
                      }`}
                    >
                      {sub.id}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Subject Detail layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                {/* Left Side: Subject Details & Resource Links */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-[#0c1630] to-[#080e1e] p-6 relative overflow-hidden">
                    <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 h-48 w-48 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />
                    
                    <div className="relative z-10">
                      <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/5 px-2.5 py-0.5 text-[10px] text-indigo-400 font-bold uppercase tracking-wider mb-3">
                        <Sparkles className="h-3 w-3 animate-pulse" /> Core Syllabus
                      </div>
                      <h2 className="text-2xl font-bold text-white tracking-tight">
                        {activeSubject.id}
                      </h2>
                      <p className="mt-2 text-xs leading-relaxed text-muted max-w-xl">
                        {activeSubject.description}
                      </p>

                      <div className="mt-6 flex flex-wrap gap-3">
                        <Link href={`/assessment/new?subject=${activeSubject.id}`}>
                          <Button size="sm" className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg h-9 text-xs px-4">
                            Start Practice Assessment <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        <button
                          onClick={() => setActiveTab("chat")}
                          className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/[0.02] text-xs font-semibold px-4 hover:bg-white/[0.05] text-white transition-all h-9"
                        >
                          <MessageSquare className="mr-1.5 h-3.5 w-3.5 text-indigo-400" />
                          Ask AI Tutor
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Resource cards */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted font-mono flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-indigo-400" /> Curated Documentation Links
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {activeSubject.topics.map((topic) => (
                        <Card
                          key={topic.name}
                          onClick={() => window.open(topic.url, "_blank", "noopener,noreferrer")}
                          className="group cursor-pointer p-4 transition-all border-white/5 hover:border-indigo-500/30 hover:bg-white/[0.01] hover:shadow-lg relative"
                        >
                          <div className="flex items-start justify-between">
                            <span className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors">
                              {topic.name}
                            </span>
                            <ExternalLink className="h-3.5 w-3.5 text-muted group-hover:text-white transition-colors" />
                          </div>
                          <p className="mt-1.5 text-[11px] text-muted leading-relaxed line-clamp-2">
                            {topic.blurb}
                          </p>
                          <div className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span>Open URL</span>
                            <ChevronRight className="h-3 w-3" />
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Side: Mini AI Tutor Chat widget */}
                <div className="lg:col-span-1 rounded-2xl border border-white/5 bg-[#0b1329]/60 overflow-hidden flex flex-col h-[460px]">
                  
                  {/* Chat header */}
                  <div className="px-5 py-3.5 border-b border-white/5 bg-white/[0.02] flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <MessageSquare className="h-3.5 w-3.5 text-indigo-400" />
                        {activeSubject.id} Assistant
                      </h4>
                      <p className="text-[9px] text-muted">Ready to assist you</p>
                    </div>
                  </div>

                  {/* Chat feed */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-black/10 text-xs">
                    {chatMessages.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-xl px-3 py-2.5 shadow-sm leading-relaxed ${
                            msg.role === "user"
                              ? "bg-indigo-500 text-white rounded-tr-none"
                              : "bg-[#0b1329] border border-white/5 text-white rounded-tl-none"
                          }`}
                        >
                          {msg.role === "user" ? (
                            <p className="whitespace-pre-line">{msg.content}</p>
                          ) : (
                            <div className="space-y-1">{renderMarkdown(msg.content)}</div>
                          )}
                        </div>
                      </div>
                    ))}
                    {sendingChat && (
                      <div className="flex justify-start">
                        <div className="max-w-[85%] rounded-xl rounded-tl-none bg-[#0b1329] border border-white/5 px-3 py-2.5 text-white/50 flex items-center gap-2">
                          <Loader2 className="h-3 w-3 animate-spin text-indigo-500" />
                          <span>Thinking...</span>
                        </div>
                      </div>
                    )}
                    <div ref={chatBottomRef} />
                  </div>

                  {/* Suggestion tags */}
                  <div className="px-4 py-2 border-t border-white/5 bg-white/[0.01] flex flex-wrap gap-1.5 overflow-x-auto shrink-0 whitespace-nowrap">
                    {getSubjectSuggestions().slice(0, 2).map((sug, idx) => (
                      <button
                        key={idx}
                        onClick={() => askSuggestion(sug)}
                        className="text-[10px] bg-white/5 hover:bg-white/10 text-muted hover:text-white border border-white/5 px-2.5 py-1 rounded-full transition-all"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>

                  {/* Chat Input form */}
                  <form onSubmit={handleSendChat} className="p-3 border-t border-white/5 bg-[#0b1329]">
                    <div className="flex gap-2">
                      <input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder={`Ask the tutor...`}
                        disabled={sendingChat}
                        className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-muted/50 focus:outline-none focus:border-indigo-500/50"
                      />
                      <Button type="submit" disabled={!chatInput.trim() || sendingChat} className="h-8 w-8 p-0 bg-indigo-500 hover:bg-indigo-600 rounded-lg">
                        <Send className="h-3.5 w-3.5 text-white" />
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CHAT */}
          {activeTab === "chat" && (
            <div className="space-y-6 max-w-4xl animate-fadeIn h-[calc(100vh-120px)] flex flex-col">
              <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-indigo-400" />
                    AI Tutor Spaces
                  </h1>
                  <p className="text-xs text-muted mt-1">
                    Have a detailed chat with the assistant on any core concept or syntax.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted font-semibold">Tutor Subject:</span>
                  <select
                    value={activeSubject.id}
                    onChange={(e) => {
                      const found = SUBJECTS.find(s => s.id === e.target.value);
                      if (found) setActiveSubject(found);
                    }}
                    className="bg-[#0b1329] border border-white/10 text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
                  >
                    {SUBJECTS.map(s => (
                      <option key={s.id} value={s.id}>{s.id}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Detailed chat container */}
              <div className="flex-1 rounded-2xl border border-white/5 bg-[#0b1329]/60 overflow-hidden flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-black/10">
                  {chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4.5 py-3 text-sm shadow-sm leading-relaxed ${
                          msg.role === "user"
                            ? "bg-indigo-500 text-white rounded-tr-none"
                            : "bg-[#0b1329] border border-white/5 text-white rounded-tl-none"
                        }`}
                      >
                        {msg.role === "user" ? (
                          <p className="whitespace-pre-line">{msg.content}</p>
                        ) : (
                          <div className="space-y-1">{renderMarkdown(msg.content)}</div>
                        )}
                      </div>
                    </div>
                  ))}
                  {sendingChat && (
                    <div className="flex justify-start">
                      <div className="max-w-[80%] rounded-2xl rounded-tl-none bg-[#0b1329] border border-white/5 px-4.5 py-3 text-white/50 flex items-center gap-2.5">
                        <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                        <span>Thinking...</span>
                      </div>
                    </div>
                  )}
                  <div ref={chatBottomRef} />
                </div>

                {/* Detailed Suggestions */}
                <div className="border-t border-white/5 px-6 py-3 bg-white/[0.01] flex flex-wrap gap-2 shrink-0">
                  <span className="text-[10px] text-muted uppercase font-mono tracking-wider flex items-center mr-1">
                    Suggestions:
                  </span>
                  {getSubjectSuggestions().map((sug, idx) => (
                    <button
                      key={idx}
                      onClick={() => askSuggestion(sug)}
                      className="text-xs bg-white/5 hover:bg-white/10 text-muted hover:text-white border border-white/5 px-3 py-1 rounded-full transition-all"
                    >
                      {sug}
                    </button>
                  ))}
                </div>

                {/* Form */}
                <form onSubmit={handleSendChat} className="p-4 border-t border-white/5 bg-[#0b1329] shrink-0">
                  <div className="flex gap-2">
                    <input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder={`Ask me anything about ${activeSubject.id} syntax or concepts...`}
                      disabled={sendingChat}
                      className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-muted/50 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50"
                    />
                    <Button type="submit" disabled={!chatInput.trim() || sendingChat} className="px-5 bg-indigo-500 hover:bg-indigo-600 rounded-xl h-12">
                      <Send className="h-4 w-4 text-white" />
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>

        {/* ── Mobile Bottom Navigation Bar ── */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t border-white/5 bg-[#0b1329] p-2 flex items-center justify-around z-20">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex flex-col items-center justify-center w-14 h-12 rounded-xl transition-all ${
              activeTab === "dashboard" ? "text-indigo-400" : "text-muted hover:text-white"
            }`}
          >
            <Compass className="h-5 w-5" />
            <span className="text-[9px] font-semibold mt-0.5">Home</span>
          </button>
          <button
            onClick={() => setActiveTab("assessments")}
            className={`flex flex-col items-center justify-center w-14 h-12 rounded-xl transition-all ${
              activeTab === "assessments" ? "text-indigo-400" : "text-muted hover:text-white"
            }`}
          >
            <BookMarked className="h-5 w-5" />
            <span className="text-[9px] font-semibold mt-0.5">My Quizzes</span>
          </button>
          <button
            onClick={() => setActiveTab("discover")}
            className={`flex flex-col items-center justify-center w-14 h-12 rounded-xl transition-all ${
              activeTab === "discover" ? "text-indigo-400" : "text-muted hover:text-white"
            }`}
          >
            <Globe className="h-5 w-5" />
            <span className="text-[9px] font-semibold mt-0.5">Discover</span>
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex flex-col items-center justify-center w-14 h-12 rounded-xl transition-all ${
              activeTab === "chat" ? "text-indigo-400" : "text-muted hover:text-white"
            }`}
          >
            <MessageSquare className="h-5 w-5" />
            <span className="text-[9px] font-semibold mt-0.5">AI Tutor</span>
          </button>
        </nav>

      </div>
    </main>
  );
}
