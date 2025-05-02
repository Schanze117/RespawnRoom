import express from 'express';

const router = express.Router();

// In-memory storage of active rooms with timestamps and user counts
// This will be lost on server restart - for production, use a database
const activeRooms = new Map();

// Middleware to manage room count
const updateRoomCounter = (roomId, change) => {
  if (!activeRooms.has(roomId)) {
    activeRooms.set(roomId, {
      userCount: 0,
      lastActivity: Date.now(),
      created: Date.now()
    });
  }

  const roomData = activeRooms.get(roomId);
  roomData.userCount += change;
  roomData.lastActivity = Date.now();
  
  console.log(`Room ${roomId}: ${roomData.userCount} users (${change > 0 ? 'join' : 'leave'})`);
  
  // If room is empty, schedule it for cleanup
  if (roomData.userCount <= 0) {
    console.log(`Room ${roomId} is empty, scheduling for cleanup`);
    roomData.scheduledForDeletion = Date.now() + 30000; // 30 seconds grace period
  } else {
    // Room is active, remove deletion schedule
    delete roomData.scheduledForDeletion;
  }
  
  return roomData.userCount;
};

/**
 * @route POST /api/rooms/join
 * @desc Register a user joining a room
 * @access Public
 */
router.post('/join', (req, res) => {
  try {
    const { roomId } = req.body;
    
    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: 'Room ID is required'
      });
    }
    
    const userCount = updateRoomCounter(roomId, 1);
    
    return res.status(200).json({
      success: true,
      roomId,
      userCount
    });
  } catch (error) {
    console.error('Error in room join endpoint:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error processing room join'
    });
  }
});

/**
 * @route POST /api/rooms/leave
 * @desc Register a user leaving a room
 * @access Public
 */
router.post('/leave', (req, res) => {
  try {
    const { roomId } = req.body;
    
    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: 'Room ID is required'
      });
    }
    
    const userCount = updateRoomCounter(roomId, -1);
    
    return res.status(200).json({
      success: true,
      roomId,
      userCount,
      isEmptyRoom: userCount <= 0
    });
  } catch (error) {
    console.error('Error in room leave endpoint:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error processing room leave'
    });
  }
});

/**
 * @route GET /api/rooms/status/:roomId
 * @desc Check if a room exists and get its status
 * @access Public
 */
router.get('/status/:roomId', (req, res) => {
  try {
    const { roomId } = req.params;
    
    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: 'Room ID is required'
      });
    }
    
    const roomExists = activeRooms.has(roomId);
    const roomData = roomExists ? activeRooms.get(roomId) : null;
    
    return res.status(200).json({
      success: true,
      roomId,
      exists: roomExists,
      isActive: roomExists && roomData.userCount > 0,
      userCount: roomExists ? roomData.userCount : 0,
      created: roomExists ? roomData.created : null,
      lastActivity: roomExists ? roomData.lastActivity : null
    });
  } catch (error) {
    console.error('Error in room status endpoint:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error processing room status'
    });
  }
});

/**
 * @route GET /api/rooms/list
 * @desc Get a list of all active rooms
 * @access Public
 */
router.get('/list', (req, res) => {
  try {
    const rooms = [];
    
    activeRooms.forEach((data, roomId) => {
      rooms.push({
        roomId,
        userCount: data.userCount,
        created: data.created,
        lastActivity: data.lastActivity,
        isActive: data.userCount > 0
      });
    });
    
    return res.status(200).json({
      success: true,
      rooms
    });
  } catch (error) {
    console.error('Error in room list endpoint:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error processing room list'
    });
  }
});

// Cleanup job - Run every 60 seconds to remove inactive rooms
setInterval(() => {
  const now = Date.now();
  let roomsRemoved = 0;
  
  activeRooms.forEach((data, roomId) => {
    // Delete rooms that have been empty for more than 30 seconds
    if (data.scheduledForDeletion && now > data.scheduledForDeletion) {
      console.log(`Cleaning up inactive room: ${roomId}`);
      activeRooms.delete(roomId);
      roomsRemoved++;
    }
    
    // Also clean up very old rooms (12 hours), even if they have users
    // This is a fallback to prevent memory leaks from abandoned sessions
    const twelveHoursAgo = now - (12 * 60 * 60 * 1000);
    if (data.lastActivity < twelveHoursAgo) {
      console.log(`Cleaning up stale room: ${roomId} (inactive for >12 hours)`);
      activeRooms.delete(roomId);
      roomsRemoved++;
    }
  });
  
  if (roomsRemoved > 0) {
    console.log(`Room cleanup completed: removed ${roomsRemoved} inactive rooms`);
  }
}, 60000);

export default router; 