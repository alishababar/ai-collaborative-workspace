# AI Collaborative Visual Workspace

An AI-powered collaborative workspace where teams can communicate, brainstorm, and work together on a shared visual canvas.

The core idea is simple:

**Conversation → AI Understanding → Visual Canvas**

As participants communicate, the AI analyzes the conversation and turns meaningful ideas, decisions, tasks, questions, and notes into visual nodes on the shared canvas.

## Features

- AI-powered conversation analysis
- Automatically creates canvas nodes from meaningful discussions
- Idea, decision, task, question, and note nodes
- Natural-language "Ask the AI" commands
- Real-time collaborative canvas using Socket.IO
- Drag, edit, connect, and delete canvas nodes
- Real-time participant presence
- Live collaborative cursors
- Peer-to-peer video and audio using WebRTC
- Microphone and camera controls
- Conversation panel
- Manual canvas node creation
- REST API for room state
- Free local AI using Ollama
- Optional Anthropic Claude integration

## Tech Stack

- Next.js
- React
- TypeScript
- Node.js
- Socket.IO
- WebRTC
- Ollama
- Llama 3.2
- Anthropic Claude (optional)
- REST API
- In-memory room store

## Project Structure
```text

ai-collaborative-workspace/
├── app/
│   ├── api/
│   │   └── room/
│   │       └── [room]/
│   │           └── route.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
│
├── components/
│   ├── Canvas.tsx
│   ├── NodeCard.tsx
│   ├── SidePanel.tsx
│   └── TopBar.tsx
│
├── lib/
│   ├── ai.ts
│   ├── store.ts
│   ├── types.ts
│   ├── useSocket.ts
│   └── useWebRTC.ts
│
├── server.ts
├── package.json
├── tsconfig.json
└── README.md 
```

## Getting Started
# 1. Install dependencies
```text

npm install
```
# 2. Install and run Ollama

Install Ollama and make sure it is available from your terminal.

Check:
```text

ollama --version
```
Pull the Llama 3.2 model:
```text

ollama pull llama3.2
```
Check that the model is installed:
```text

ollama list
```
You should see:
```text

llama3.2:latest
```
Ollama is used as the default AI provider, so no API key is required.

# 3. Start the application

Run:
```text

npm run dev
```
The application will be available at:
```text

http://localhost:3000
```
You should see:
```text

AI Collaborative Workspace ready on http://localhost:3000
```
## Testing the AI

Open:
```text

http://localhost:3000
```
# Test Conversation → Canvas
Enter your name and create or join a room.

Go to the Conversation section and type:
```text

We should redesign the onboarding flow because users are dropping off during signup.
```
The AI should understand this as an idea and create a visual node on the canvas.

Then type:
```text

Sarah can own the redesign by Friday.
```
The AI should create a task node.

Then type:
```text

Do we need legal approval before changing the signup flow?
```
The AI should create a question node.

The canvas should automatically grow as the conversation continues.

## Ask the AI

Open the Ask the AI section and try:
```text
Connect related ideas
```
You can also try:
```text
Turn the open questions into tasks
```
or:
```text
Create a task for Sarah to test the onboarding flow
```
The AI will interpret the instruction and update the shared canvas.

## Real-Time Collaboration

Open the same room in another browser tab.

For example:
```text
http://localhost:3000/?room=team
```
Join using a different name.

Changes should synchronize between both participants in real time.

You can test:

-Chat messages
-AI-generated nodes
-Moving nodes
-Editing nodes
-Adding nodes
-Connecting nodes
-Deleting nodes
-Participant presence
-Cursor movement
-Video and audio

No page refresh should be required.

## Video Communication

The application uses WebRTC for peer-to-peer video and audio.

Socket.IO handles the WebRTC signaling between participants.

The prototype uses a mesh architecture, which is suitable for small groups.

If camera or microphone access is unavailable, the participant can still use the workspace with the rest of the functionality available.

## AI Architecture

The AI flow is:
```
Conversation
     ↓
Socket.IO
     ↓
Server
     ↓
Recent transcript
     ↓
Ollama / Claude
     ↓
Structured JSON
     ↓
Canvas Operations
     ↓
Shared Room Store
     ↓
Socket.IO
     ↓
All Participants
```
The AI does not directly modify the UI.

Instead, it returns structured operations such as:
```
{
  "summary": "Added an onboarding task.",
  "ops": [
    {
      "op": "add_node",
      "id": "n1",
      "kind": "task",
      "text": "Redesign onboarding flow"
    }
  ]
}
```
Supported node types are:
```text
idea
decision
task
question
note
```
## Optional Claude Support

Ollama is the default provider.

If you want to use Anthropic Claude instead, create a .env.local file:

ANTHROPIC_API_KEY=your_api_key_here

When ANTHROPIC_API_KEY is available, the application automatically uses Claude.

Without the key, the application uses Ollama.

Optional Ollama configuration:

OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
## REST API

The current room state can be retrieved through:

GET /api/room/:room

Example:

GET http://localhost:3000/api/room/team

The endpoint returns the current room state, including 
- canvas nodes
- edges
- messages

## Data Storage

The prototype currently uses an in-memory room store.

This keeps the prototype simple and fast.

Room data will be reset when the server restarts.

The store can later be replaced with PostgreSQL, Redis, or another persistent database without changing the main application architecture.

## Known Limitations

This is a prototype designed to demonstrate the core product experience.

- Room data is stored in memory.
- WebRTC currently uses a peer-to-peer mesh architecture.
- No TURN server is configured.
- The conversation panel is a typed stand-in for speech-to-text.
- AI analysis runs after messages rather than continuously streaming.
- Large-scale video meetings would require an SFU/media server.
## Assignment Goals

This project focuses on the main goals of the AI Collaborative Visual Workspace:

# Product Experience: 
Combines conversation, video, AI, and visual collaboration in one workspace.
# AI Intelligence:
 Converts natural conversation into structured visual information.
# Real-Time Collaboration: 
Synchronizes users, canvas changes, messages, and cursors using Socket.IO.
# Visual Quality:
 Represents ideas, decisions, tasks, questions, and notes visually.
# Adaptability:
 Allows users to control the canvas using natural-language AI commands.
# Technical Execution:
 Uses a single TypeScript codebase with Next.js, Node.js, Socket.IO, WebRTC, and AI integration.
# Innovation:
 Turns meeting conversation into a living, shared visual workspace.
## Future Improvements

Possible future improvements include:
```text

- Speech-to-text integration
- Persistent PostgreSQL storage
- User authentication
- Team workspaces
- Meeting recordings
- AI meeting summaries
- Automatic action-item extraction
- Task ownership and due dates
- AI-powered canvas organization
- Semantic duplicate detection
- Undo/redo for AI changes
- Production WebRTC using an SFU
- TURN server support
- Streaming AI responses
```
## Conclusion

The AI Collaborative Visual Workspace brings communication and visual thinking together.

Instead of having a meeting and documenting the results afterward, the workspace allows the conversation itself to become structured visual knowledge.
```text
People Talk
     ↓
AI Understands
     ↓
Canvas Grows
     ↓
Team Collaborates
```