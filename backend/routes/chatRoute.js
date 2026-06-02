import express from 'express';
import authUser from '../middleware/auth.js';
import { getChatHistory } from '../socket/chatHandler.js';
import adminAuth from '../middleware/adminAuth.js';
import { getAllChats } from '../socket/chatHandler.js';

const chatRouter = express.Router();

// Route: GET /api/chat/history
chatRouter.get('/history', authUser, getChatHistory);
chatRouter.get('/all-chats', adminAuth, getAllChats);

export default chatRouter;
