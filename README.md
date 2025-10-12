## tszm-react

Eventually it had to happen: The React-based Web (or Native) frontend for TSZM.

## Roadmap

- Dual-display web app: xterm.js terminal display with full z3+ cursor positioning support, as well as a window showing png output from zmcdn
- React Native port for iOS/Android/Samsung refrigerator
- Potential to start the audiotext version from here

## Status

12-Oct-2025 - Just started today, making great progress. Public URLs coming soon. zmcdn updated for permissive CORS headers. tszm updated with a couple small changes to allow same codebase to work on both node and React.

![reactscrn1](https://github.com/user-attachments/assets/3e1ffd87-b45e-457c-9d9a-fe7000cea0b1)

Currently tszm is imported as a submodule, not via npm. This is intentional and it'll stay this way unless and until we decide tszm should go into npm.
