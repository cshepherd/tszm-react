import React, { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "xterm-addon-fit";
import "@xterm/xterm/css/xterm.css";

interface ZTerminalProps {
  onTerminalReady?: (terminal: Terminal) => void;
}

export default function ZTerminal({ onTerminalReady }: ZTerminalProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    // Guard against SSR
    if (!containerRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      fontFamily:
        'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
      scrollback: 2000,
    });
    const fit = new FitAddon();
    term.loadAddon(fit);

    term.open(containerRef.current);

    // Wait for terminal to be fully ready before fitting
    const raf = requestAnimationFrame(() => {
      // Use a small timeout to ensure the renderer is initialized
      setTimeout(() => {
        try {
          fit.fit();
        } catch {
          /* no-op */
        }
        term.focus();

        // Notify parent that terminal is ready
        if (onTerminalReady) {
          onTerminalReady(term);
        }
      }, 0);
    });

    // Keep references for later (optional)
    termRef.current = term;
    fitRef.current = fit;

    // Refit when the container resizes
    const ro = new ResizeObserver(() => {
      try {
        fit.fit();
      } catch {
        /* no-op */
      }
    });
    ro.observe(containerRef.current);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      term.dispose();
      termRef.current = null;
      fitRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className="zterminal-pane" />;
}
