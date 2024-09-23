# PeerChat: P2P Communication with PeerJS

PeerChat is an experimental project built to explore and demonstrate the capabilities of PeerJS for peer-to-peer communication in web browsers. This application leverages React, TypeScript, and Vite for a robust development experience.

## Disclaimer

**Important:** PeerChat is a proof-of-concept project and is not intended for secure or sensitive communications. It lacks proper security measures and encryption. Use at your own risk and do not share sensitive information through this application.

## Key Features

- **Direct Peer-to-Peer Communication**: Utilizes PeerJS for serverless, low-latency messaging
- **Multi-Participant Chat**: Supports more than two participants, functioning like a chat room
- **Real-Time Messaging**: Instant message delivery between peers
- **Flexible Modes**: Supports both host and client roles for versatile chat setups
- **Automatic Reconnection**: Attempts to maintain connections in unstable network conditions
- **Modern UI**: Responsive design built with Tailwind CSS and shadcn/ui components

## Prerequisites

- Node.js (v18.0.0 or later)
- npm (v6.0.0 or later)

## Getting Started

1. Clone the repository:

   ```
   git clone https://github.com/ih16/PeerChat.git
   ```

2. Navigate to the project directory:

   ```
   cd PeerChat
   ```

3. Install dependencies:

   ```
   npm install
   ```

4. Run the development server:
   ```
   npm run dev
   ```

## Available Scripts

- `npm run dev`: Start the development server
- `npm run build`: Build for production
- `npm run lint`: Run ESLint
- `npm run preview`: Preview the production build

## Technology Stack

- PeerJS: Core P2P communication library
- React: UI library
- TypeScript: For type-safe code
- Vite: Build tool and development server
- Tailwind CSS: Utility-first CSS framework
- shadcn/ui: Pre-built UI components

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default tseslint.config({
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
});
```

- Replace `tseslint.configs.recommended` to `tseslint.configs.recommendedTypeChecked` or `tseslint.configs.strictTypeChecked`
- Optionally add `...tseslint.configs.stylisticTypeChecked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and update the config:

```js
// eslint.config.js
import react from 'eslint-plugin-react';

export default tseslint.config({
  // Set the react version
  settings: { react: { version: '18.3' } },
  plugins: {
    // Add the react plugin
    react,
  },
  rules: {
    // other rules...
    // Enable its recommended rules
    ...react.configs.recommended.rules,
    ...react.configs['jsx-runtime'].rules,
  },
});
```

## Contributing

While PeerChat is primarily an experimental project, contributions or suggestions for improvements are welcome. Feel free to submit a Pull Request or open an issue for discussion.

## License

This project is open source and available under the [MIT License](LICENSE).
