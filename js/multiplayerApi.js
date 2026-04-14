import { getConvexClient, getConvexWsClient } from './convexClient.js';
import { api } from './convexApi.js';

export async function createMultiplayerRoom(hostUid, mode, difficulty, matchType, maxParticipants, hostPlayerName, hostIcon, hostCountry) {
  const client = getConvexClient();
  return await client.mutation(api.multiplayer.createMultiplayerRoom, {
    hostUid, mode, difficulty, matchType, maxParticipants, hostPlayerName, hostIcon, hostCountry
  });
}

export async function getRoomByCode(roomCode) {
  const client = getConvexClient();
  return await client.query(api.multiplayer.getRoomByCode, { roomCode });
}

export async function joinRoomByCode(roomCode, uid, guestId, player, icon, country) {
  const client = getConvexClient();
  return await client.mutation(api.multiplayer.joinRoomByCode, {
    roomCode, uid: uid || undefined, guestId: guestId || undefined, player, icon, country: country || undefined
  });
}

export async function setReadyStatus(participantId, ready) {
  const client = getConvexClient();
  return await client.mutation(api.multiplayer.setReadyStatus, { participantId, ready });
}

export async function leaveRoom(participantId) {
  const client = getConvexClient();
  return await client.mutation(api.multiplayer.leaveRoom, { participantId });
}

export async function updateRoomConfig(roomId, hostUid, mode, difficulty, matchType, maxParticipants) {
  const client = getConvexClient();
  return await client.mutation(api.multiplayer.updateRoomConfig, { roomId, hostUid, mode, difficulty, matchType, maxParticipants });
}

export async function startRound(roomId, hostUid) {
  const client = getConvexClient();
  return await client.mutation(api.multiplayerMatch.startRound, { roomId, hostUid });
}

export async function submitRoundAttempt(roundId, participantId, grossWPM, netWPM, accuracy, errors, correctWords) {
  const client = getConvexClient();
  return await client.mutation(api.multiplayerMatch.submitRoundAttempt, {
    roundId, participantId, grossWPM, netWPM, accuracy, errors, correctWords
  });
}

export async function restartMatchState(roomId, hostUid) {
  const client = getConvexClient();
  return await client.mutation(api.multiplayerMatch.restartMatchState, { roomId, hostUid });
}

export function subscribeToRoomDetails(roomId, callback) {
  const wsClient = getConvexWsClient();
  return wsClient.onUpdate(api.multiplayer.getRoomDetails, { roomId }, callback);
}

export async function updateHeartbeat(participantId) {
  const client = getConvexClient();
  return await client.mutation(api.multiplayer.updateHeartbeat, { participantId });
}