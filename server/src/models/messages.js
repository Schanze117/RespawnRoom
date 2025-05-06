import { Schema, model } from 'mongoose';

const messageSchema = new Schema(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    read: {
      type: Boolean,
      default: false,
    }
  },
  {
    timestamps: true
  }
);

// Index for efficient querying of conversations
messageSchema.index({ senderId: 1, receiverId: 1, timestamp: -1 });

// Create a messages collection with automatic TTL (Time To Live)
// This ensures the collection doesn't grow infinitely by automatically removing old messages
messageSchema.index({ timestamp: 1 }, { 
  expireAfterSeconds: 60 * 60 * 24 * 30 * 3 // 3 months in seconds
});

const Message = model('Message', messageSchema);

export default Message; 