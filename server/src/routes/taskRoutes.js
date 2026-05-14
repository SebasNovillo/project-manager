import { Router } from 'express';
import { deleteTask, updateTask } from '../controllers/taskController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);
router.patch('/:taskId', updateTask);
router.delete('/:taskId', deleteTask);

export default router;
