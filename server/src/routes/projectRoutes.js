import { Router } from 'express';
import {
  createProject,
  getProjects
} from '../controllers/projectController.js';
import { createTask } from '../controllers/taskController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);
router.get('/', getProjects);
router.post('/', createProject);
router.post('/:projectId/tasks', createTask);

export default router;
