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

async function getOwnedProject(projectId, userId) {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      ownerId: userId
    }
  });

  if (!project) {
    const error = new Error('Project not found');
    error.statusCode = 404;
    throw error;
  }

  return project;
}

export async function updateProjectForUser(projectId, userId, payload) {
  await getOwnedProject(projectId, userId);

  const name = payload.name?.trim();
  const description = payload.description?.trim() || null;

  if (!name) {
    const error = new Error('Project name is required');
    error.statusCode = 400;
    throw error;
  }

  return prisma.project.update({
    where: {
      id: projectId
    },
    data: {
      name,
      description
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

export async function deleteProjectForUser(projectId, userId) {
  await getOwnedProject(projectId, userId);

  await prisma.project.delete({
    where: {
      id: projectId
    }
  });
}
