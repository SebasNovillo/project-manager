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

function buildProjectQuery(userId) {
  return {
    where: {
      ownerId: userId
    },
    include: projectDetailInclude,
    orderBy: {
      createdAt: 'desc'
    }
  };
}

async function repairLegacyCompletedSprintData(projects) {
  const operations = [];

  for (const project of projects) {
    const backlogColumn =
      project.columns.find((column) => column.name.toLowerCase() === 'backlog') ||
      project.columns[0] ||
      null;

    if (!backlogColumn) {
      continue;
    }

    const completedSprints = new Map(
      project.sprints
        .filter((sprint) => sprint.status !== 'active')
        .map((sprint) => [sprint.id, sprint])
    );

    if (!completedSprints.size) {
      continue;
    }

    let nextBacklogPosition = backlogColumn.tasks.filter((task) => !task.sprintId).length;

    for (const sprint of completedSprints.values()) {
      if (!sprint.completedAt) {
        operations.push(
          prisma.sprint.update({
            where: {
              id: sprint.id
            },
            data: {
              completedAt: sprint.updatedAt
            }
          })
        );
      }
    }

    for (const column of project.columns) {
      if (column.name.toLowerCase() === 'done') {
        continue;
      }

      for (const task of column.tasks) {
        if (!task.sprintId || !completedSprints.has(task.sprintId)) {
          continue;
        }

        const sprint = completedSprints.get(task.sprintId);
        const nextPosition =
          task.columnId === backlogColumn.id ? task.position : nextBacklogPosition++;

        operations.push(
          prisma.task.update({
            where: {
              id: task.id
            },
            data: {
              sprintId: null,
              columnId: backlogColumn.id,
              position: nextPosition,
              carryOverSprintId: task.carryOverSprintId || sprint.id,
              carryOverSprintName: task.carryOverSprintName || sprint.name,
              carryOverColumnName: task.carryOverColumnName || column.name
            }
          })
        );
      }
    }
  }

  if (!operations.length) {
    return false;
  }

  await prisma.$transaction(operations);
  return true;
}

export async function getProjectsForUser(userId) {
  const projectQuery = buildProjectQuery(userId);
  const projects = await prisma.project.findMany(projectQuery);
  const didRepairLegacyData = await repairLegacyCompletedSprintData(projects);

  if (!didRepairLegacyData) {
    return projects;
  }

  return prisma.project.findMany(projectQuery);
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
    },
    include: {
      project: {
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

  const backlogColumn =
    sprint.project.columns.find((column) => column.name.toLowerCase() === 'backlog') ||
    sprint.project.columns[0] ||
    null;

  if (!backlogColumn) {
    const error = new Error('The project must have at least one column before closing a sprint');
    error.statusCode = 400;
    throw error;
  }

  const incompleteTasks = sprint.project.columns.flatMap((column) =>
    column.tasks
      .filter((task) => task.sprintId === sprintId && column.name.toLowerCase() !== 'done')
      .map((task) => ({
        ...task,
        sourceColumnName: column.name
      }))
  );

  const backlogPositionStart = backlogColumn.tasks.filter((task) => !task.sprintId).length;

  await prisma.$transaction([
    ...incompleteTasks.map((task, index) =>
      prisma.task.update({
        where: {
          id: task.id
        },
        data: {
          sprintId: null,
          columnId: backlogColumn.id,
          position:
            task.columnId === backlogColumn.id ? task.position : backlogPositionStart + index,
          carryOverSprintId: sprint.id,
          carryOverSprintName: sprint.name,
          carryOverColumnName: task.sourceColumnName
        }
      })
    ),
    prisma.sprint.update({
      where: {
        id: sprintId
      },
      data: {
        status: 'completed',
        completedAt: new Date()
      }
    })
  ]);

  return prisma.project.findUnique({
    where: {
      id: sprint.projectId
    },
    include: projectDetailInclude
  });
}
