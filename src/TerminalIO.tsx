import { Terminal } from "@xterm/xterm";
import type { ZMInputOutputDevice } from "./tszm/ZMInputOutputDevice";

export class TerminalIO implements ZMInputOutputDevice {
  private terminal: Terminal | null = null;
  private inputBuffer: string[] = [];
  private lineBuffer: string = "";
  private resolveChar: ((value: string) => void) | null = null;
  private resolveLine: ((value: string) => void) | null = null;

  constructor() {
    // Terminal will be set later when the component mounts
  }

  setTerminal(terminal: Terminal): void {
    this.terminal = terminal;

    // Set up input handling
    terminal.onData((data) => {
      this.handleInput(data);
    });
  }

  private handleInput(data: string): void {
    // Handle character input
    if (this.resolveChar) {
      const resolver = this.resolveChar;
      this.resolveChar = null;
      resolver(data);
      return;
    }

    // Handle line input
    if (this.resolveLine) {
      for (const char of data) {
        if (char === '\r' || char === '\n') {
          // Enter pressed - resolve the line
          this.terminal?.write('\r\n');
          const line = this.lineBuffer;
          this.lineBuffer = "";
          const resolver = this.resolveLine;
          this.resolveLine = null;
          resolver(line);
          return;
        } else if (char === '\x7F' || char === '\b') {
          // Backspace
          if (this.lineBuffer.length > 0) {
            this.lineBuffer = this.lineBuffer.slice(0, -1);
            this.terminal?.write('\b \b');
          }
        } else if (char >= ' ' && char <= '~') {
          // Printable character
          this.lineBuffer += char;
          this.terminal?.write(char);
        }
      }
    }
  }

  async readChar(): Promise<string> {
    return new Promise<string>((resolve) => {
      this.resolveChar = resolve;
    });
  }

  async readLine(): Promise<string> {
    return new Promise<string>((resolve) => {
      this.resolveLine = resolve;
    });
  }

  async writeChar(char: string): Promise<void> {
    if (!this.terminal) {
      console.warn("Terminal not initialized");
      return;
    }

    // Convert newline to CRLF for terminal
    if (char === '\n') {
      this.terminal.write('\r\n');
    } else {
      this.terminal.write(char);
    }
  }

  async writeString(str: string): Promise<void> {
    if (!this.terminal) {
      console.warn("Terminal not initialized");
      return;
    }

    // Convert newlines to CRLF for terminal
    const converted = str.replace(/\n/g, '\r\n');
    this.terminal.write(converted);
  }

  reset(): void {
    // Cancel any pending input operations first
    if (this.resolveChar) {
      this.resolveChar('');
      this.resolveChar = null;
    }

    if (this.resolveLine) {
      this.resolveLine('');
      this.resolveLine = null;
    }

    // Clear buffers
    this.lineBuffer = '';
    this.inputBuffer = [];

    // Clear the terminal screen and reset cursor
    if (this.terminal) {
      this.terminal.reset();
      this.terminal.clear();
    }
  }

  close(): void {
    this.terminal = null;
    this.resolveChar = null;
    this.resolveLine = null;
  }
}
