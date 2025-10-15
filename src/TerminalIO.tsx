import { Terminal } from "@xterm/xterm";
import type { ZMInputOutputDevice } from "./tszm/ZMInputOutputDevice";
import { ZMCDNInput } from "./tszm/ZMCDNInput";
import { ZMachine } from "./tszm/ZMachine";

export class TerminalIO implements ZMInputOutputDevice {
  private terminal: Terminal | null = null;
  private inputBuffer: string[] = [];
  private lineBuffer: string = "";
  private resolveChar: ((value: string) => void) | null = null;
  private resolveLine: ((value: string) => void) | null = null;
  private zmcdnEnabled: boolean = true;
  private zmcdnUrl: string = "";
  private ZMCDNText: string = "";
  private zmcdnSessionId: string = "";
  private zm: any = null; // Reference to ZMachine, set externally if needed
  private onImageUpdate: ((imageUrl: string) => void) | null = null;
  private isProcessingZMCDN: boolean = false;

  constructor() {
    // Terminal will be set later when the component mounts
  }

  setOnImageUpdate(callback: (imageUrl: string) => void): void {
    this.onImageUpdate = callback;
  }

  setZMachine(zm: ZMachine): void {
    this.zm = zm;
  }

  async processZMCDNText(): Promise<void> {
    // Prevent concurrent processing
    if (this.isProcessingZMCDN) {
      return;
    }

    if (this.ZMCDNText && this.zmcdnEnabled) {
      this.isProcessingZMCDN = true;

      // Show spinner while loading
      if (this.onImageUpdate) {
        const spinnerSvg = `<svg width="50" height="50" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
          <circle cx="25" cy="25" r="10" stroke="#888" stroke-width="2" fill="none" stroke-dasharray="15 50" stroke-linecap="round">
            <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1s" repeatCount="indefinite"/>
          </circle>
        </svg>`;
        const spinnerDataUrl = `data:image/svg+xml;base64,${btoa(spinnerSvg)}`;
        this.onImageUpdate(spinnerDataUrl);
      }

      if (!this.zmcdnSessionId) {
        this.zmcdnSessionId = crypto.randomUUID();
      }
      const zmcdnInput = new ZMCDNInput();
      zmcdnInput.zmcdnSessionID = this.zmcdnSessionId;
      zmcdnInput.lastZMachineOutput = this.ZMCDNText;
      this.ZMCDNText = "";

      // Get gameId from header
      if (!this.zm) {
        console.error("ZMachine not initialized");
        this.isProcessingZMCDN = false;
        return;
      }

      zmcdnInput.lastZMachineInput = this.zm.getLastRead();

      const header = this.zm.getHeader();
      if (!header) {
        console.error("Unable to read game header");
        this.isProcessingZMCDN = false;
        return;
      }

      zmcdnInput.gameIdentifier = `${header.release}.${header.serial}`;

      const playerParent = this.zm.findPlayerParent();
      if (playerParent) {
        zmcdnInput.playerLocation = playerParent.name;
      } else {
        zmcdnInput.playerLocation = "";
      }

      zmcdnInput.illustrationFormat = "png";

      const url = `${this.zmcdnUrl}/illustrateMove`;
      try {
        const imageBlob = await this.postJSONForImage(url, zmcdnInput);

        // Convert blob to data URL for img src
        const dataUrl = URL.createObjectURL(imageBlob);

        // Notify React component to update the image
        if (this.onImageUpdate) {
          this.onImageUpdate(dataUrl);
        }
      } catch (error) {
        console.error(
          `Failed to fetch graphics from ${url}: ${error instanceof Error ? error.message : String(error)}`,
        );
      } finally {
        this.isProcessingZMCDN = false;
      }
    }
    return Promise.resolve();
  }

  private async postJSON(url: string, data: any): Promise<string> {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`HTTP ${response.status} error response:`, errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return response.text();
  }

  private async postJSONForImage(url: string, data: any): Promise<Blob> {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`HTTP ${response.status} error response:`, errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return response.blob();
  }

  setZmcdnSessionId(sessionId: string): void {
    this.zmcdnSessionId = sessionId;
  }

  getZmcdnSessionId(): string {
    return this.zmcdnSessionId;
  }

  setZmcdnEnabled(enabled: boolean): void {
    this.zmcdnEnabled = enabled;
  }

  getZmcdnEnabled(): boolean {
    return this.zmcdnEnabled;
  }

  setZmcdnUrl(url: string): void {
    this.zmcdnUrl = url;
  }

  getZmcdnUrl(): string {
    return this.zmcdnUrl;
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
        if (char === "\r" || char === "\n") {
          // Enter pressed - resolve the line
          this.terminal?.write("\r\n");
          const line = this.lineBuffer;
          this.lineBuffer = "";
          const resolver = this.resolveLine;
          this.resolveLine = null;
          resolver(line);
          return;
        } else if (char === "\x7F" || char === "\b") {
          // Backspace
          if (this.lineBuffer.length > 0) {
            this.lineBuffer = this.lineBuffer.slice(0, -1);
            this.terminal?.write("\b \b");
          }
        } else if (char >= " " && char <= "~") {
          // Printable character
          this.lineBuffer += char;
          this.terminal?.write(char);
        }
      }
    }
  }

  async readChar(): Promise<string> {
    this.processZMCDNText();
    return new Promise<string>((resolve) => {
      this.resolveChar = resolve;
    });
  }

  async readLine(): Promise<string> {
    this.processZMCDNText();
    return new Promise<string>((resolve) => {
      this.resolveLine = resolve;
    });
  }

  async writeChar(char: string): Promise<void> {
    if (!this.terminal) {
      console.warn("Terminal not initialized");
      return;
    }

    if(this.zmcdnEnabled) {
      this.ZMCDNText += char;
    }

    // Convert newline to CRLF for terminal
    if (char === "\n") {
      this.terminal.write("\r\n");
    } else {
      this.terminal.write(char);
    }
  }

  async writeString(str: string): Promise<void> {
    if (!this.terminal) {
      console.warn("Terminal not initialized");
      return;
    }

    if(this.zmcdnEnabled) {
      this.ZMCDNText += str;
    }

    // Convert newlines to CRLF for terminal
    const converted = str.replace(/\n/g, "\r\n");
    this.terminal.write(converted);
  }

  reset(): void {
    // Cancel any pending input operations first
    if (this.resolveChar) {
      this.resolveChar("");
      this.resolveChar = null;
    }

    if (this.resolveLine) {
      this.resolveLine("");
      this.resolveLine = null;
    }

    // Clear buffers
    this.lineBuffer = "";
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
