"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import {
  LayoutDashboard,
  Map,
  Users,
  Award,
  School,
  BarChart3,
  ShieldAlert,
  GraduationCap,
  Heart,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/mapa", label: "Mapa", icon: Map },
  { href: "/cobertura", label: "Cobertura", icon: Users },
  { href: "/calidad", label: "Calidad", icon: Award },
  { href: "/permanencia", label: "Permanencia", icon: ShieldAlert },
  { href: "/matricula", label: "Matrícula", icon: GraduationCap },
  { href: "/equidad", label: "Equidad", icon: Heart },
  { href: "/instituciones", label: "Instituciones", icon: School },
  { href: "/contexto", label: "Contexto", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close mobile drawer on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    if (mobileOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [mobileOpen]);

  // Prevent body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [mobileOpen]);

  const navContent = (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-secondary flex items-center justify-center shrink-0">
          <span className="text-background font-bold text-sm">S</span>
        </div>
        {(!collapsed || mobileOpen) && (
          <div className="overflow-hidden">
            <h1 className="font-[var(--font-syne)] font-bold text-sm text-foreground leading-tight">
              SIE Medellín
            </h1>
            <p className="text-[10px] text-muted leading-tight">
              Inteligencia Educativa
            </p>
          </div>
        )}

        {/* Close button for mobile drawer */}
        {mobileOpen && (
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto text-muted hover:text-foreground transition-colors lg:hidden"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav
        className="flex-1 px-2 py-4 space-y-1"
        role="navigation"
        aria-label="Navegación principal"
      >
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
                isActive
                  ? "bg-accent/10 text-accent glow-accent"
                  : "text-muted hover:text-foreground hover:bg-white/5"
              )}
            >
              <item.icon
                className={cn("w-4.5 h-4.5 shrink-0", isActive && "text-accent")}
              />
              {(!collapsed || mobileOpen) && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-3 left-3 z-50 flex items-center justify-center w-10 h-10 rounded-lg bg-surface/50 border border-border backdrop-blur-sm text-muted hover:text-foreground transition-colors lg:hidden"
        aria-label="Abrir menú"
        aria-expanded={mobileOpen}
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col w-56 border-r border-border bg-surface/50 backdrop-blur-sm transition-transform duration-300 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-label="Menú de navegación"
      >
        {navContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col border-r border-border bg-surface/50 backdrop-blur-sm transition-all duration-300",
          collapsed ? "w-16" : "w-56"
        )}
        aria-label="Menú de navegación"
        aria-expanded={!collapsed}
      >
        {navContent}

        {/* Collapse Toggle (desktop only) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center py-3 border-t border-border text-muted hover:text-foreground transition-colors"
          aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </aside>
    </>
  );
}
