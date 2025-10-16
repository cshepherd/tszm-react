import React, { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";

interface ZTerminalProps {
  onTerminalReady?: (terminal: Terminal) => void;
}

export default function ZTerminal({ onTerminalReady }: ZTerminalProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const termRef = useRef<Terminal | null>(null);

  useEffect(() => {
    // Guard against SSR
    if (!containerRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      fontFamily:
        'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
      scrollback: 2000,
      rows: 50,
      cols: 80,
    });
//    const fit = new FitAddon();
//    term.loadAddon(fit);

    term.open(containerRef.current);

    // Wait for terminal to be fully ready before fitting
    const raf = requestAnimationFrame(() => {
      // Use a small timeout to ensure the renderer is initialized
      setTimeout(() => {
        term.focus();

        // Notify parent that terminal is ready
        if (onTerminalReady) {
          onTerminalReady(term);
        }
      }, 0);
    });

    // Keep references for later (optional)
    termRef.current = term;

    return () => {
      cancelAnimationFrame(raf);
      term.dispose();
      termRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className="zterminal-pane" />;
}
