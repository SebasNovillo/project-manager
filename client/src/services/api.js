const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request(path, options = {}) {
  let response;
  const { headers: optionHeaders = {}, ...restOptions } = options;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...restOptions,
      headers: {
        'Content-Type': 'application/json',
        ...optionHeaders
      }
    });
  } catch (error) {
    throw new Error(
      'We could not complete your request right now. Please try again in a moment.'
    );
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new ApiError(error.message || 'Request failed', response.status);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export { API_URL, ApiError, request };
