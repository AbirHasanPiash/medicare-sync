import express from 'express';
import {
  registerUser,
  loginUser,
  getMe,
  forgotPassword,
  resetPassword,
} from '../controllers/authController.js';
import { verifyToken, requireRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', verifyToken, getMe);

// Password Recovery Routes
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);

router.get('/admin-only', verifyToken, requireRole(['ADMIN']), (req, res) => {
  res.status(200).json({ message: 'Welcome Admin' });
});

export default router;
