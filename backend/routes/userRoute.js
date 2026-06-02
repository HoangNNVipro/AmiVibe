import express from 'express';
import { loginUser, registerUser, adminLogin, listUsers, createUser, updateUser, deleteUser } from '../controllers/userController.js';
import adminAuth from '../middleware/adminAuth.js';

const userRouter = express.Router();

// User routes
userRouter.post('/register', registerUser);
userRouter.post('/login', loginUser);
userRouter.post('/admin', adminLogin);

// Admin routes for user management
userRouter.get('/list', adminAuth, listUsers);
userRouter.post('/create', adminAuth, createUser);
userRouter.post('/update', adminAuth, updateUser);
userRouter.post('/remove', adminAuth, deleteUser);

export default userRouter;

