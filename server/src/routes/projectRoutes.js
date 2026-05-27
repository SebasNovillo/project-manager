import { Router } from 'express';
import {
  completeSprint,
  createSprint,
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
router.post('/:projectId/sprints', createSprint);
router.patch('/sprints/:sprintId/complete', completeSprint);

export default router;
