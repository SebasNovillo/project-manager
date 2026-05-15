export const defaultColumns = ['Backlog', 'To Do', 'In Progress', 'Review', 'Done'];

const starterTasksByColumn = {
  Backlog: [
    {
      title: 'Collect requirements',
      description: 'List the main goals, users, and constraints for this project.'
    },
    {
      title: 'Map the first release',
      description: 'Decide which features belong in the MVP and which can wait.'
    }
  ],
  'To Do': [
    {
      title: 'Create the first wireframe',
      description: 'Draft the main dashboard and board layout before polishing details.'
    }
  ],
  'In Progress': [
    {
      title: 'Set up the project foundation',
      description: 'Prepare the structure, auth flow, and first board experience.'
    }
  ],
  Review: [
    {
      title: 'Review the board flow',
      description: 'Check if tasks move clearly from backlog to done.'
    }
  ],
  Done: [
    {
      title: 'Open the workspace',
      description: 'Your first project is ready to start receiving real work.'
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
        position: taskIndex
      }))
    }
  }));
}
