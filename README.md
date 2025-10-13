## tszm-react

Eventually it had to happen: The React-based Web (or Native) frontend for TSZM.

## Using TSZM with React

- Some things were done to TSZM to make it easier to reuse: Environmental detection (node, react, etc) and conditional requirement of "fs/promises" as a result was the main one.
- Look at 'config-overrides.js' in this project. You'll need it to polyfill Buffer and bring it into the global scope as it's used by TSZM (this is done via react-app-rewired).
- Note also the 'exclude' block in tsconfig.json: Just make sure you exclude the unit tests, ZConsole, and tszm.ts, because those are related to the commandline version and won't build properly in React land anyhow.

... after this, it just worked. Of course, we needed to add CORS headers when serving our .z3 image files as well as on ZMCDN.

## Demo

Current version with current ZMCDN up at https://cshepherd.fr/tszm-react

## Roadmap

- Dual-display web app: xterm.js terminal display with full z3+ cursor positioning support, as well as a window showing png output from zmcdn (this is mostly working)
- LocalStorage is more than large enough to support the defacto game save standard. It's probably time.
- React Native port for iOS/Android/Samsung refrigerator (I joke but Native is the next target)
- Potential to start the audiotext version from here (... wouldn't the Native version be a great place to start the narrated/spoken version?)

## Status

12-Oct-2025 - Just started today, making great progress. Public URLs coming soon. zmcdn updated for permissive CORS headers. tszm updated with a couple small changes to allow same codebase to work on both node and React.

13-Oct-2025 - Works great but needs a refactor today. Will update when that's done.

![reactscrn1](https://github.com/user-attachments/assets/3e1ffd87-b45e-457c-9d9a-fe7000cea0b1)

Currently tszm is imported as a submodule, not via npm. This is intentional and it'll stay this way unless and until we decide tszm should go into npm.
