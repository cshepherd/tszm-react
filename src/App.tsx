import React, { useRef } from 'react';
import './App.css';
import { ZMachine } from './tszm/ZMachine';
import ZTerminal from './ZTerminal';
import { TerminalIO } from './TerminalIO';
import { Terminal } from '@xterm/xterm';

function App() {
  const terminalIORef = useRef<TerminalIO>(new TerminalIO());
  const zmRef = useRef<ZMachine | null>(null);

  const handleTerminalReady = async (terminal: Terminal) => {
    // Connect the terminal to TerminalIO
    terminalIORef.current.setTerminal(terminal);

    // Initialize the ZMachine
    if (!zmRef.current) {
      zmRef.current = new ZMachine('https://cshepherd.fr/ZorkI.z3', terminalIORef.current);

      // Load the game file
      try {
        await zmRef.current.load();
      } catch (loadErr) {
        console.error("Error loading game:", loadErr);
        if (loadErr instanceof Error) {
          console.error("Stack trace:", loadErr.stack);
        }
        return;
      }
    }

    // Execute instructions in a loop
    for (;;) {
      try {
        await zmRef.current.executeInstruction();
      } catch (instrErr) {
        // Re-throw QUIT without logging
        if (instrErr instanceof Error && instrErr.message === "QUIT") {
          throw instrErr;
        }
        console.error("Error executing instruction:", instrErr);
        if (instrErr instanceof Error) {
          console.error("Stack trace:", instrErr.stack);
        }
        throw instrErr;
      }
    }
  };

  return (
    <div className="App">
      <ZTerminal onTerminalReady={handleTerminalReady} />
    </div>
  );
}

export default App;
