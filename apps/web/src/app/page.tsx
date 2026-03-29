"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "motion/react"
import {
  Shield,
  Zap,
  Database,
  Code2,
  Globe,
  Lock,
  ArrowRight,
  CheckCircle2,
  Terminal,
  Layers,
  Cpu,
  MessageSquare,
  Bug,
  Rocket
} from "lucide-react"

const features = [
  {
    icon: Globe,
    title: "All API Protocols",
    description: "REST, GraphQL, WebSockets, gRPC, SSE, Webhooks, JSON-RPC — handled perfectly.",
  },
  {
    icon: Lock,
    title: "Every Auth Pattern",
    description: "OAuth 2.0 (PKCE, CC), JWT, API Keys, HMAC, mTLS — auto-detected and configured.",
  },
  {
    icon: Database,
    title: "Full Database Stack",
    description: "Supabase, D1, KV, Durable Objects, Redis, R2 — all wired and optimized.",
  },
  {
    icon: Zap,
    title: "Production Patterns",
    description: "Rate limiting, retry logic, circuit breakers, idempotency — built-in.",
  },
  {
    icon: Code2,
    title: "Auto Type Generation",
    description: "Full TypeScript + Zod from any OpenAPI spec — zero any types.",
  },
  {
    icon: Bug,
    title: "Debug Intelligence",
    description: "500+ error patterns, root cause analysis, auto-fix recommendations.",
  },
]

const howItWorks = [
  { step: "01", title: "Input API", description: "Paste OpenAPI URL, GraphQL endpoint, or describe in plain English" },
  { step: "02", title: "Analyze", description: "Lil API maps every endpoint, auth flow, rate limit, and error code" },
  { step: "03", title: "Generate", description: "Types, client, backend, frontend — all built automatically" },
  { step: "04", title: "Deploy", description: "Push to GitHub, CI runs, Cloudflare deploys, URL is live" },
]

export default function Home() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-slate-950" />
            </div>
            <span className="text-xl font-bold text-white">Lil API</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/docs" className="text-slate-400 hover:text-white transition-colors">
              Docs
            </Link>
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-lg bg-amber-500 text-slate-950 font-medium hover:bg-amber-400 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 border border-slate-800 mb-8">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-sm text-slate-400">Powered by RJ Business Solutions</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              The API Integration
              <br />
              <span className="text-amber-500">Master Agent</span>
            </h1>

            <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
              Give Lil API any API — OpenAPI, GraphQL, cURL, or plain English.
              It builds a complete, production-ready, deployed full-stack application.
            </p>

            <div className="flex items-center justify-center gap-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-amber-500 text-slate-950 font-semibold hover:bg-amber-400 transition-all"
              >
                Start Building <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="https://github.com/rjbizsolution23-wq/lil-api"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-slate-800 text-white font-medium hover:bg-slate-900 transition-all"
              >
                <Terminal className="w-5 h-5" /> View Demo
              </a>
            </div>
          </motion.div>

          {/* Terminal Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-16"
          >
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="ml-4 text-sm text-slate-500">Lil API Terminal</span>
              </div>
              <div className="p-6 text-left font-mono text-sm">
                <div className="text-slate-500">$ lil-api integrate stripe</div>
                <div className="text-amber-500 mt-2">✓ Fetching OpenAPI spec...</div>
                <div className="text-amber-500">✓ Analyzing 142 endpoints...</div>
                <div className="text-amber-500">✓ Detecting auth: OAuth 2.0 + PKCE</div>
                <div className="text-amber-500">✓ Generating TypeScript types...</div>
                <div className="text-amber-500">✓ Generating API client...</div>
                <div className="text-amber-500">✓ Building Hono backend...</div>
                <div className="text-amber-500">✓ Building Next.js frontend...</div>
                <div className="text-green-500 mt-2">✓ Deployed to https://stripe-api.pages.dev</div>
                <div className="text-slate-400 mt-4">$</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Everything You Need
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Every protocol, every auth pattern, every database layer, every UI state —
              all built-in and production-hardened.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                viewport={{ once: true }}
                className="p-6 rounded-2xl border border-slate-800 bg-slate-900/30 hover:border-amber-500/50 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-amber-500" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              From API to Deployed App
            </h2>
            <p className="text-slate-400">
              Four steps from concept to live URL. Lil API handles everything.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {howItWorks.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-6xl font-bold text-slate-800 mb-4">{step.step}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-slate-400 text-sm">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="p-12 rounded-3xl border border-amber-500/20 bg-gradient-to-b from-amber-500/10 to-transparent">
            <Rocket className="w-12 h-12 text-amber-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Build?
            </h2>
            <p className="text-slate-400 mb-8">
              Give Lil API any API and get a complete deployed application in minutes.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-amber-500 text-slate-950 font-semibold hover:bg-amber-400 transition-all text-lg"
            >
              Start Integrating <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <Shield className="w-4 h-4" />
            <span>Built by RJ Business Solutions</span>
          </div>
          <div className="text-slate-500 text-sm">
            © 2026 Lil API. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
