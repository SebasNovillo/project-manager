import bcrypt from 'bcrypt';
import prisma from '../utils/prisma.js';
import { createToken } from '../utils/token.js';
import { buildSeededColumns } from '../utils/projectSeed.js';

function formatAuthResponse(user) {
  return {
    token: createToken(user.id),
    user: {
      id: user.id,
      name: user.name,
      email: user.email
    }
  };
}

export async function registerUser(payload) {
  const { name, email, password } = payload;

  if (!name || !email || !password) {
    const error = new Error('Name, email, and password are required');
    error.statusCode = 400;
    throw error;
  }

  const existingUser = await prisma.user.findUnique({
    where: {
      email
    }
  });

  if (existingUser) {
    const error = new Error('Email is already in use');
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash
    }
  });

  await prisma.project.create({
    data: {
      name: 'Getting Started',
      description: 'An onboarding project with starter tasks so your workspace never feels empty.',
      ownerId: user.id,
      columns: {
        create: buildSeededColumns()
      }
    }
  });

  return formatAuthResponse(user);
}

export async function loginUser(payload) {
  const { email, password } = payload;

  if (!email || !password) {
    const error = new Error('Email and password are required');
    error.statusCode = 400;
    throw error;
  }

  const user = await prisma.user.findUnique({
    where: {
      email
    }
  });

  if (!user) {
    const error = new Error('Invalid credentials');
    error.statusCode = 401;
    throw error;
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    const error = new Error('Invalid credentials');
    error.statusCode = 401;
    throw error;
  }

  return formatAuthResponse(user);
}
