import { createMultiplayerRoom, getRoomByCode, joinRoomByCode, setReadyStatus, leaveRoom, updateRoomConfig, startRound, subscribeToRoomDetails, restartMatchState, updateHeartbeat, subscribeToRoomMessages, sendRoomMessage } from './multiplayerApi.js';
import { gameState, setMultiplayerGameState, startGame } from './engine.js';
import { getCurrentUser } from './auth.js';

let currentRoomId = null;
let currentParticipantId = null;
let roomUnsubscribe = null;
let chatUnsubscribe = null;
let heartbeatInterval = null;
let seenMessageIds = new Set();

let domContext = null; // Container reference
let startingMatchId = null; // Prevent double starting

export function initMultiplayerUI() {
  const urlParams = new URLSearchParams(window.location.search);
  const roomCode = urlParams.get('room');
  if (roomCode) {
    import('./ui.js').then(({ renderScreen }) => {
      renderScreen('multiplayer').then(() => {
        const codeInput = document.getElementById('mp-code');
        if (codeInput) {
          codeInput.value = roomCode;
        }
      });
    });
  }
}

function showJoinModal(roomCode) {
  // Deprecated in favor of the manual join form flow to prevent auto-adding players
}

export async function renderMultiplayerScreen(container) {
  domContext = container;
  if (!currentRoomId) {
    container.innerHTML = getLandingHTML();
    bindLandingEvents();
  } else {
    container.innerHTML = getLobbyHTML();
    bindLobbyEvents();
    // Re-render latest state if already subscribed
  }
}

function getLandingHTML() {
  return `
    <div class="w-full max-w-4xl mx-auto py-8 px-4 flex flex-col gap-8">
      <div class="text-center mb-4">
        <h1 class="text-4xl md:text-5xl font-headline font-black text-[#E0E0E0] tracking-tight mb-2">Multip<span class="text-[#93D6A0]">layer</span></h1>
        <p class="text-[#8A9389]">Type against friends in real-time rooms.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- Host -->
        <div class="bg-surface-container-low/40 p-6 md:p-8 rounded-2xl border border-outline/10 flex flex-col justify-between">
          <h2 class="text-2xl font-bold text-[#E0E0E0] mb-6"><i class="fa-solid fa-house-user mr-2 text-[#93D6A0]"></i>Host Room</h2>
          <form id="host-form" class="space-y-4 flex-grow flex flex-col">
            <div class="space-y-4 flex-grow">
                <div>
                    <label class="block text-xs font-bold text-[#8A9389] uppercase tracking-widest mb-1.5">Game Mode</label>
                    <select id="mp-mode" class="w-full bg-[#1C1B1B] text-[#E0E0E0] rounded-lg p-3 text-sm border border-outline/20 font-semibold focus:border-[#93D6A0] outline-none">
                        <option value="15">15 Seconds</option>
                        <option value="30">30 Seconds</option>
                        <option value="60" selected>60 Seconds</option>
                        <option value="120">120 Sync</option>
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-bold text-[#8A9389] uppercase tracking-widest mb-1.5">Difficulty</label>
                    <select id="mp-diff" class="w-full bg-[#1C1B1B] text-[#E0E0E0] rounded-lg p-3 text-sm border border-outline/20 font-semibold focus:border-[#93D6A0] outline-none">
                        <option value="easy">Easy</option>
                        <option value="medium" selected>Medium</option>
                        <option value="hard">Hard</option>
                        <option value="extreme">Extreme</option>
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-bold text-[#8A9389] uppercase tracking-widest mb-1.5">Match Type</label>
                    <select id="mp-type" class="w-full bg-[#1C1B1B] text-[#E0E0E0] rounded-lg p-3 text-sm border border-outline/20 font-semibold focus:border-[#93D6A0] outline-none">
                        <option value="regular" title="Classic Net WPM scaling">Regular (Net WPM)</option>
                        <option value="penalty" title="Accuracy carries heavier weight">Penalty Shootout (Accuracy Weighted)</option>
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-bold text-[#8A9389] uppercase tracking-widest mb-1.5">Players Limit</label>
                    <select id="mp-max" class="w-full bg-[#1C1B1B] text-[#E0E0E0] rounded-lg p-3 text-sm border border-outline/20 font-semibold focus:border-[#93D6A0] outline-none">
                        <option value="2">2 Players (1v1)</option>
                        <option value="3">3 Players</option>
                        <option value="4" selected>4 Players</option>
                    </select>
                </div>
            </div>
            <button type="submit" class="mt-6 w-full bg-[#004B23] hover:bg-[#003B1C] text-white font-bold py-4 rounded-lg uppercase tracking-widest transition-all">Create Room</button>
          </form>
        </div>

        <!-- Join -->
        <div class="bg-surface-container-low/40 p-6 md:p-8 rounded-2xl border border-outline/10 flex flex-col">
          <h2 class="text-2xl font-bold text-[#E0E0E0] mb-6"><i class="fa-solid fa-right-to-bracket mr-2 text-[#E9C176]"></i>Join Room</h2>
          <form id="join-form" class="space-y-4 flex flex-col flex-grow">
            <div class="flex-grow">
                <label class="block text-xs font-bold text-[#8A9389] uppercase tracking-widest mb-1.5">Room Code</label>
                <input type="text" id="mp-code" autocomplete="off" placeholder="e.g. A1B2C3" maxlength="6" class="w-full bg-[#1C1B1B] text-[#E0E0E0] rounded-lg p-4 text-center text-2xl tracking-[0.2em] font-bold uppercase border border-outline/20 focus:border-[#E9C176] outline-none mb-4">
            </div>
            <button type="submit" class="mt-auto w-full bg-surface-container hover:bg-surface-container-highest text-[#E0E0E0] border border-outline/20 font-bold py-4 rounded-lg uppercase tracking-widest transition-all">Join Game</button>
          </form>
        </div>
      </div>
    </div>
  `;
}

function bindLandingEvents() {
  const hostForm = document.getElementById('host-form');
  const joinForm = document.getElementById('join-form');

  hostForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser.uid) {
      alert('You must be signed in to create a room.');
      return;
    }
    const btn = hostForm.querySelector('button');
    btn.textContent = 'Creating...';
    btn.disabled = true;

    const mode = parseInt(document.getElementById('mp-mode').value);
    const difficulty = document.getElementById('mp-diff').value;
    const type = document.getElementById('mp-type').value;
    const max = parseInt(document.getElementById('mp-max').value);

    try {
      const { roomCode, roomId, participantId } = await createMultiplayerRoom(
        currentUser.uid, mode, difficulty, type, max, 
        currentUser.player || 'Host', currentUser.avatarUrl || currentUser.icon || '👤', currentUser.country || null
      );
      
      currentRoomId = roomId;
      currentParticipantId = participantId;
      
      const joinUrl = `${window.location.origin}${window.location.pathname}?room=${roomCode}`;
      history.pushState(null, '', joinUrl);
      
      enterLobby(roomCode);
    } catch (err) {
      alert('Error creating room: ' + err.message);
      btn.textContent = 'Create Room';
      btn.disabled = false;
    }
  });

  joinForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = document.getElementById('mp-code').value.trim().toUpperCase();
    if (code.length !== 6) {
        alert('Invalid room code');
        return;
    }
    const btn = joinForm.querySelector('button');
    btn.textContent = 'Joining...';
    btn.disabled = true;

    const currentUser = getCurrentUser();
    if (currentUser && currentUser.uid) {
      await handleJoinRoom(code, currentUser.uid, null, currentUser.player || 'Player', currentUser.avatarUrl || currentUser.icon || '👤');
    } else {
      const nickname = prompt(`Join Room ${code}: Enter Nickname`, 'Guest');
      if (nickname) {
         const guestId = 'guest_' + Math.random().toString(36).substring(2, 9);
         await handleJoinRoom(code, null, guestId, nickname, '👤');
      } else {
         btn.textContent = 'Join Game';
         btn.disabled = false;
      }
    }
  });
}

async function handleJoinRoom(roomCode, uid, guestId, player, icon) {
  try {
    const { roomId, participantId } = await joinRoomByCode(roomCode, uid, guestId, player, icon, null);
    currentRoomId = roomId;
    currentParticipantId = participantId;
    enterLobby(roomCode);
  } catch (err) {
    alert('Failed to join room: ' + err.message);
    const btn = document.querySelector('#join-form button');
    if(btn) { btn.textContent = 'Join Game'; btn.disabled = false; }
  }
}

function getLobbyHTML() {
  return `
    <div class="w-full max-w-3xl mx-auto py-8 px-4 flex flex-col gap-6">
      <div class="flex justify-between items-end border-b border-outline/10 pb-4">
        <div>
            <h1 class="text-3xl font-headline font-black text-[#E0E0E0] uppercase tracking-tight">Room Lobby</h1>
            <p class="text-[#8A9389] text-sm mt-1">Waiting for players to ready up.</p>
        </div>
        <button id="lob-leave" class="text-xs uppercase tracking-widest font-bold text-error hover:text-error/80 px-4 py-2 border border-error/20 rounded transition-colors"><i class="fa-solid fa-arrow-right-from-bracket mr-2"></i>Leave</button>
      </div>

      <div class="bg-surface-container-low/40 rounded-xl border border-outline/10 p-6">
         <div class="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
            <div class="flex flex-col">
                <span class="text-[10px] font-bold text-[#8A9389] uppercase tracking-[0.2em] mb-1">Room Code</span>
                <div class="flex items-center gap-3">
                    <span id="lob-code" class="text-3xl font-bold tracking-[0.2em] text-[#E9C176] bg-[#1C1B1B] px-4 py-1 rounded border border-outline/20">---</span>
                    <button id="lob-copy" class="text-[#8A9389] hover:text-white transition-colors" title="Copy Invite Link"><i class="fa-regular fa-copy text-xl"></i></button>
                </div>
            </div>
            
            <div class="flex gap-4 opacity-80" id="lob-settings-view">
               <div class="text-center">
                  <div class="text-[10px] text-[#8A9389] uppercase tracking-wider font-bold mb-1">Mode</div>
                  <div class="text-sm font-bold text-white bg-surface-container px-3 py-1 rounded" id="st-mode">-</div>
               </div>
               <div class="text-center">
                  <div class="text-[10px] text-[#8A9389] uppercase tracking-wider font-bold mb-1">Diff</div>
                  <div class="text-sm font-bold text-white bg-surface-container px-3 py-1 rounded uppercase capitalize" id="st-diff">-</div>
               </div>
               <div class="text-center">
                  <div class="text-[10px] text-[#8A9389] uppercase tracking-wider font-bold mb-1">Type</div>
                  <div class="text-sm font-bold text-white bg-surface-container px-3 py-1 rounded capitalize" id="st-type">-</div>
               </div>
            </div>
         </div>

         <div class="mb-6">
            <div class="flex justify-between items-center mb-3">
                <h3 class="text-xs uppercase tracking-widest font-bold text-[#8A9389]">Participants (<span id="lob-count">0/0</span>)</h3>
            </div>
            <div id="lob-players" class="flex flex-col gap-3">
                <!-- Players injected here -->
                <div class="animate-pulse flex items-center justify-center p-8 text-[#8A9389]"><i class="fa-solid fa-spinner fa-spin mr-2"></i> Loading room data...</div>
            </div>
         </div>

         <div class="flex flex-col gap-3 mt-8 pt-6 border-t border-outline/10" id="lob-controls">
            <!-- Toggles and Start injected here -->
         </div>
         
         <div class="mt-8 pt-6 border-t border-outline/10">
            <h3 class="text-xs uppercase tracking-widest font-bold text-[#8A9389] flex items-center mb-4"><i class="fa-regular fa-comment-dots mr-2"></i>Lobby Chat</h3>
            <div id="lob-chat-history" class="bg-[#131313] border border-outline/5 rounded-lg h-48 overflow-y-auto mb-3 p-4 flex flex-col gap-2 font-body text-sm custom-scrollbar">
                <!-- Messages go here -->
            </div>
            <form id="lob-chat-form" class="flex gap-2">
                <input type="text" id="lob-chat-input" class="flex-grow bg-[#1C1B1B] text-[#E0E0E0] rounded-lg px-4 py-3 text-sm border border-outline/20 font-semibold focus:border-[#93D6A0] outline-none placeholder:text-[#8A9389]/50" placeholder="Say something..." autocomplete="off" maxlength="150" />
                <button type="submit" class="bg-surface-container hover:bg-[#E9C176]/20 text-[#E9C176] px-6 rounded-lg transition-colors border border-outline/10 hover:border-[#E9C176]/50"><i class="fa-solid fa-paper-plane"></i></button>
            </form>
         </div>

      </div>
    </div>
  `;
}

function bindLobbyEvents() {
    document.getElementById('lob-leave')?.addEventListener('click', async () => {
        if(confirm("Are you sure you want to leave?")) {
            await leaveRoom(currentParticipantId);
            disconnectLobby();
        }
    });

    document.getElementById('lob-copy')?.addEventListener('click', () => {
        const span = document.getElementById('lob-code');
        if (span.innerText.length !== 6) return;
        const link = `${window.location.origin}${window.location.pathname}?room=${span.innerText}`;
        navigator.clipboard.writeText(link);
        alert('Invite link copied!');
    });
}

function enterLobby(roomCode) {
  if (domContext) {
      domContext.innerHTML = getLobbyHTML();
      bindLobbyEvents();
      document.getElementById('lob-code').innerText = roomCode;
  }
  
  if (roomUnsubscribe) roomUnsubscribe();
  if (chatUnsubscribe) chatUnsubscribe();
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  
  heartbeatInterval = setInterval(() => {
    if (currentParticipantId) updateHeartbeat(currentParticipantId).catch(()=>{});
  }, 15000);

  roomUnsubscribe = subscribeToRoomDetails(currentRoomId, (data) => {
    if (!data || !data.room) {
       disconnectLobby(); // Room closed or we got kicked
       return;
    }
    renderLobbyUpdate(data.room, data.participants, data.activeRound);
  });

  chatUnsubscribe = subscribeToRoomMessages(currentRoomId, (messages) => {
    messages.forEach(msg => {
        if (!seenMessageIds.has(msg._id)) {
            seenMessageIds.add(msg._id);
            // Only animate if the message was sent in the last 5 seconds to avoid history burst
            if (msg.type === 'emoji' && (Date.now() - msg.createdAt < 5000)) {
                showInGameEmoji(msg.participantId, msg.content);
            }
        }
    });
    renderChatUpdate(messages);
  });

  const chatForm = document.getElementById('lob-chat-form');
  chatForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('lob-chat-input');
    const msg = input.value.trim();
    if (!msg) return;

    input.value = '';
    try {
        await sendRoomMessage(currentRoomId, currentParticipantId, 'text', msg);
    } catch(err) {
        alert("Couldn't send message: " + err.message);
    }
  });
}

function disconnectLobby() {
    currentRoomId = null;
    currentParticipantId = null;
    if (roomUnsubscribe) roomUnsubscribe();
    if (chatUnsubscribe) chatUnsubscribe();
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    
    // Clear URL param without refreshing
    history.pushState(null, '', window.location.pathname);
    
    if (domContext) renderMultiplayerScreen(domContext);
}

function renderChatUpdate(messages) {
  const chatContainer = document.getElementById('lob-chat-history');
  if (!chatContainer) return;

  const isAtBottom = chatContainer.scrollHeight - chatContainer.scrollTop <= chatContainer.clientHeight + 10;

  chatContainer.innerHTML = messages.map(msg => {
     // NOTE: This assumes we resolve full participant names on the backend or locally.
     // For speed, let's just make it bold message content and rely on UI cues.
     const isMe = msg.participantId === currentParticipantId;
     const timeStr = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

     return `
     <div class="flex flex-col ${isMe ? 'items-end' : 'items-start'}">
        <span class="text-[10px] text-[#8A9389] mb-1 font-semibold uppercase tracking-widest">${timeStr}</span>
        <div class="max-w-[80%] rounded-xl px-4 py-2 ${isMe ? 'bg-[#004B23]/90 text-white rounded-tr-none' : 'bg-surface-container text-[#E0E0E0] rounded-tl-none'} break-words">
            ${escapeHtml(msg.content)}
        </div>
     </div>
     `;
  }).join('');

  if (isAtBottom) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
  }
}

function escapeHtml(unsafe) {
    return (unsafe || '').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function renderLobbyUpdate(room, participants, activeRound) {
  if (!domContext) return;

  // Sync settings view
  if(document.getElementById('st-mode')) {
      document.getElementById('st-mode').innerText = room.mode + 's';
      document.getElementById('st-diff').innerText = room.difficulty;
      document.getElementById('st-type').innerText = room.matchType;
      document.getElementById('lob-count').innerText = `${participants.length}/${room.maxParticipants}`;
  }

  // Check if we are still in participants
  const me = participants.find(p => p._id === currentParticipantId);
  if (!me) {
      alert("You have left or been removed from the room.");
      disconnectLobby();
      return;
  }

  const isHost = (me.uid === room.hostUid) || (me.guestId === room.hostUid);

  // Render players
  const playersContainer = document.getElementById('lob-players');
  if (playersContainer) {
      playersContainer.innerHTML = participants.map((p, index) => {
          const isMe = p._id === currentParticipantId;
          const userIsHost = (p.uid === room.hostUid) || (p.guestId === room.hostUid);
          const active = Date.now() - p.lastSeenAt < 30000;
          
          const iconHtml = p.icon && p.icon.startsWith('http') 
              ? `<img src="${p.icon}" class="w-8 h-8 rounded-full border border-outline/20 object-cover" alt="avatar">` 
              : `<span class="text-2xl">${p.icon || '👤'}</span>`;
              
          return `
          <div class="flex items-center justify-between p-3 rounded-lg ${isMe ? 'bg-[#004B23]/20 border border-[#93D6A0]/30' : 'bg-surface-container border border-outline/5'}">
            <div class="flex items-center gap-3">
                ${iconHtml}
                <div class="flex flex-col">
                    <span class="font-bold text-white flex items-center gap-2">
                        ${p.player} ${isMe ? '<span class="text-[9px] bg-[#93D6A0] text-black px-1.5 py-0.5 rounded uppercase">You</span>' : ''}
                        ${userIsHost ? '<i class="fa-solid fa-crown text-[#E9C176] text-xs ml-1" title="Host"></i>' : ''}
                    </span>
                    <span class="text-[10px] ${active ? 'text-[#93D6A0]' : 'text-error'} uppercase tracking-widest font-bold">
                        ${active ? 'Online' : 'Disconnected'}
                    </span>
                </div>
            </div>
            <div class="flex items-center gap-4">
                ${p.ready ? 
                    '<span class="text-[#93D6A0] text-xs font-bold uppercase tracking-widest flex items-center"><i class="fa-solid fa-check-circle mr-1"></i> Ready</span>' : 
                    '<span class="text-[#8A9389] text-xs font-bold uppercase tracking-widest flex items-center"><i class="fa-regular fa-clock mr-1"></i> Waiting</span>'
                }
            </div>
          </div>
          `;
      }).join('');
  }

  // Render controls
  const controlsContainer = document.getElementById('lob-controls');
  if (controlsContainer) {
      let html = '';
      const allReady = participants.every(p => p.ready);

      if (room.status === 'finished') {
          if (isHost) {
              html += `<button id="btn-re-host" class="w-full bg-surface-container-highest hover:bg-surface-container-highest/80 text-white font-bold py-4 rounded-lg uppercase tracking-widest transition-all">Setup Rematch</button>`;
          } else {
              html += `<div class="text-center text-[#8A9389] font-bold uppercase tracking-widest p-4">Waiting for host to setup rematch...</div>`;
          }
      } else {
          // Ready toggle
          if (me.ready) {
              html += `<button id="btn-toggle-ready" class="w-full bg-surface-container hover:bg-surface-container-highest border border-outline/20 text-[#8A9389] font-bold py-4 rounded-lg uppercase tracking-widest transition-all">Wait, not ready</button>`;
          } else {
              html += `<button id="btn-toggle-ready" class="w-full bg-[#E9C176] hover:bg-[#ffe09e] text-black font-bold py-4 rounded-lg uppercase tracking-widest transition-all border border-transparent shadow-[0_0_15px_rgba(233,193,118,0.2)]">Ready Up</button>`;
          }

          if (isHost) {
              const disabledStart = !allReady || participants.length < 2; 
              
              if (!disabledStart) {
                  html += `<div class="text-center text-[#93D6A0] font-bold uppercase tracking-widest p-4 pb-2 animate-pulse font-headline">Starting Match...</div>`;
                  
                  if (activeRound == null && room.status === 'waiting' && startingMatchId !== room._id) {
                      startingMatchId = room._id;
                      startRound(currentRoomId, me.uid || me.guestId).catch(err => {
                          alert("Failed to start match: " + err.message);
                          startingMatchId = null;
                      });
                  }
              } else {
                  html += `<div class="text-center text-[#8A9389] opacity-50 font-bold uppercase tracking-widest p-4 pb-2 font-headline text-sm">
                      ${participants.length < 2 ? 'Waiting for players to join' : 'Waiting for players to ready'}
                  </div>`;
              }
          }
      }
      controlsContainer.innerHTML = html;

      // Event bindings for dynamic buttons
      document.getElementById('btn-toggle-ready')?.addEventListener('click', async () => {
          await setReadyStatus(currentParticipantId, !me.ready);
      });

      document.getElementById('btn-re-host')?.addEventListener('click', async () => {
          startingMatchId = null;
          await restartMatchState(currentRoomId, me.uid || me.guestId);
      });
  }

  // Handle Game start transition
  import('./engine.js').then((engineMod) => {
    // Only transition if we haven't already processed this exact round
    const isNewRound = engineMod.gameState.multiplayerModeData?.roundId !== activeRound?._id;
    if (activeRound && activeRound.status === 'active' && isNewRound) {
      startMultiplayerGame(room, activeRound, participants);
    }
  });
}

function startMultiplayerGame(room, activeRound, participants) {
  const words = activeRound.wordListText.split(' ');
  setMultiplayerGameState(words, room.mode, room.matchType);
  gameState.multiplayerModeData.serverStartTime = activeRound.startedAt;
  gameState.multiplayerModeData.serverEndTime = activeRound.endsAt;
  gameState.multiplayerModeData.roundId = activeRound._id;
  gameState.multiplayerModeData.roomId = room._id;
  gameState.multiplayerModeData.participantId = currentParticipantId;
  gameState.multiplayerModeData.participants = participants;

  // Let js/ui.js know we need to render the play screen
  import('./ui.js').then(({ renderScreen }) => {
      renderScreen('play');
  });
}

// Added this to export the active multiplayer context for `ui.js` scoring logic
export function getActiveMultiplayerContext() {
    return { currentRoomId, currentParticipantId };
}






export function showInGameEmoji(participantId, emojiContent) {
    const popup = document.getElementById('emoji-popup-' + participantId);
    if (!popup) return;
    
    popup.style.opacity = '1';
    
    const span = document.createElement('span');
    span.innerText = emojiContent;
    span.className = 'absolute -bottom-4 left-1/2 -translate-x-1/2 transition-all duration-[2000ms] ease-out drop-shadow-md text-3xl font-emoji z-[100] scale-50 block pointer-events-none opacity-100';
    popup.appendChild(span);
    
    requestAnimationFrame(() => {
        popup.getBoundingClientRect(); // force reflow
        const driftX = Math.round((Math.random() - 0.5) * 80);
        span.style.transform = 'translate(calc(-50% + ' + driftX + 'px), -120px) scale(2.5)';
        span.style.opacity = '0';
    });
    
    setTimeout(() => {
        span.remove();
        if (popup.children.length === 0) {
            popup.style.opacity = '0';
        }
    }, 2000);
}
