# Visionary.me

**Your Personal AI Chief of Staff.**

Visionary.me is a voice-first task manager designed to listen, think, and act alongside you. Unlike traditional todo lists that require manual entry, Visionary acts as an intelligent partner—capturing tasks from natural conversation, breaking down complex goals into actionable steps, and helping you navigate from idea to execution.

---

## The Philosophy

**Your goals are Summits. Your tasks are the Path.**

We believe that productivity tools should feel like a partnership, not a burden. Visionary uses the metaphor of climbing a mountain to make progress feel tangible and rewarding.
*   **Summits**: The big, ambitious goals you want to achieve.
*   **The Path**: The concrete steps needed to get there.
*   **Chief of Staff**: The AI partner that clears the way.

## Key Features

### 🎙️ Voice-First Interface
Speak naturally to your Chief of Staff. It listens to your stream of thought, understands context, and proactively records action items. No more stopping to type—just talk and watch your plan take shape.

### 🧠 Intelligent Breakdown
Facing a daunting project? Define your "Summit" and let the AI break it down. Whether it's "Launch a Product" or "Plan a Trip," Visionary instantly generates a logical, step-by-step path to success.

### 🔒 Privacy & Sovereignty
*   **Local-First**: Your data lives in your browser's local storage.
*   **No Sign-Up**: Just open the app and start. No accounts, no passwords.
*   **BYO Intelligence**: Connect your own Google Gemini API key for full cloud capabilities, or explore local fallback options.

### ✨ Ambient Design
Experience a distraction-free interface built with glassmorphism and fluid animations. The ambient orb visualizer provides subtle, real-time feedback during voice interactions, making the AI feel present and alive.

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **React 19** | Modern UI framework |
| **TypeScript** | Type safety & developer experience |
| **Vite** | Lightning-fast build tool |
| **Google Gemini** | Voice understanding & reasoning |
| **Lucide React** | Beautiful, consistent iconography |

---

## Quick Start

### Prerequisites
*   Node.js (v18+)
*   A valid Google Gemini API Key

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/visionary.me.git
cd visionary.me

# Install dependencies
npm install

# Set up your environment (optional)
echo "GEMINI_API_KEY=your_key_here" > .env.local

# Start the development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
npm run preview
```

---

## Project Structure

```
visionary.me/
├── App.tsx           # Main application core
├── components/       # UI building blocks (Orb, TaskNode, etc.)
├── services/         # AI integrations & logic
├── hooks/            # Custom React hooks
├── public/           # Static assets
└── docs/             # Product documentation & roadmap
```

---

## Roadmap

We are constantly evolving. Check out our [Product Roadmap](./docs/PRODUCT_ROADMAP.md) to see what's coming next, including:
*   Undo/Redo capabilities
*   Live voice transcription
*   Progress visualization
*   Data export options

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

<div align="center">

**Visionary.me** — *Conquer your mountains, one step at a time.*

</div>
