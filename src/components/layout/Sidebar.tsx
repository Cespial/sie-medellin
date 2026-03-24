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
  FlaskConical,
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
  { href: "/mapa/instituciones", label: "Mapa IEs", icon: Map },
  { href: "/contexto", label: "Contexto", icon: BarChart3 },
  { href: "/analisis", label: "Análisis", icon: FlaskConical },
];

/* Tensor chevron logo mark */
function TensorMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="14 4 8 12 14 20" />
      <polyline points="20 4 14 12 20 20" />
    </svg>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    if (mobileOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [mobileOpen]);

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
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <TensorMark className="w-6 h-6 text-foreground shrink-0" />
        {(!collapsed || mobileOpen) && (
          <div className="overflow-hidden">
            <h1 className="font-semibold text-[13px] text-foreground tracking-tight leading-tight">
              SIE Medellín
            </h1>
            <p className="text-[10px] text-muted tracking-wide uppercase leading-tight">
              Inteligencia Educativa
            </p>
          </div>
        )}

        {mobileOpen && (
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto text-muted hover:text-foreground transition-colors lg:hidden"
            aria-label="Cerrar menú"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav
        className="flex-1 px-2 py-3 space-y-0.5"
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
                "group flex items-center gap-3 px-3 py-2 text-[13px] transition-colors duration-150",
                isActive
                  ? "text-accent bg-accent/[0.06] rounded-lg"
                  : "text-muted hover:text-foreground hover:bg-black/[0.03] rounded-lg"
              )}
            >
              {isActive && (
                <span className="absolute left-0 w-[2px] h-5 bg-accent" />
              )}
              <item.icon
                className={cn(
                  "w-[15px] h-[15px] shrink-0",
                  isActive ? "text-accent" : "text-muted group-hover:text-foreground"
                )}
              />
              {(!collapsed || mobileOpen) && (
                <span className="tracking-tight">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-3 left-3 z-50 flex items-center justify-center w-10 h-10 bg-white rounded-xl shadow-sm border border-border/50 text-muted hover:text-foreground transition-colors lg:hidden"
        aria-label="Abrir menú"
        aria-expanded={mobileOpen}
      >
        <Menu className="w-4 h-4" />
      </button>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col w-56 border-r border-border/50 bg-white/95 backdrop-blur-xl transition-transform duration-200 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-label="Menú de navegación"
      >
        {navContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col border-r border-border/50 bg-white/80 backdrop-blur-xl transition-all duration-200",
          collapsed ? "w-14" : "w-52"
        )}
        aria-label="Menú de navegación"
        data-expanded={!collapsed}
      >
        {navContent}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center py-3 border-t border-border text-muted hover:text-foreground transition-colors"
          aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
        >
          {collapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" />
          )}
        </button>
      </aside>
    </>
  );
}
