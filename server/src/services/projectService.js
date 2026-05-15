import prisma from '../utils/prisma.js';
import { buildSeededColumns } from '../utils/projectSeed.js';

export async function getProjectsForUser(userId) {
  return prisma.project.findMany({
    where: {
      ownerId: userId
    },
    include: {
      columns: {
        include: {
          tasks: {
            orderBy: {
              position: 'asc'
            }
          }
        },
        orderBy: {
          position: 'asc'
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
}

export async function createProjectForUser(userId, payload) {
  const name = payload.name?.trim();
  const description = payload.description?.trim() || null;

  if (!name) {
    const error = new Error('Project name is required');
    error.statusCode = 400;
    throw error;
  }

  return prisma.project.create({
    data: {
      name,
      description,
      ownerId: userId,
      columns: {
        create: buildSeededColumns()
      }
    },
    include: {
      columns: {
        include: {
          tasks: {
            orderBy: {
              position: 'asc'
            }
          }
        },
        orderBy: {
          position: 'asc'
        }
      }
    }
  });
}
