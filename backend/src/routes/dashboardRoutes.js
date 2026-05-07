import express from 'express';
import { getDashboardOverview } from '../controllers/dashboardController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/overview', verifyToken, getDashboardOverview);

export default router;
