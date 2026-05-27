import asyncHandler from '../utils/asyncHandler.js';
import {
  completeSprintForUser,
  createSprintForProject,
  createProjectForUser,
  deleteProjectForUser,
  getProjectsForUser,
  updateProjectForUser
} from '../services/projectService.js';

export const getProjects = asyncHandler(async (request, response) => {
  const projects = await getProjectsForUser(request.user.id);

  response.json(projects);
});

export const createProject = asyncHandler(async (request, response) => {
  const project = await createProjectForUser(request.user.id, request.body);

  response.status(201).json(project);
});

export const updateProject = asyncHandler(async (request, response) => {
  const project = await updateProjectForUser(
    request.params.projectId,
    request.user.id,
    request.body
  );

  response.json(project);
});

export const deleteProject = asyncHandler(async (request, response) => {
  await deleteProjectForUser(request.params.projectId, request.user.id);

  response.status(204).send();
});

export const createSprint = asyncHandler(async (request, response) => {
  const sprint = await createSprintForProject(
    request.user.id,
    request.params.projectId,
    request.body
  );

  response.status(201).json(sprint);
});

export const completeSprint = asyncHandler(async (request, response) => {
  const sprint = await completeSprintForUser(request.user.id, request.params.sprintId);

  response.json(sprint);
});
