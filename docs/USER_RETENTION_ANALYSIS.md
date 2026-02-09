# Visionary.me - User Retention & Virality Analysis

*"I just discovered this app. What would make me come back tomorrow? What would make me text my friend about it?"*

---

## Why I Might Stop Using It (Retention Risks)

### Day 1 Dropoff
- **"Cool voice demo, but..."** - I tried voice, it was neat, but then what? No hook to return.
- **"Where did my stuff go?"** - I added tasks on my phone, now I'm on my laptop and they're gone.
- **"I deleted something by accident"** - Panic, no undo, I close the tab.

### Week 1 Dropoff
- **"It's just a todo list"** - The AI novelty wore off. I need reminders, it doesn't have them.
- **"I don't feel progress"** - I completed 20 tasks but nothing celebrated me.
- **"My friend uses Todoist and we can't share lists"** - No collaboration = solo tool.

### Month 1 Dropoff
- **"I have 50 tasks now, can't find anything"** - No search, no filters, no tags.
- **"The dark theme hurts my eyes at 2pm"** - No light mode alternative.
- **"I'm worried about losing my data"** - localStorage feels fragile.

---

## What Would Make Me Come Back Daily (Retention Hooks)

### 1. Morning Ritual Hook
**Feature**: "Today's Path" - A morning digest of 3 tasks AI recommends tackling today.
- Push notification or email: "Good morning! Ready to conquer [Task]?"
- Creates daily habit of checking the app
- Voice: "Welcome back! Yesterday you conquered 3 peaks. Today I'd suggest starting with..."

### 2. Streak & Progress Hook
**Feature**: "Summit Streak"
- "You've been climbing for 7 days straight"
- Visible streak counter in header
- Streak breaks feel bad → come back to restore it

### 3. Completion Dopamine Hook
**Feature**: Micro-celebrations
- Confetti animation when completing a parent task with all subtasks
- Sound effect option (subtle chime)
- Weekly summary: "This week: 12 tasks conquered, 3 summits reached"

### 4. Unfinished Business Hook
**Feature**: Gentle nudges for stale tasks
- After 3 days: Task gets subtle amber glow
- AI might say: "I noticed [Task] has been waiting. Want me to break it down differently?"
- Creates urgency without stress

---

## What Would Make Me Tell a Friend (Virality Triggers)

### 1. The "Wait, It Just Did That?!" Moment
**Trigger**: First time voice AI auto-adds a task during conversation.
- User: "I should probably call mom this weekend"
- AI: "Added 'Call mom' to your list."
- User: *immediately texts friend*

**How to amplify**:
- After first auto-add, show tooltip: "I added that for you! Tell a friend →" with share link
- Make the magic moment MORE visible (flash the added task, play sound)

### 2. The Shareable Artifact
**Trigger**: Something worth screenshotting or sending.

**Ideas**:
- **Weekly Report Card**: Beautiful visual summary of accomplishments
  - "This week: 15 tasks, 2 major goals, 45 minutes of voice coaching"
  - Big "Share My Week" button → generates image for Twitter/Instagram
- **Goal Completion Certificate**: When a major goal is done
  - "Summit Reached: Launch Side Project"
  - Shareable image with app branding

### 3. The "You Should Try This" Moment
**Trigger**: User experiences friction in another tool, remembers Visionary.

**How to create**:
- Be opinionated about the problem: "Most todo apps make you do the work. Visionary does it for you."
- Make export easy: "Copy my task tree as Markdown" → paste into Notion, looks great, credits Visionary
- Referral program: "Give a friend 1 month of Pro" (when Pro exists)

### 4. The Collaborative Pull
**Trigger**: User wants to share a project with someone.

**Current gap**: Zero multiplayer. Can't even share a read-only view.

**Quick fix**:
- "Share as Link" → generates read-only web view of task tree
- Viewer sees: "Created with Visionary.me - Try it free"
- Friend signs up to create their own

### 5. The Embedded Flex
**Trigger**: User mentions accomplishment somewhere, app is visible.

**Ideas**:
- Browser extension: "Currently conquering: [Task]" status for Slack/Discord
- "Add to calendar" when completing a major goal → event title includes "Conquered with Visionary"
- Integration with daily standup tools: "My Visionary goals for today..."

---

## Viral Loop Design (If Building for Growth)

```
┌─────────────────────────────────────────────────────────┐
│  1. USER DISCOVERS APP                                  │
│     └─ Via friend's share, Twitter screenshot, search   │
└────────────────────┬────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────┐
│  2. FIRST MAGIC MOMENT (< 60 seconds)                   │
│     └─ Voice auto-adds task, or breakdown "just works"  │
└────────────────────┬────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────┐
│  3. DAILY HOOK ESTABLISHED                              │
│     └─ Morning digest, streak, unfinished task nudge    │
└────────────────────┬────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────┐
│  4. SHARE TRIGGER ACTIVATED                             │
│     └─ Weekly report, goal completion, "Share Link"     │
└────────────────────┬────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────┐
│  5. FRIEND RECEIVES SHARE                               │
│     └─ Beautiful artifact with clear CTA to try app     │
└────────────────────┴────────────────────────────────────┘
                     ▼
          ↺ Repeat from Step 1
```

---

## Retention & Virality Quick Wins

| Feature | Retention Impact | Virality Impact | Effort |
|---------|------------------|-----------------|--------|
| Streak counter | High | Low | Low |
| Weekly summary image | Medium | High | Medium |
| Share task tree as link | Low | High | Medium |
| "Copy as Markdown" | Low | Medium | Low |
| Completion confetti | Medium | Low | Low |
| Morning "Today's Path" | High | Low | Medium |
| First-magic tooltip + share | Low | High | Low |

---

## The One Thing to Ship for Virality

**If I could only add ONE feature for word-of-mouth growth:**

→ **Shareable Weekly Summary Image**

Why:
1. Forces users to reflect on accomplishments (retention)
2. Creates beautiful, branded artifact (virality)
3. One-click share to Twitter/Instagram (low friction)
4. Includes "Try Visionary.me" watermark (attribution)
5. Shows progress over time (habit formation)

Mock content:
```
┌──────────────────────────────────────┐
│  🏔️ MY WEEK IN VISIONARY             │
│                                      │
│  ✓ 14 tasks conquered                │
│  ✓ 2 summits reached                 │
│  ✓ 23 min voice coaching             │
│                                      │
│  Top achievement:                    │
│  "Launch MVP" - DONE ✓               │
│                                      │
│  📊 4-week streak 🔥                 │
│                                      │
│  ─────────────────────────────       │
│  Try Visionary.me - free             │
└──────────────────────────────────────┘
```

---

## Summary: What Would Make Me Stay & Share

**Stay because:**
- I feel progress (streaks, metrics, celebrations)
- I'm afraid to break my streak
- Morning digest gives me direction
- My data feels safe (export, sync)

**Share because:**
- The "auto-add" moment is genuinely surprising
- Weekly summary makes me look productive
- I can share a goal tree with my team
- Completion certificates are brag-worthy
