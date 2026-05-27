import { request } from './api';

export function createSprint(projectId, payload, token) {
  return request(`/projects/${projectId}/sprints`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
}

export function completeSprint(sprintId, token) {
  return request(`/projects/sprints/${sprintId}/complete`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}
