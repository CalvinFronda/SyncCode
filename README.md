# SyncCode

A real-time collaborative code execution platform that enables multiple users to write, edit, and execute code together in a shared environment. Built with React, Express, and Yjs for seamless real-time synchronization.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Development](#development)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Technical Details](#technical-details)
- [Security](#security)

## Overview

SyncCode is designed for collaborative coding scenarios such as technical interviews, pair programming, and educational environments. Users can join shared rooms where they can write code together in real-time, see each other's cursors and selections, and execute code with results visible to all participants.

## Architecture

The application is structured as an NPM workspace with three main components:

### Client

A React-based single-page application built with Vite that provides the user interface. It includes:

- Monaco Editor for code editing with syntax highlighting
- Real-time synchronization using Yjs and WebSocket
- Resizable panels for editor and output views
- Session token management for authenticated code execution

### Server

An Express.js backend that handles:

- Code execution in isolated Docker containers
- Session management and authentication
- Static file serving for the production client
- WebSocket connections for real-time collaboration via y-websocket
- CORS configuration for development and production environments

### Runner

A Docker-based code execution environment that safely runs user code in isolated containers, supporting multiple programming languages (Python, JavaScript).

## Features

### Real-time Collaboration

- **Live Editing**: Multiple users can edit code simultaneously with instant synchronization
- **Cursor Tracking**: See other users' cursor positions and text selections in real-time
- **Awareness**: Visual indicators show who is in the room and what they are doing

### Code Execution

- **Multi-Language Support**: Execute Python and JavaScript code
- **Isolated Execution**: Code runs in Docker containers for security and isolation
- **Shared Output**: Execution results are synchronized across all participants
- **Execution History**: Full log of all code runs with attribution to the user who triggered each execution

### Session Management

- **Token-Based Authentication**: Secure session tokens for code execution
- **Role Assignment**: First user in a room becomes the interviewer, others are interviewees
- **Session Persistence**: Users stay logged in across page refreshes

### User Interface

- **Resizable Panels**: Adjust editor and output panel sizes to preference
- **Language Switching**: Toggle between supported programming languages
- **Default Templates**: Each language starts with appropriate boilerplate code
- **Responsive Design**: Works across different screen sizes

## Technology Stack

### Frontend

- **React 19**: UI framework
- **TypeScript**: Type-safe development
- **Vite**: Build tool and development server
- **Monaco Editor**: VSCode-based code editor
- **Yjs**: Conflict-free replicated data types for real-time collaboration
- **y-monaco**: Monaco editor bindings for Yjs
- **Axios**: HTTP client for API requests
- **React Router**: Client-side routing
- **Tailwind CSS**: Utility-first styling

### Backend

- **Node.js**: Runtime environment
- **Express 5**: Web framework
- **TypeScript**: Type-safe server code
- **y-websocket**: WebSocket provider for Yjs synchronization
- **dotenv**: Environment variable management
- **Docker**: Container runtime for code execution

### Development

- **NPM Workspaces**: Monorepo management
- **Concurrently**: Running multiple processes
- **Nodemon**: Auto-reloading development server
- **ESLint**: Code linting

## Project Structure

```
SyncCode/
├── package.json              # Root workspace configuration
├── client/                   # Frontend application
│   ├── src/
│   │   ├── api/             # API client functions
│   │   ├── components/      # React components
│   │   ├── pages/           # Page-level components
│   │   └── App.tsx          # Application entry point
│   ├── package.json
│   └── .env                 # Client environment variables
├── server/                   # Backend application
│   ├── src/
│   │   ├── index.ts         # Server entry point
│   │   └── execute.ts       # Code execution logic
│   ├── package.json
│   └── .env                 # Server environment variables
└── runner/                   # Code execution environment
    ├── Dockerfile
    └── run.sh               # Execution script
```

## Getting Started

### Prerequisites

- **Node.js**: Version 18.0.0 or higher
- **npm**: Comes with Node.js
- **Docker**: Required for code execution functionality

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd SyncCode
```

2. Install all dependencies from the root:

```bash
npm install
```

This will install dependencies for all workspaces (client, server, and runner).

### Running Locally

#### Development Mode

To run both the client and server in development mode with hot-reloading:

```bash
npm run dev
```

This starts:

- Client development server on `http://localhost:5173`
- Backend server on `http://localhost:3000`

You can also run them individually:

```bash
npm run dev:client   # Only client on port 5173
npm run dev:server   # Only server on port 3000
```

#### Production Mode

Build and run the production version:

```bash
npm run build        # Build both client and server
npm start            # Start production server
```

In production mode, the Express server serves the built React application, so everything runs on `http://localhost:3000`.

## Development

### Workspace Commands

The root `package.json` provides unified commands:

- `npm run dev`: Start both client and server in development mode
- `npm run build`: Build both applications for production
- `npm run start`: Run the production server
- `npm run clean`: Remove all node_modules directories

### Individual Workspace Commands

You can work with individual workspaces:

```bash
npm run <script> -w client   # Run script in client workspace
npm run <script> -w server   # Run script in server workspace
```

### Making Changes

1. **Client Changes**: Edit files in `client/src/`. Vite will auto-reload.
2. **Server Changes**: Edit files in `server/src/`. Nodemon will restart the server.
3. **Build System**: After significant changes, run `npm run build` to ensure production builds work.

## Environment Variables

### Client (.env in client/ see .env.example)

```env
VITE_NGROK_URL=https://your-ngrok-url.ngrok.io
```

- **VITE_NGROK_URL**: The ngrok URL when exposing your local server publicly (optional for local development)

### Server (.env in server/ see .env.example)

```env
NGROK_URL=https://your-ngrok-url.ngrok.io
```

- **NGROK_URL**: The ngrok URL for CORS configuration (optional for local development)

**Note**:

- Environment variables in Vite must be prefixed with `VITE_`
- Changes to `.env` files require rebuilding/restarting
- For local development without ngrok, these can be omitted

## Deployment

### Building for Production

```bash
npm run build
```

This produces:

- `client/dist/`: Compiled React application
- `server/dist/`: Compiled Express server

### Running in Production

```bash
npm start
```

The server will:

1. Serve the static client files from `client/dist/`
2. Handle API requests on `/session` and `/execute`
3. Provide WebSocket connections for real-time collaboration
4. Handle client-side routing by serving `index.html` for all routes

### Deployment Considerations

1. **Docker**: Ensure Docker is installed and running on the production server
2. **Environment Variables**: Set production environment variables in `.env` files
3. **Port Configuration**: The server runs on port 3000 by default
4. **Reverse Proxy**: Consider using nginx or similar for HTTPS and load balancing
5. **Process Management**: Use PM2 or similar to keep the Node process running

### Exposing via ngrok

For quick public access:

```bash
ngrok http 3000
```

Update both `.env` files with the ngrok URL and rebuild.

## Technical Details

### Real-time Synchronization

The application uses Yjs for conflict-free real-time collaboration:

- **Yjs Document**: Shared state containing the code, configuration, and execution results
- **WebSocket Provider**: Connects all clients to the same Yjs document through the server
- **Monaco Binding**: Synchronizes the Monaco editor content with the Yjs document
- **Awareness Protocol**: Shares cursor positions and user information

### Code Execution Flow

1. User clicks "Run Code"
2. Client checks for valid session token
3. Request sent to `/execute` endpoint with code, language, and token
4. Server validates token and role permissions
5. Server spawns Docker container with code
6. Container executes code and returns stdout/stderr
7. Results written to Yjs shared state
8. All clients receive and display the updated results

### Session Management

- Sessions created via `/POST /session` endpoint
- UUID-based tokens generated with `crypto.randomUUID()`
- Tokens stored in server memory (Map)
- First user in a room assigned "interviewer" role
- Subsequent users assigned "interviewee" role
- Token required in Authorization header for code execution

### Editor Integration

- Monaco Editor provides VSCode-like editing experience
- y-monaco binds editor to Yjs text type
- Awareness module tracks and displays remote cursors
- Custom styling for cursor colors and labels
- Language-specific syntax highlighting

## Security

### Current Implementation

- **Session Tokens**: UUID-based tokens for request authentication
- **CORS**: Configured to allow specific origins
- **Docker Isolation**: Code runs in isolated containers
- **Input Validation**: Server validates request payloads

### Important Security Notes

**This is a development/demo application and should not be used in production without additional hardening:**

1. **Token Storage**: Tokens stored in memory, cleared on server restart
2. **No User Authentication**: No login system, anyone with URL can join
3. **Code Execution**: Limited sandboxing, malicious code could affect system
4. **No Encryption**: WebSocket connections not encrypted by default

### Recommended Improvements for Production

- Implement persistent session storage (Redis, Database)
- Add user authentication and authorization
- Add execution timeouts and resource limits
- Use HTTPS/WSS for encrypted connections
- Implement proper container security policies
- Add logging and monitoring
- Implement input sanitization and validation

## License

ISC

## Author

Calvin
