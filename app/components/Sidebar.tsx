"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Image,
  Type,
  Code2,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Menu,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";

const navItems = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    description: "Overview",
  },
  {
    name: "Image to URL",
    href: "/image-to-url",
    icon: Image,
    description: "Host images instantly",
  },
  {
    name: "SVG to Font",
    href: "/svg-to-font",
    icon: Type,
    description: "Generate icon fonts",
  },
  {
    name: "SVG to Code",
    href: "/svg-to-code",
    icon: Code2,
    description: "SVG to minified/URI/JSX",
  },
];

// Mobile top bar + drawer
function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between h-14 px-4 border-b border-border bg-surface/80 backdrop-blur-xl lg:hidden">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-gradient-start to-gradient-end shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-sm font-semibold text-foreground">
            DevTools Studio
          </h1>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center justify-center w-9 h-9 rounded-xl text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
          aria-label="Toggle navigation menu"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="fixed top-0 left-0 bottom-0 z-50 w-72 border-r border-border bg-surface/95 backdrop-blur-xl lg:hidden"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between h-14 px-5 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-gradient-start to-gradient-end shrink-0">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-sm font-semibold text-foreground">
                    DevTools Studio
                  </h1>
                  <p className="text-[10px] text-muted">Developer Toolkit</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Nav */}
            <nav className="px-3 py-4 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <motion.div
                      whileTap={{ scale: 0.98 }}
                      className={`relative flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-colors ${
                        isActive
                          ? "text-foreground"
                          : "text-muted hover:text-foreground"
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="mobileActiveNav"
                          className="absolute inset-0 bg-accent-dim border border-accent/20 rounded-xl"
                          transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 35,
                          }}
                        />
                      )}
                      <item.icon
                        className={`relative z-10 w-5 h-5 shrink-0 ${
                          isActive
                            ? "text-accent"
                            : "group-hover:text-accent-hover"
                        }`}
                      />
                      <div className="relative z-10">
                        <span className="text-sm font-medium">
                          {item.name}
                        </span>
                        <p className="text-xs text-muted">{item.description}</p>
                      </div>
                    </motion.div>
                  </Link>
                );
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Desktop sidebar
function DesktopSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="relative hidden lg:flex flex-col border-r border-border bg-surface/50 backdrop-blur-xl h-screen shrink-0"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-border">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-gradient-start to-gradient-end shrink-0">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <h1 className="text-base font-semibold text-foreground whitespace-nowrap">
                DevTools Studio
              </h1>
              <p className="text-xs text-muted whitespace-nowrap">
                Developer Toolkit
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors group ${
                  isActive
                    ? "text-foreground"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 bg-accent-dim border border-accent/20 rounded-xl"
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 35,
                    }}
                  />
                )}
                <item.icon
                  className={`relative z-10 w-5 h-5 shrink-0 ${
                    isActive ? "text-accent" : "group-hover:text-accent-hover"
                  }`}
                />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="relative z-10 overflow-hidden"
                    >
                      <span className="text-sm font-medium whitespace-nowrap">
                        {item.name}
                      </span>
                      {!collapsed && (
                        <p className="text-xs text-muted whitespace-nowrap">
                          {item.description}
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Collapse Button */}
      <div className="px-3 py-4 border-t border-border">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full gap-2 px-3 py-2 rounded-xl text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span className="text-xs">Collapse</span>
            </>
          )}
        </button>
      </div>
    </motion.aside>
  );
}

export function Sidebar() {
  return (
    <>
      <MobileNav />
      <DesktopSidebar />
    </>
  );
}
