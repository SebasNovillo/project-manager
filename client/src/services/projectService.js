import { API_URL, request } from './api';

async function sendProjectUpdate(projectId, payload, token, method) {
  const response = await fetch(`${API_URL}/projects/${projectId}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  if (response.ok) {
    return response.json();
  }

  const error = await response.json().catch(() => ({}));
  const failure = new Error(error.message || 'Request failed');
  failure.status = response.status;
  throw failure;
}

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

export function updateProject(projectId, payload, token) {
  return sendProjectUpdate(projectId, payload, token, 'PUT').catch((error) => {
    const shouldRetry =
      error.status === 404 &&
      typeof error.message === 'string' &&
      error.message.includes('Route not found');

    if (!shouldRetry) {
      throw error;
    }

    return sendProjectUpdate(projectId, payload, token, 'PATCH').catch((patchError) => {
      if (
        patchError.status === 404 &&
        typeof patchError.message === 'string' &&
        patchError.message.includes('Route not found')
      ) {
        return sendProjectUpdate(projectId, payload, token, 'POST');
      }

      throw patchError;
    });
  });
}

export function deleteProject(projectId, token) {
  return request(`/projects/${projectId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}
