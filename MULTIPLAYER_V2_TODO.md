# V2 MULTIPLAYER FEATURES TODO

## 13. Advanced Multiplayer Features (Post-v1 Expansion)

### A. Match Chat & Emoji Reactions
- **Backend (Convex)**
  - [ ] Add `roomMessages` table: `roomId`, `participantId`, `type` ('text', 'emoji'), `content`, `createdAt`.
  - [ ] Create `sendMessage` mutation with rate limiting/spam protection.
  - [ ] Create `getRoomMessages` query/subscription that returns latest N messages.
- **Frontend**
  - [ ] Lobby: Add a collapsible Chat UI on the side or bottom.
  - [ ] Match: Add floating emoji reactions that pop up over the opponent's progress bar when sent.
  - [ ] Match: Add hotkeys for quick emoji reactions during a live race.

### B. Spectator Mode
- **Backend (Convex)**
  - [ ] Update `roomParticipants` schema to allow `role: 'player' | 'spectator'`.
  - [ ] Update `getRoomDetails` to split list cleanly for the clients.
  - [ ] Guard `setReadyStatus` and `submitRoundAttempt` to reject spectators.
- **Frontend**
  - [ ] Pre-Join: Add "Join as Spectator" choice on the join prompt UI.
  - [ ] Lobby: Display separate "Spectators" list.
  - [ ] Match: Render all player tracks but disable personal typing input area if user is spectator.

### C. Best-of-3 / Tournament Bracket Options
- **Backend (Convex)**
  - [ ] Add `tournamentConfig` to `multiplayerRooms`: `type` ('single', 'bo3', 'bo5', 'bracket').
  - [ ] Track `seriesWins` per participant inside `roomParticipants` or a new subset schema.
  - [ ] Create auto-transition logic in `finalizeRoundResults` to handle next round vs series end.
- **Frontend**
  - [ ] Host Form: Add "Series Length" config dropdown.
  - [ ] Lobby/Match: Display overall series score (e.g., "Match 1 of 3", "Player A: 1 - Player B: 0").

### D. Advanced Anti-Cheat Heuristics
- **Backend (Convex)**
  - [ ] Add hidden attempt metadata: `keystrokeTimeline` (array of `[timestamp, key, correct]`).
  - [ ] Write a verification background job checking `keystrokeTimeline` for:
    - Inhuman constant millisecond intervals (robot pasting).
    - Unrealistic WPM bursts (e.g. typing 300 WPM instantly).
  - [ ] Add a `suspicious` flag to `roundAttempts`.
- **Frontend**
  - [ ] Hook into `engine.js` to batch and securely send timestamped keystrokes locally.

### E. Friends List / Quick Invite Shortcuts
- **Backend (Convex)**
  - [ ] Add `friends` table: `uid`, `friendUid`, `status` ('pending', 'accepted').
  - [ ] Create queries: `getFriendsList`, `getOnlineFriends` (by cross-referencing presence heartbeat).
  - [ ] Add `roomInvitations` table.
- **Frontend**
  - [ ] Profile/Header: Add a "Social" / "Friends" tab.
  - [ ] Lobby: Add "Invite Friend" button next to copy link.
  - [ ] Toast notifications when a friend sends an invite.
