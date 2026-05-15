export const defaultColumns = ['Backlog', 'To Do', 'In Progress', 'Review', 'Done'];

const starterTasksByColumn = {
  Backlog: [
    {
      title: 'Collect requirements',
      description: 'List the main goals, users, and constraints for this project.',
      priority: 'high',
      labels: ['discovery', 'planning'],
      dueDate: '2026-05-20'
    },
    {
      title: 'Map the first release',
      description: 'Decide which features belong in the MVP and which can wait.',
      priority: 'medium',
      labels: ['roadmap'],
      dueDate: '2026-05-23'
    }
  ],
  'To Do': [
    {
      title: 'Create the first wireframe',
      description: 'Draft the main dashboard and board layout before polishing details.',
      priority: 'medium',
      labels: ['design', 'ui'],
      dueDate: '2026-05-24'
    }
  ],
  'In Progress': [
    {
      title: 'Set up the project foundation',
      description: 'Prepare the structure, auth flow, and first board experience.',
      priority: 'high',
      labels: ['backend', 'frontend'],
      dueDate: '2026-05-18'
    }
  ],
  Review: [
    {
      title: 'Review the board flow',
      description: 'Check if tasks move clearly from backlog to done.',
      priority: 'low',
      labels: ['qa'],
      dueDate: '2026-05-25'
    }
  ],
  Done: [
    {
      title: 'Open the workspace',
      description: 'Your first project is ready to start receiving real work.',
      priority: 'low',
      labels: ['onboarding'],
      dueDate: '2026-05-14'
    }
  ]
};

export function buildSeededColumns() {
  return defaultColumns.map((columnName, columnIndex) => ({
    name: columnName,
    position: columnIndex,
    tasks: {
      create: (starterTasksByColumn[columnName] || []).map((task, taskIndex) => ({
        ...task,
        dueDate: task.dueDate ? new Date(task.dueDate) : null,
        position: taskIndex
      }))
    }
  }));
}
