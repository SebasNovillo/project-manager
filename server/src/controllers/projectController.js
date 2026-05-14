import asyncHandler from '../utils/asyncHandler.js';
import {
  createProjectForUser,
  getProjectsForUser
} from '../services/projectService.js';

export const getProjects = asyncHandler(async (request, response) => {
  const projects = await getProjectsForUser(request.user.id);

  response.json(projects);
});

export const createProject = asyncHandler(async (request, response) => {
  const project = await createProjectForUser(request.user.id, request.body);

  response.status(201).json(project);
});

