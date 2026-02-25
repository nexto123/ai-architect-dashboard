# AI Architect Dashboard

Your command center for managing AI agent deployments across multiple clients.

## Features

- **Real-time Monitoring**: Live client status, agent health, alerts
- **Multi-tenant**: Manage multiple clients from one dashboard
- **Agent Swarm Control**: Start, stop, monitor agents per client
- **Quick Deploy**: Deploy new agents with minimal configuration
- **Firebase Integration**: Real-time sync between dashboard and OpenClaw agents

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: CSS Variables, Glassmorphism design
- **Database**: Firebase Realtime Database
- **Icons**: Lucide React
- **Deployment**: Vercel

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDVVBOf75ZlcnH4QsT6oD1onUiWmV9VqPk
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=ai-architect-dashboard.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://ai-architect-dashboard-default-rtdb.europe-west1.firebasedatabase.app
NEXT_PUBLIC_FIREBASE_PROJECT_ID=ai-architect-dashboard
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=ai-architect-dashboard.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=153106882137
NEXT_PUBLIC_FIREBASE_APP_ID=1:153106882137:web:e4bb8f1765aa45a2371b48
```

### 3. Run Locally

```bash
npm run dev
```

Open http://localhost:3000

### 4. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Or connect your GitHub repo to Vercel for auto-deploy.

## Dashboard Sections

### Overview
- System health metrics
- Active alerts
- Quick status of all clients

### Clients
- View all client deployments
- Add new clients
- Monitor per-client metrics (uptime, costs, agents)

### Agents
- View agent swarm across all clients
- Start/stop individual agents
- Monitor CPU/memory usage

### Deploy
- Quick deploy new agents
- Select client, agent type, configure

## Firebase Structure

```
/clients
  /{clientId}
    - name
    - industry
    - status
    - agents
    - uptime
    - monthlyCost

/agents
  /{agentId}
    - name
    - clientId
    - status
    - type
    - cpu
    - memory
    - lastRun

/alerts
  /{alertId}
    - severity
    - message
    - timestamp
    - clientId
```

## Connecting OpenClaw

Your OpenClaw agents on your VPS should:

1. Watch Firebase for commands
2. Execute deployments
3. Write status updates back to Firebase

Example agent bridge code provided in `/bridge/openclaw-firebase-bridge.js`

## Next Steps

1. ✅ Dashboard deployed on Vercel
2. ⬜ Create OpenClaw-Firebase bridge agent
3. ⬜ Test with first real client
4. ⬜ Add authentication (Firebase Auth)
5. ⬜ Add billing/usage tracking

## Your Niche

**AI Integration for Semiconductor Test Operations**

First target: Calibration tracking for test floor operations

---

Built by you, for your AI solutions business.