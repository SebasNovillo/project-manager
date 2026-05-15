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

export async function createTaskForProject(userId, projectId, payload) {
  const title = payload.title?.trim();
  const description = payload.description?.trim() || null;
  const columnId = payload.columnId;
  const priority = parsePriority(payload.priority) || 'medium';
  const labels = parseLabels(payload.labels) || [];
  const dueDate = parseDueDate(payload.dueDate) ?? null;

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

  const position = await getNextTaskPosition(columnId);

  return prisma.task.create({
    data: {
      title,
      description,
      priority,
      labels,
      dueDate,
      columnId,
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

  if (nextColumnId && nextColumnId !== task.columnId) {
    const nextColumn = await ensureOwnedColumn(userId, nextColumnId);

    if (nextColumn.projectId !== task.column.projectId) {
      const error = new Error('Task can only move inside its current project');
      error.statusCode = 400;
      throw error;
    }

    data.columnId = nextColumnId;
    data.position = await getNextTaskPosition(nextColumnId);
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
