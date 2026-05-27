import prisma from '../utils/prisma.js';

const validPriorities = new Set(['low', 'medium', 'high', 'urgent']);

function parsePriority(priority) {
  if (priority === undefined) {
    return undefined;
  }

  const normalizedPriority = String(priority).trim().toLowerCase();

  if (!validPriorities.has(normalizedPriority)) {
    const error = new Error('Priority must be low, medium, high, or urgent');
    error.statusCode = 400;
    throw error;
  }

  return normalizedPriority;
}

function parseLabels(labels) {
  if (labels === undefined) {
    return undefined;
  }

  const values = Array.isArray(labels)
    ? labels
    : String(labels)
        .split(',')
        .map((label) => label.trim())
        .filter(Boolean);

  return [...new Set(values)];
}

function parseDueDate(value) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === '') {
    return null;
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    const error = new Error('Due date is invalid');
    error.statusCode = 400;
    throw error;
  }

  return parsedDate;
}

function parsePosition(value) {
  if (value === undefined) {
    return undefined;
  }

  const parsedPosition = Number(value);

  if (!Number.isInteger(parsedPosition) || parsedPosition < 0) {
    const error = new Error('Position must be a non-negative integer');
    error.statusCode = 400;
    throw error;
  }

  return parsedPosition;
}

async function ensureProjectOwnership(userId, projectId) {
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

async function ensureOwnedColumn(userId, columnId) {
  const column = await prisma.column.findFirst({
    where: {
      id: columnId,
      project: {
        ownerId: userId
      }
    }
  });

  if (!column) {
    const error = new Error('Column not found');
    error.statusCode = 404;
    throw error;
  }

  return column;
}

async function ensureOwnedSprint(userId, sprintId) {
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

  return sprint;
}

async function ensureOwnedTask(userId, taskId) {
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      column: {
        project: {
          ownerId: userId
        }
      }
    },
    include: {
      column: true
    }
  });

  if (!task) {
    const error = new Error('Task not found');
    error.statusCode = 404;
    throw error;
  }

  return task;
}

async function getNextTaskPosition(columnId) {
  const aggregate = await prisma.task.aggregate({
    where: {
      columnId
    },
    _max: {
      position: true
    }
  });

  return (aggregate._max.position ?? -1) + 1;
}

function clampIndex(index, length) {
  if (index === undefined) {
    return length;
  }

  return Math.max(0, Math.min(index, length));
}

async function reorderTask(task, updates, targetColumnId, targetPosition) {
  const sameColumn = task.columnId === targetColumnId;

  const [sourceTasks, targetTasks] = await Promise.all([
    prisma.task.findMany({
      where: {
        columnId: task.columnId
      },
      orderBy: {
        position: 'asc'
      }
    }),
    sameColumn
      ? Promise.resolve([])
      : prisma.task.findMany({
          where: {
            columnId: targetColumnId
          },
          orderBy: {
            position: 'asc'
          }
        })
  ]);

  if (sameColumn) {
    const remainingTasks = sourceTasks.filter((item) => item.id !== task.id);
    const nextIndex = clampIndex(targetPosition, remainingTasks.length);
    const reorderedTasks = [...remainingTasks];

    reorderedTasks.splice(nextIndex, 0, task);

    await prisma.$transaction(
      reorderedTasks.map((item, index) =>
        prisma.task.update({
          where: {
            id: item.id
          },
          data:
            item.id === task.id
              ? {
                  ...updates,
                  position: index
                }
              : {
                  position: index
                }
        })
      )
    );

    return prisma.task.findUnique({
      where: {
        id: task.id
      }
    });
  }

  const remainingSourceTasks = sourceTasks.filter((item) => item.id !== task.id);
  const nextIndex = clampIndex(targetPosition, targetTasks.length);
  const reorderedTargetTasks = [...targetTasks];

  reorderedTargetTasks.splice(nextIndex, 0, task);

  await prisma.$transaction([
    ...remainingSourceTasks.map((item, index) =>
      prisma.task.update({
        where: {
          id: item.id
        },
        data: {
          position: index
        }
      })
    ),
    ...reorderedTargetTasks.map((item, index) =>
      prisma.task.update({
        where: {
          id: item.id
        },
        data:
          item.id === task.id
            ? {
                ...updates,
                columnId: targetColumnId,
                position: index
              }
            : {
                position: index
              }
      })
    )
  ]);

  return prisma.task.findUnique({
    where: {
      id: task.id
    }
  });
}

export async function createTaskForProject(userId, projectId, payload) {
  const title = payload.title?.trim();
  const description = payload.description?.trim() || null;
  const columnId = payload.columnId;
  const priority = parsePriority(payload.priority) || 'medium';
  const labels = parseLabels(payload.labels) || [];
  const dueDate = parseDueDate(payload.dueDate) ?? null;
  const sprintId =
    payload.sprintId === undefined || payload.sprintId === null || payload.sprintId === ''
      ? null
      : String(payload.sprintId);

  if (!title || !columnId) {
    const error = new Error('Task title and column are required');
    error.statusCode = 400;
    throw error;
  }

  await ensureProjectOwnership(userId, projectId);

  const column = await prisma.column.findFirst({
    where: {
      id: columnId,
      projectId
    }
  });

  if (!column) {
    const error = new Error('Column not found in this project');
    error.statusCode = 404;
    throw error;
  }

  if (sprintId) {
    const sprint = await ensureOwnedSprint(userId, sprintId);

    if (sprint.projectId !== projectId) {
      const error = new Error('Task can only be associated with a sprint from its current project');
      error.statusCode = 400;
      throw error;
    }
  }

  const position = await getNextTaskPosition(columnId);

  return prisma.task.create({
    data: {
      title,
      description,
      priority,
      labels,
      dueDate,
      columnId,
      sprintId,
      position
    }
  });
}

export async function updateTaskForUser(userId, taskId, payload) {
  const task = await ensureOwnedTask(userId, taskId);
  const nextTitle = payload.title?.trim();
  const nextDescription =
    typeof payload.description === 'string' ? payload.description.trim() || null : undefined;
  const nextColumnId = payload.columnId;
  const nextPriority = parsePriority(payload.priority);
  const nextLabels = parseLabels(payload.labels);
  const nextDueDate = parseDueDate(payload.dueDate);
  const nextPosition = parsePosition(payload.position);
  const nextSprintId =
    payload.sprintId === undefined
      ? undefined
      : payload.sprintId === null || payload.sprintId === ''
        ? null
        : String(payload.sprintId);

  const data = {};

  if (nextTitle !== undefined) {
    if (!nextTitle) {
      const error = new Error('Task title cannot be empty');
      error.statusCode = 400;
      throw error;
    }

    data.title = nextTitle;
  }

  if (nextDescription !== undefined) {
    data.description = nextDescription;
  }

  if (nextPriority !== undefined) {
    data.priority = nextPriority;
  }

  if (nextLabels !== undefined) {
    data.labels = nextLabels;
  }

  if (nextDueDate !== undefined) {
    data.dueDate = nextDueDate;
  }

  if (nextSprintId !== undefined) {
    if (nextSprintId === null) {
      data.sprintId = null;
    } else {
      const sprint = await ensureOwnedSprint(userId, nextSprintId);

      if (sprint.projectId !== task.column.projectId) {
        const error = new Error('Task can only be associated with a sprint from its current project');
        error.statusCode = 400;
        throw error;
      }

      data.sprintId = nextSprintId;
    }
  }

  const targetColumnId = nextColumnId || task.columnId;
  const shouldReorder =
    nextPosition !== undefined || (nextColumnId && nextColumnId !== task.columnId);

  if (targetColumnId !== task.columnId) {
    const nextColumn = await ensureOwnedColumn(userId, targetColumnId);

    if (nextColumn.projectId !== task.column.projectId) {
      const error = new Error('Task can only move inside its current project');
      error.statusCode = 400;
      throw error;
    }
  }

  if (shouldReorder) {
    return reorderTask(task, data, targetColumnId, nextPosition);
  }

  return prisma.task.update({
    where: {
      id: taskId
    },
    data
  });
}

export async function deleteTaskForUser(userId, taskId) {
  await ensureOwnedTask(userId, taskId);

  return prisma.task.delete({
    where: {
      id: taskId
    }
  });
}
