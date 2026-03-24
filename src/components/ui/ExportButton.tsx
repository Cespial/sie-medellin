"use client";

import { useRef, useCallback } from "react";
import { Camera } from "lucide-react";

interface ExportButtonProps {
  targetRef: React.RefObject<HTMLElement | null>;
  filename?: string;
}

export function ExportButton({ targetRef, filename = "sie-medellin" }: ExportButtonProps) {
  const handleExport = useCallback(async () => {
    if (!targetRef.current) return;

    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(targetRef.current, {
      backgroundColor: "#FFFFFF",
      scale: 2,
      logging: false,
      useCORS: true,
    });

    // Add watermark
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.font = "11px system-ui";
      ctx.fillStyle = "#6E6E73";
      ctx.fillText(
        `SIE Medellín · ${new Date().toLocaleDateString("es-CO")} · sie-medellin.vercel.app`,
        12,
        canvas.height - 12
      );
    }

    const link = document.createElement("a");
    link.download = `${filename}-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, [targetRef, filename]);

  return (
    <button
      onClick={handleExport}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-muted hover:text-foreground bg-surface hover:bg-surface/80 rounded-lg transition-colors"
      aria-label="Exportar como imagen"
      title="Exportar como imagen PNG"
    >
      <Camera className="w-3.5 h-3.5" />
      Exportar
    </button>
  );
}
