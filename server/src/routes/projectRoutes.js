import { Router } from 'express';
import {
  createProject,
  deleteProject,
  getProjects,
  updateProject
} from '../controllers/projectController.js';
import { createTask } from '../controllers/taskController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);
router.get('/', getProjects);
router.post('/', createProject);
router.post('/:projectId', updateProject);
router.patch('/:projectId', updateProject);
router.put('/:projectId', updateProject);
router.delete('/:projectId', deleteProject);
router.post('/:projectId/tasks', createTask);

export default router;
