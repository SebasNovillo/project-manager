import asyncHandler from '../utils/asyncHandler.js';
import { createTaskForProject, updateTaskForUser } from '../services/taskService.js';

export const createTask = asyncHandler(async (request, response) => {
  const task = await createTaskForProject(
    request.user.id,
    request.params.projectId,
    request.body
  );

  response.status(201).json(task);
});

export const updateTask = asyncHandler(async (request, response) => {
  const task = await updateTaskForUser(
    request.user.id,
    request.params.taskId,
    request.body
  );

  response.json(task);
});
