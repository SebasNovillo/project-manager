import prisma from '../utils/prisma.js';
import { buildSeededColumns } from '../utils/projectSeed.js';

const projectDetailInclude = {
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
  },
  sprints: {
    include: {
      tasks: {
        select: {
          id: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  }
};

export async function getProjectsForUser(userId) {
  return prisma.project.findMany({
    where: {
      ownerId: userId
    },
    include: projectDetailInclude,
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
    include: projectDetailInclude
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
    include: projectDetailInclude
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

export async function createSprintForProject(userId, projectId, payload) {
  await getOwnedProject(projectId, userId);

  const name = payload.name?.trim();
  const goal = payload.goal?.trim() || null;
  const endDateValue = payload.endDate;
  const parsedEndDate =
    endDateValue === undefined || endDateValue === null || endDateValue === ''
      ? null
      : new Date(endDateValue);

  if (!name) {
    const error = new Error('Sprint name is required');
    error.statusCode = 400;
    throw error;
  }

  if (parsedEndDate && Number.isNaN(parsedEndDate.getTime())) {
    const error = new Error('Sprint end date is invalid');
    error.statusCode = 400;
    throw error;
  }

  const activeSprint = await prisma.sprint.findFirst({
    where: {
      projectId,
      status: 'active'
    }
  });

  if (activeSprint) {
    const error = new Error('Complete the current active sprint before starting a new one');
    error.statusCode = 400;
    throw error;
  }

  return prisma.sprint.create({
    data: {
      name,
      goal,
      endDate: parsedEndDate,
      projectId,
      status: 'active'
    },
    include: {
      tasks: {
        select: {
          id: true
        }
      }
    }
  });
}

export async function completeSprintForUser(userId, sprintId) {
  const sprint = await prisma.sprint.findFirst({
    where: {
      id: sprintId,
      project: {
        ownerId: userId
      }
    }
  });

  if (!sprint) {
    const error = new Error('Sprint not found');
    error.statusCode = 404;
    throw error;
  }

  if (sprint.status !== 'active') {
    const error = new Error('Only an active sprint can be completed');
    error.statusCode = 400;
    throw error;
  }

  return prisma.sprint.update({
    where: {
      id: sprintId
    },
    data: {
      status: 'completed'
    },
    include: {
      tasks: {
        select: {
          id: true
        }
      }
    }
  });
}
