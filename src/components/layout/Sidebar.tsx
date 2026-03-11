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
} from "lucide-react";
import { useState } from "react";

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

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-border bg-surface/50 backdrop-blur-sm transition-all duration-300",
        collapsed ? "w-16" : "w-56"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-secondary flex items-center justify-center shrink-0">
          <span className="text-background font-bold text-sm">S</span>
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="font-[var(--font-syne)] font-bold text-sm text-foreground leading-tight">
              SIE Medellín
            </h1>
            <p className="text-[10px] text-muted leading-tight">
              Inteligencia Educativa
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
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
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center py-3 border-t border-border text-muted hover:text-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  );
}
