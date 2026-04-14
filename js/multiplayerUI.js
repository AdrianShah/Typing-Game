import { createMultiplayerRoom, getRoomByCode, joinRoomByCode, setReadyStatus, leaveRoom, updateRoomConfig, startRound, subscribeToRoomDetails, restartMatchState, updateHeartbeat } from './multiplayerApi.js';
import { gameState, setMultiplayerGameState, startGame } from './engine.js';
import { getCurrentUser } from './auth.js';

let currentRoomId = null;
let currentParticipantId = null;
let roomUnsubscribe = null;
let heartbeatInterval = null;

let domContext = null; // Container reference

export function initMultiplayerUI() {
  const urlParams = new URLSearchParams(window.location.search);
  const roomCode = urlParams.get('room');
  if (roomCode) {
    showJoinModal(roomCode);
  }
}

function showJoinModal(roomCode) {
  const currentUser = getCurrentUser();
  if (currentUser && currentUser.uid) {
    handleJoinRoom(roomCode, currentUser.uid, null, currentUser.player || 'Player', currentUser.icon || '👤');
  } else {
    setTimeout(() => {
        const nickname = prompt(`Join Room ${roomCode}: Enter Nickname`, 'Guest');
        if (nickname) {
        const guestId = 'guest_' + Math.random().toString(36).substring(2, 9);
        handleJoinRoom(roomCode, null, guestId, nickname, '👤');
        }
    }, 500); // Slight delay for auth load
  }
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
        currentUser.player || 'Host', currentUser.icon || '👤', currentUser.country || null
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
      await handleJoinRoom(code, currentUser.uid, null, currentUser.player || 'Player', currentUser.icon || '👤');
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
}

function disconnectLobby() {
    currentRoomId = null;
    currentParticipantId = null;
    if (roomUnsubscribe) roomUnsubscribe();
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    
    // Clear URL param without refreshing
    history.pushState(null, '', window.location.pathname);
    
    if (domContext) renderMultiplayerScreen(domContext);
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
          
          return `
          <div class="flex items-center justify-between p-3 rounded-lg ${isMe ? 'bg-[#004B23]/20 border border-[#93D6A0]/30' : 'bg-surface-container border border-outline/5'}">
            <div class="flex items-center gap-3">
                <span class="text-2xl">${p.icon || '👤'}</span>
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
              const countMatch = participants.length > 1;
              const disabledStart = (!allReady || !countMatch) && participants.length > 1; // allow solo dev testing if 1
              html += `
                <button id="btn-start" ${disabledStart ? 'disabled' : ''} class="w-full mt-2 ${disabledStart ? 'bg-surface-container text-[#8A9389] opacity-50 cursor-not-allowed' : 'bg-[#004B23] hover:bg-[#003B1C] text-white shadow-[0_0_15px_rgba(0,75,35,0.4)]'} font-bold py-4 rounded-lg uppercase tracking-widest transition-all">
                    ${disabledStart ? 'Waiting for players to ready' : 'Start Match'}
                </button>
              `;
          }
      }
      controlsContainer.innerHTML = html;

      // Event bindings for dynamic buttons
      document.getElementById('btn-toggle-ready')?.addEventListener('click', async () => {
          await setReadyStatus(currentParticipantId, !me.ready);
      });

      document.getElementById('btn-start')?.addEventListener('click', async () => {
          const btn = document.getElementById('btn-start');
          btn.disabled = true;
          btn.innerText = 'Starting...';
          try {
              await startRound(currentRoomId, me.uid || me.guestId);
          } catch(err) {
              alert(err.message);
              btn.disabled = false;
              btn.innerText = 'Start Match';
          }
      });

      document.getElementById('btn-re-host')?.addEventListener('click', async () => {
          await restartMatchState(currentRoomId, me.uid || me.guestId);
      });
  }

  // Handle Game start transition
  import('./engine.js').then((engineMod) => {
    if (activeRound && activeRound.status === 'active' && engineMod.gameState.status !== 'playing') {
      startMultiplayerGame(room, activeRound);
    }
  });
}

function startMultiplayerGame(room, activeRound) {
  const words = activeRound.wordListText.split(' ');
  setMultiplayerGameState(words, room.mode, room.matchType);
  gameState.multiplayerModeData.serverEndTime = activeRound.endsAt;
  gameState.multiplayerModeData.roundId = activeRound._id;
  gameState.multiplayerModeData.roomId = room._id;
  gameState.multiplayerModeData.participantId = currentParticipantId;

  // Let js/ui.js know we need to render the play screen
  import('./ui.js').then(({ renderScreen }) => {
      renderScreen('play');
  });
}

// Added this to export the active multiplayer context for `ui.js` scoring logic
export function getActiveMultiplayerContext() {
    return { currentRoomId, currentParticipantId };
}
