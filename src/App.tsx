import React, { useRef, useState } from 'react';
import './App.css';
import { ZMachine } from './tszm/ZMachine';
import ZTerminal from './ZTerminal';
import { TerminalIO } from './TerminalIO';
import { Terminal } from '@xterm/xterm';
import { Checkbox, TextField, Select, MenuItem, FormControl, InputLabel, SelectChangeEvent } from '@mui/material';

function App() {
  const terminalIORef = useRef<TerminalIO>(new TerminalIO());
  const zmRef = useRef<ZMachine | null>(null);
  const [selectedGame, setSelectedGame] = useState<string>('ZorkI.z3');
  const executionIdRef = useRef<number>(0); // Track which execution loop should be running

  const handleGameChange = async (event: SelectChangeEvent) => {
    setSelectedGame(event.target.value);

    // Stop any existing execution loop
    executionIdRef.current++;
    const currentExecutionId = executionIdRef.current;

    // Clear the screen and exit any pending input
    terminalIORef.current.reset();

    // Create new ZMachine with the selected game
    zmRef.current = new ZMachine(`https://cshepherd.fr/zimage/${event.target.value}`, terminalIORef.current);

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

    // Execute instructions in a loop
    for (;;) {
      // Check if this execution loop should still be running
      if (executionIdRef.current !== currentExecutionId) {
        console.log("Execution loop stopped - game was changed");
        return;
      }

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
  }

  const handleTerminalReady = async (terminal: Terminal) => {
    // Connect the terminal to TerminalIO
    terminalIORef.current.setTerminal(terminal);

    // Initialize the ZMachine
    if (!zmRef.current) {
      executionIdRef.current++;
      const currentExecutionId = executionIdRef.current;

      zmRef.current = new ZMachine(`https://cshepherd.fr/zimage/${selectedGame}`, terminalIORef.current);

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

      // Execute instructions in a loop
      for (;;) {
        // Check if this execution loop should still be running
        if (executionIdRef.current !== currentExecutionId) {
          console.log("Execution loop stopped - game was changed");
          return;
        }

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
    }
  };

  return (
    <div className="App">
      <div className="pane-container">
        <ZTerminal onTerminalReady={handleTerminalReady} />
      </div>
      <div className="pane-container">
        <div id="zmcdn" className="zmcdn-pane">
          <form id="config-form">
            <h2>Configuration</h2>
            <div>
              <FormControl variant="standard" fullWidth>
                <InputLabel id="game-select-label">Game</InputLabel>
                <Select
                  labelId="game-select-label"
                  id="game-select"
                  value={selectedGame}
                  onChange={handleGameChange}
                  label="Game"
                >
                  <MenuItem value="ZorkI.z3">Zork I</MenuItem>
                  <MenuItem value="ZorkII.z3">Zork II</MenuItem>
                  <MenuItem value="ZorkIII.z3">Zork III</MenuItem>
                </Select>
              </FormControl>
              <div className="checkbox-row">
                <Checkbox defaultChecked />
                <label htmlFor="zmcdn-enabled">Enable ZMCDN</label>
              </div>
              <TextField value={"http://zmcdn.ballmerpeak.org:3003"} id="zmcdn-url" label="ZMCDN URL" variant="standard" />
            </div>
          </form>
          <img src="https://www.placecats.com/512/512" width={512} height={512} alt="ZMCDN will go here" />
        </div>
      </div>
    </div>
  );
}

export default App;
