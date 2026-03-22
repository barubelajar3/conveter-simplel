"use client";

import { motion } from "framer-motion";
import {
  Image,
  Type,
  Code2,
  ArrowRight,
  Sparkles,
  Zap,
  Shield,
} from "lucide-react";
import Link from "next/link";

const tools = [
  {
    name: "Image to URL",
    description:
      "Upload images to Cloudflare R2 and get permanent shareable URLs. Drag & drop with live preview and one-click copy.",
    href: "/image-to-url",
    icon: Image,
    gradient: "from-indigo-500 to-blue-500",
    bgGlow: "rgba(99,102,241,0.08)",
  },
  {
    name: "SVG to Icon Font",
    description:
      "Convert your SVG icons into a custom icon font package. Upload multiple SVGs, preview them, and generate downloadable font files.",
    href: "/svg-to-font",
    icon: Type,
    gradient: "from-purple-500 to-pink-500",
    bgGlow: "rgba(168,85,247,0.08)",
  },
  {
    name: "SVG to Code",
    description:
      "Paste or drop raw SVG and instantly convert to minified SVG, Base64 Data URI, or a React JSX component. Copy with one click.",
    href: "/svg-to-code",
    icon: Code2,
    gradient: "from-emerald-500 to-teal-500",
    bgGlow: "rgba(16,185,129,0.08)",
  },
];

const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "All tools run instantly in your browser with zero server round-trips.",
  },
  {
    icon: Shield,
    title: "Secure & Reliable",
    description: "Images stored on Cloudflare R2. SVG tools run locally in your browser.",
  },
  {
    icon: Sparkles,
    title: "Modern Stack",
    description: "Built with Next.js, Tailwind CSS, and Framer Motion for a premium experience.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function Home() {
  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8 lg:p-10">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-3xl mx-auto mb-16 pt-8"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-dim border border-accent/20 text-accent text-sm font-medium mb-6"
        >
          <Sparkles className="w-4 h-4" />
          Developer Toolkit v1.0
        </motion.div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 tracking-tight">
          DevTools{" "}
          <span className="bg-gradient-to-r from-gradient-start to-gradient-end bg-clip-text text-transparent">
            Studio
          </span>
        </h1>
        <p className="text-lg text-muted max-w-xl mx-auto leading-relaxed">
          A curated collection of premium developer tools. Fast, private, and
          beautifully crafted for modern workflows.
        </p>
      </motion.div>

      {/* Tool Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto mb-20"
      >
        {tools.map((tool) => (
          <motion.div key={tool.name} variants={itemVariants}>
            <Link href={tool.href}>
              <motion.div
                whileHover={{ y: -4, scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="group relative rounded-2xl border border-border bg-surface/50 p-6 h-full overflow-hidden transition-colors hover:border-border-bright"
              >
                {/* Glow */}
                <div
                  className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-3xl"
                  style={{ background: tool.bgGlow }}
                />

                <div className="relative z-10">
                  <div
                    className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${tool.gradient} mb-4`}
                  >
                    <tool.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {tool.name}
                  </h3>
                  <p className="text-sm text-muted leading-relaxed mb-4">
                    {tool.description}
                  </p>
                  <div className="flex items-center gap-2 text-accent text-sm font-medium">
                    <span>Open Tool</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </motion.div>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* Features */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="max-w-4xl mx-auto"
      >
        <motion.p
          variants={itemVariants}
          className="text-center text-xs uppercase tracking-widest text-muted mb-8"
        >
          Why DevTools Studio
        </motion.p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className="text-center p-6 rounded-2xl border border-border bg-surface/30"
            >
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-surface-hover mb-4">
                <feature.icon className="w-5 h-5 text-muted" />
              </div>
              <h4 className="text-sm font-semibold text-foreground mb-1">
                {feature.title}
              </h4>
              <p className="text-xs text-muted leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
