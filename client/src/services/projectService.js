import { request } from './api';

export function getProjects(token) {
  return request('/projects', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function createProject(payload, token) {
  return request('/projects', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
}
