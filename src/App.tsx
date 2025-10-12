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
  const [zmcdnEnabled, setZmcdnEnabled] = useState<boolean>(true);
  const [zmcdnUrl, setZmcdnUrl] = useState<string>('http://zmcdn.ballmerpeak.org:3003');
  const [zmcdnImageUrl, setZmcdnImageUrl] = useState<string>('https://www.placecats.com/512/512');

  const handleZmcdnEnabledChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const enabled = event.target.checked;
    setZmcdnEnabled(enabled);
    terminalIORef.current.setZmcdnEnabled(enabled);
  };

  const handleZmcdnUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const url = event.target.value;
    setZmcdnUrl(url);
    terminalIORef.current.setZmcdnUrl(url);
  };

  const handleGameChange = async (event: SelectChangeEvent) => {
    setSelectedGame(event.target.value);

    // Stop any existing execution loop
    executionIdRef.current++;
    const currentExecutionId = executionIdRef.current;

    // Clear the screen and exit any pending input
    terminalIORef.current.reset();
    terminalIORef.current.setZmcdnSessionId(crypto.randomUUID());

    // Create new ZMachine with the selected game
    zmRef.current = new ZMachine(`https://cshepherd.fr/zimage/${event.target.value}`, terminalIORef.current);

    // Set ZMachine reference in TerminalIO
    terminalIORef.current.setZMachine(zmRef.current);

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

    // Initialize ZMCDN settings
    terminalIORef.current.setZmcdnEnabled(zmcdnEnabled);
    terminalIORef.current.setZmcdnUrl(zmcdnUrl);
    terminalIORef.current.setZmcdnSessionId(crypto.randomUUID());
    terminalIORef.current.setOnImageUpdate((imageUrl: string) => {
      setZmcdnImageUrl(imageUrl);
    });

    // Initialize the ZMachine
    if (!zmRef.current) {
      executionIdRef.current++;
      const currentExecutionId = executionIdRef.current;

      zmRef.current = new ZMachine(`https://cshepherd.fr/zimage/${selectedGame}`, terminalIORef.current);

      // Set ZMachine reference in TerminalIO
      terminalIORef.current.setZMachine(zmRef.current);

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
                  <MenuItem value="Ballyhoo.z3">Ballyhoo</MenuItem>
                  <MenuItem value="Cutthroats.z3">Cutthroats</MenuItem>
                  <MenuItem value="Deadline.z3">Deadline</MenuItem>
                  <MenuItem value="Enchanter.z3">Enchanter</MenuItem>
                  <MenuItem value="HollywoodHijinx.z3">Hollywood Hijinx</MenuItem>
                  <MenuItem value="Infidel.z3">Infidel</MenuItem>
                  <MenuItem value="LeatherGoddesses.z3">Leather Goddesses of Phobos</MenuItem>
                  <MenuItem value="Moonmist.z3">Moonmist</MenuItem>
                  <MenuItem value="Planetfall.z3">Planetfall</MenuItem>
                  <MenuItem value="PlunderedHearts.z3">Plundered Hearts</MenuItem>
                  <MenuItem value="Seastalker.z3">Seastalker</MenuItem>
                  <MenuItem value="Sorceror.z3">Sorceror</MenuItem>
                  <MenuItem value="Spellbreaker.z3">Spellbreaker</MenuItem>
                  <MenuItem value="Starcross.z3">Starcross</MenuItem>
                  <MenuItem value="Stationfall.z3">Stationfall</MenuItem>
                  <MenuItem value="Suspect.z3">Suspect</MenuItem>
                  <MenuItem value="Suspended.z3">Suspended</MenuItem>
                  <MenuItem value="TheLurkingHorror.z3">The Lurking Horror</MenuItem>
                  <MenuItem value="TheWitness.z3">The Witness</MenuItem>
                  <MenuItem value="Wishbringer.z3">Wishbringer</MenuItem>
                  <MenuItem value="ZorkI.z3">Zork I</MenuItem>
                  <MenuItem value="ZorkII.z3">Zork II</MenuItem>
                  <MenuItem value="ZorkIII.z3">Zork III</MenuItem>
                </Select>
              </FormControl>
              <div className="checkbox-row">
                <Checkbox
                  id="zmcdn-enabled"
                  checked={zmcdnEnabled}
                  onChange={handleZmcdnEnabledChange}
                />
                <label htmlFor="zmcdn-enabled">Enable ZMCDN</label>
              </div>
              <TextField
                value={zmcdnUrl}
                onChange={handleZmcdnUrlChange}
                id="zmcdn-url"
                label="ZMCDN URL"
                variant="standard"
              />
            </div>
          </form>
          <img src={zmcdnImageUrl} width={512} height={512} alt="ZMCDN illustration" />
        </div>
      </div>
    </div>
  );
}

export default App;
