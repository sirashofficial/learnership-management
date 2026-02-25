/**
 * Attendance Room Management System
 * 
 * Manages WebSocket rooms for real-time collaborative attendance marking.
 * Each session has a dedicated room (room naming: session_${sessionId}) where
 * multiple facilitators can mark attendance simultaneously.
 * 
 * Features:
 * - Room-based isolation per session
 * - Timestamp-based conflict resolution (last-write-wins)
 * - Server authoritative state management
 * - Broadcast updates to all connected clients in room
 */

import { Server as SocketIOServer, Socket } from 'socket.io';

// Types
export interface AttendanceUpdate {
  studentId: string;
  sessionId: string;
  groupId: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  date: string;
  markedBy: string; // User ID
  markedByName: string; // User display name
  timestamp: number; // Server timestamp for conflict resolution
}

export interface JoinRoomPayload {
  sessionId: string;
  userId: string;
  userName: string;
}

export interface RoomState {
  sessionId: string;
  collaborators: Map<string, { socketId: string; userName: string; joinedAt: number }>;
  lastUpdates: Map<string, AttendanceUpdate>; // studentId -> most recent update
}

// Global room state management
const rooms = new Map<string, RoomState>();

/**
 * Get room name for a session
 */
export function getRoomName(sessionId: string): string {
  return `session_${sessionId}`;
}

/**
 * Initialize Socket.io event handlers for attendance rooms
 */
export function initializeAttendanceRooms(io: SocketIOServer): void {
  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Handle joining an attendance room
    socket.on('attendance:join-room', (payload: JoinRoomPayload) => {
      handleJoinRoom(socket, io, payload);
    });

    // Handle attendance marking
    socket.on('attendance:mark', (update: Omit<AttendanceUpdate, 'timestamp'>) => {
      handleAttendanceMark(socket, io, update);
    });

    // Handle leaving a room
    socket.on('attendance:leave-room', ({ sessionId }: { sessionId: string }) => {
      handleLeaveRoom(socket, sessionId);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      handleDisconnect(socket);
    });
  });
}

/**
 * Handle client joining an attendance room
 */
function handleJoinRoom(socket: Socket, io: SocketIOServer, payload: JoinRoomPayload): void {
  const { sessionId, userId, userName } = payload;
  const roomName = getRoomName(sessionId);

  // Join the socket.io room
  socket.join(roomName);

  // Initialize room state if not exists
  if (!rooms.has(roomName)) {
    rooms.set(roomName, {
      sessionId,
      collaborators: new Map(),
      lastUpdates: new Map(),
    });
  }

  const room = rooms.get(roomName)!;
  
  // Add collaborator to room state
  room.collaborators.set(userId, {
    socketId: socket.id,
    userName,
    joinedAt: Date.now(),
  });

  // Store room info in socket data for cleanup
  (socket.data as any).attendanceRooms = (socket.data as any).attendanceRooms || new Set();
  (socket.data as any).attendanceRooms.add(roomName);
  (socket.data as any).userId = userId;

  // Notify all clients in room about new collaborator
  io.to(roomName).emit('attendance:collaborator-joined', {
    userName,
    userId,
    collaboratorCount: room.collaborators.size,
    collaborators: Array.from(room.collaborators.entries()).map(([id, data]) => ({
      userId: id,
      userName: data.userName,
    })),
  });

  console.log(`✅ ${userName} joined room ${roomName} (${room.collaborators.size} collaborators)`);

  // Send current room state to the newly joined client
  socket.emit('attendance:room-state', {
    sessionId,
    collaboratorCount: room.collaborators.size,
    lastUpdates: Array.from(room.lastUpdates.values()),
  });
}

/**
 * Handle attendance marking with conflict resolution
 */
function handleAttendanceMark(
  socket: Socket,
  io: SocketIOServer,
  update: Omit<AttendanceUpdate, 'timestamp'>
): void {
  const roomName = getRoomName(update.sessionId);
  const room = rooms.get(roomName);

  if (!room) {
    socket.emit('attendance:error', {
      message: 'Room not found. Please rejoin the session.',
      code: 'ROOM_NOT_FOUND',
    });
    return;
  }

  // Add server timestamp for conflict resolution
  const serverUpdate: AttendanceUpdate = {
    ...update,
    timestamp: Date.now(),
  };

  // Check for conflicts using last-write-wins strategy
  const existingUpdate = room.lastUpdates.get(update.studentId);
  
  if (existingUpdate) {
    // If there's a recent update from another user, detect conflict
    const timeDiff = serverUpdate.timestamp - existingUpdate.timestamp;
    
    if (timeDiff < 2000 && existingUpdate.markedBy !== update.markedBy) {
      // Conflict detected: two facilitators marked same student within 2 seconds
      console.warn(`⚠️  Conflict detected: ${update.markedByName} and ${existingUpdate.markedByName} marked student ${update.studentId}`);
      
      // Server authority: last write wins, but notify about conflict
      io.to(roomName).emit('attendance:conflict-detected', {
        studentId: update.studentId,
        previousMarkedBy: existingUpdate.markedByName,
        currentMarkedBy: update.markedByName,
        previousStatus: existingUpdate.status,
        currentStatus: update.status,
        resolvedUpdate: serverUpdate, // Server's authoritative state
      });
    }
  }

  // Update room state with latest attendance
  room.lastUpdates.set(update.studentId, serverUpdate);

  // Broadcast update to all clients in the room (except sender)
  socket.to(roomName).emit('attendance:marked', serverUpdate);

  console.log(`📝 ${update.markedByName} marked student ${update.studentId} as ${update.status} in ${roomName}`);
}

/**
 * Handle client leaving a room
 */
function handleLeaveRoom(socket: Socket, sessionId: string): void {
  const roomName = getRoomName(sessionId);
  const room = rooms.get(roomName);
  const userId = (socket.data as any).userId;

  if (room && userId) {
    const collaborator = room.collaborators.get(userId);
    room.collaborators.delete(userId);

    socket.leave(roomName);

    // Notify remaining collaborators
    socket.to(roomName).emit('attendance:collaborator-left', {
      userName: collaborator?.userName,
      userId,
      collaboratorCount: room.collaborators.size,
    });

    console.log(`👋 User ${userId} left room ${roomName} (${room.collaborators.size} remaining)`);

    // Clean up room if empty
    if (room.collaborators.size === 0) {
      rooms.delete(roomName);
      console.log(`🧹 Cleaned up empty room ${roomName}`);
    }
  }
}

/**
 * Handle socket disconnection
 */
function handleDisconnect(socket: Socket): void {
  const userId = (socket.data as any).userId;
  const attendanceRooms = (socket.data as any).attendanceRooms as Set<string> | undefined;

  if (attendanceRooms) {
    attendanceRooms.forEach((roomName) => {
      const room = rooms.get(roomName);
      if (room && userId) {
        const collaborator = room.collaborators.get(userId);
        room.collaborators.delete(userId);

        // Notify remaining collaborators
        socket.to(roomName).emit('attendance:collaborator-left', {
          userName: collaborator?.userName,
          userId,
          collaboratorCount: room.collaborators.size,
        });

        // Clean up empty rooms
        if (room.collaborators.size === 0) {
          rooms.delete(roomName);
          console.log(`🧹 Cleaned up empty room ${roomName}`);
        }
      }
    });
  }

  console.log(`🔌 Socket disconnected: ${socket.id}`);
}

/**
 * Broadcast attendance update to room (called from API routes)
 */
export function broadcastAttendanceUpdate(
  io: SocketIOServer,
  sessionId: string,
  update: AttendanceUpdate
): void {
  const roomName = getRoomName(sessionId);
  const room = rooms.get(roomName);

  if (room) {
    // Update room state
    room.lastUpdates.set(update.studentId, update);
    
    // Broadcast to all clients in room
    io.to(roomName).emit('attendance:marked', update);
    
    console.log(`📡 Broadcasted update for student ${update.studentId} to room ${roomName}`);
  }
}

/**
 * Get current collaborator count for a session
 */
export function getCollaboratorCount(sessionId: string): number {
  const roomName = getRoomName(sessionId);
  const room = rooms.get(roomName);
  return room ? room.collaborators.size : 0;
}

/**
 * Get room statistics (for monitoring/debugging)
 */
export function getRoomStats(): {
  totalRooms: number;
  totalCollaborators: number;
  rooms: Array<{ sessionId: string; collaborators: number }>;
} {
  let totalCollaborators = 0;
  const roomsList: Array<{ sessionId: string; collaborators: number }> = [];

  rooms.forEach((room, roomName) => {
    totalCollaborators += room.collaborators.size;
    roomsList.push({
      sessionId: room.sessionId,
      collaborators: room.collaborators.size,
    });
  });

  return {
    totalRooms: rooms.size,
    totalCollaborators,
    rooms: roomsList,
  };
}
