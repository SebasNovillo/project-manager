import asyncHandler from '../utils/asyncHandler.js';
import { loginUser, registerUser } from '../services/authService.js';

export const register = asyncHandler(async (request, response) => {
  const user = await registerUser(request.body);

  response.status(201).json(user);
});

export const login = asyncHandler(async (request, response) => {
  const user = await loginUser(request.body);

  response.json(user);
});

