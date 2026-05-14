import { Router } from 'express';
import { updateTask } from '../controllers/taskController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);
router.patch('/:taskId', updateTask);

export default router;
