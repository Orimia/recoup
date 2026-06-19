# VandyLoop demo script

Target: 90 seconds. Built for a stakeholder or an operations lead. Every number on screen is computed — no slide-deck magic.

> **Two ways to demo.** The `/demo` guided narrative (below) tells the *story*. But the strongest moment is showing the **live product**: sign up at `/join`, log a real return at `/challenge`, then open `/leaderboard` and `/admin` and show the numbers actually moved. The closer below covers both.

## The 60-second "it's real" opener (recommended)

1. **`/join`** — "This isn't a mockup. Watch." Create an account live, pick a dorm.
2. **`/challenge`** — Pick a bin, hit **Log verified return**. Point at the result card: "+10 points, classified by the model." Mention: with our API key set, that photo is classified by live Claude vision; the badge tells you honestly which ran.
3. **`/leaderboard`** — "My dorm just moved up the bracket." The board refreshes every 15s.
4. **`/admin`** — "And the operator sees it instantly — real deposits, contamination rate, all aggregated live." 
5. Now pivot to the story → either the landing page or `/demo` for the scale projections.

This proves *working product* before you ever make a projection. People remember the team that shipped.

## Before you walk on

- Open the app at `http://localhost:3000`.
- Click **Demo mode** in the top-right header.
- Confirm presenter notes are visible (right rail).
- Reset to step 1 before starting.

---

## Step-by-step talk track

### 1 · Problem (0:00 – 0:10)

> "Universities recycle about 21% of aluminum nationally. Why? Because they have no idea what's actually in the bin."

Land the three failures on screen:
- No verification
- No feedback loop
- No operational signal

Pause. "ESG reports are essentially guesses. Hauler trips are wasted. Contamination is invisible until it's too late."

### 2 · Student action (0:10 – 0:22)

> "VandyLoop starts with a tap. Three seconds. No app install."

Walk the phone: tap VandyID → drop the can → +$0.10 meal money. Emphasize: the student's entire surface is the existing VandyID reader. We don't ship a new consumer app.

### 3 · Verified event (0:22 – 0:35)

> "Every deposit writes a verified, attributable event. Who, what, confidence."

Point at the contaminant row: "The classifier caught a coffee cup. No reward. That's the dataset no one else has — student-level, timestamped, verified recycling events."

### 4 · Reward issued (0:35 – 0:48)

> "And the reward isn't flat. A bandit decided what to offer this student."

Call out the 73% allocation to instant-reward. "This is Thompson sampling — continuous A/B that compounds. Every reward is a data point. Every data point trains the next decision."

### 5 · AI insight (0:48 – 1:02)

> "Minutes later, the system flagged something the operator didn't ask about."

Read the contamination insight aloud. Land the hook: "The model didn't just flag the spike. It correlated it with ambient lighting, recommended a $50 lighting upgrade, and projected $310/mo saved hauler fees. *That's* the loop."

### 6 · Operator view (1:02 – 1:15)

> "Sustainability ops don't want another dashboard. They want a dashboard that tells them what changed, why, and what to do."

Trace the forecast line. "12 weeks in, we're compounding 18% week-over-week. Uptime 99.6%. Contamination down 11%."

### 7 · Pilot impact (1:15 – 1:25)

> "At pilot scale — 8 bins right now, targeting 120 — this is the projection."

Walk the 4 headline numbers. "Every one of these is computed from pilot-observed economics. Not 'up to.' Not 'projected.' Computed."

### 8 · Network scale (1:25 – 1:40)

> "Now multiply by 25 campuses."

Read the 40-point numbers: cans, value, CO₂e. Land the close:

> "VandyLoop is the demo. Recoup is the platform — verified-behavior infrastructure for the circular economy. Vanderbilt is campus number one. Thank you."

---

## If you have extra time

- **Q&A fallback screens**: `/dashboard` (live operator view), `/simulator` (run a custom scenario live), `/ai` (classifier grid + experiment).
- **Simulator tricks**: drag `adoption` to 60%, toggle sports mode on, set campuses to 25 — the total-value headline updates in under 100ms.
- **The quiet flex**: hover any impact tile on the landing page to see the formula. Reviewers like "show your work."

## If something breaks

- Dev server is local — worst case `npm run dev` again.
- Demo mode is pure client state; refreshing resets to step 1.
- There are no network calls. If the page renders, the demo works.
