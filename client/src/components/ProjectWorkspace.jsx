import { useMemo, useState } from 'react';

function ProjectWorkspace({
  projects,
  selectedProjectId,
  isLoading,
  error,
  onCreateProject,
  onSelectProject,
  onCreateTask,
  onMoveTask,
  onUpdateTask,
  onDeleteTask,
  isCreating,
  isCreatingTask,
  isUpdatingTask,
  isDeletingTask
}) {
  const [formValues, setFormValues] = useState({
    name: '',
    description: ''
  });
  const [taskForms, setTaskForms] = useState({});
  const [editingTaskId, setEditingTaskId] = useState('');
  const [editingValues, setEditingValues] = useState({
    title: '',
    description: ''
  });
  const [dragState, setDragState] = useState({
    taskId: '',
    fromColumnId: '',
    overColumnId: ''
  });

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) || projects[0] || null,
    [projects, selectedProjectId]
  );
  const totalTasks = useMemo(
    () =>
      projects.reduce(
        (count, project) =>
          count +
          project.columns.reduce((columnCount, column) => columnCount + column.tasks.length, 0),
        0
      ),
    [projects]
  );
  const activeTasks = useMemo(
    () =>
      selectedProject
        ? selectedProject.columns
            .filter((column) => column.name !== 'Done')
            .reduce((count, column) => count + column.tasks.length, 0)
        : 0,
    [selectedProject]
  );
  const completedTasks = useMemo(
    () =>
      selectedProject?.columns.find((column) => column.name === 'Done')?.tasks.length || 0,
    [selectedProject]
  );
  const completionRatio = useMemo(() => {
    const total = activeTasks + completedTasks;

    if (!total) {
      return 0;
    }

    return Math.round((completedTasks / total) * 100);
  }, [activeTasks, completedTasks]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormValues((currentValues) => ({
      ...currentValues,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onCreateProject(formValues);
    setFormValues({
      name: '',
      description: ''
    });
  };

  const handleTaskChange = (columnId, field, value) => {
    setTaskForms((currentForms) => ({
      ...currentForms,
      [columnId]: {
        title: currentForms[columnId]?.title || '',
        description: currentForms[columnId]?.description || '',
        [field]: value
      }
    }));
  };

  const handleTaskSubmit = async (event, columnId) => {
    event.preventDefault();

    if (!selectedProject) {
      return;
    }

    const values = taskForms[columnId] || {
      title: '',
      description: ''
    };

    await onCreateTask(selectedProject.id, {
      title: values.title,
      description: values.description,
      columnId
    });

    setTaskForms((currentForms) => ({
      ...currentForms,
      [columnId]: {
        title: '',
        description: ''
      }
    }));
  };

  const handleMoveTask = async (taskId, columnId) => {
    if (!selectedProject) {
      return;
    }

    await onMoveTask(selectedProject.id, taskId, columnId);
  };

  const startEditingTask = (task) => {
    setEditingTaskId(task.id);
    setEditingValues({
      title: task.title,
      description: task.description || ''
    });
  };

  const cancelEditingTask = () => {
    setEditingTaskId('');
    setEditingValues({
      title: '',
      description: ''
    });
  };

  const handleEditingValueChange = (event) => {
    const { name, value } = event.target;

    setEditingValues((currentValues) => ({
      ...currentValues,
      [name]: value
    }));
  };

  const handleUpdateTask = async (event, taskId) => {
    event.preventDefault();

    if (!selectedProject) {
      return;
    }

    await onUpdateTask(selectedProject.id, taskId, editingValues);
    cancelEditingTask();
  };

  const handleDeleteTask = async (taskId) => {
    if (!selectedProject) {
      return;
    }

    await onDeleteTask(selectedProject.id, taskId);

    if (editingTaskId === taskId) {
      cancelEditingTask();
    }
  };

  const handleDragStart = (taskId, fromColumnId) => {
    setDragState({
      taskId,
      fromColumnId,
      overColumnId: fromColumnId
    });
  };

  const handleDragEnd = () => {
    setDragState({
      taskId: '',
      fromColumnId: '',
      overColumnId: ''
    });
  };

  const handleDragOverColumn = (event, columnId) => {
    event.preventDefault();

    setDragState((currentState) => ({
      ...currentState,
      overColumnId: columnId
    }));
  };

  const handleDropTask = async (columnId) => {
    if (!dragState.taskId || !dragState.fromColumnId || dragState.fromColumnId === columnId) {
      handleDragEnd();
      return;
    }

    await handleMoveTask(dragState.taskId, columnId);
    handleDragEnd();
  };

  return (
    <section className="dashboard-stack">
      <section className="workspace-layout">
        <aside className="workspace-sidebar">
          <article className="card workspace-intel">
            <p className="eyebrow">Workspace pulse</p>
            <h1>Build a board that already feels alive.</h1>
            <p>
              Your foundation is working. Now the interface should reflect a real
              product, with momentum, context, and visible project health.
            </p>

            <div className="workspace-stats">
              <article>
                <span>{projects.length}</span>
                <small>Projects</small>
              </article>
              <article>
                <span>{totalTasks}</span>
                <small>Total tasks</small>
              </article>
              <article>
                <span>{completionRatio}%</span>
                <small>Completion</small>
              </article>
            </div>
          </article>

          <article className="card workspace-creator">
            <div className="section-copy">
              <h2>Create a project</h2>
              <p>Launch a fresh board with the default kanban flow already prepared.</p>
            </div>

            <form className="form-grid" onSubmit={handleSubmit}>
              <label>
                <span>Project name</span>
                <input
                  type="text"
                  name="name"
                  placeholder="Website redesign"
                  value={formValues.name}
                  onChange={handleChange}
                />
              </label>

              <label>
                <span>Description</span>
                <textarea
                  name="description"
                  placeholder="Short summary of the project goals"
                  value={formValues.description}
                  onChange={handleChange}
                  rows="4"
                />
              </label>

              <button type="submit" className="primary-button" disabled={isCreating}>
                {isCreating ? 'Creating project...' : 'Create project'}
              </button>
            </form>
          </article>
        </aside>

        <section className="workspace-main">
          <article className="card board-hero">
            <div className="board-hero-copy">
              <p className="eyebrow">Active workspace</p>
              <h2>
                {selectedProject ? selectedProject.name : 'Choose or create a project'}
              </h2>
              <p>
                  {selectedProject
                    ? selectedProject.description ||
                      'A clean setup ready for planning, execution, and delivery.'
                    : 'Start by creating a project to unlock the board experience.'}
              </p>
            </div>

            <div className="board-hero-metrics">
              <article>
                <span>{activeTasks}</span>
                <small>In flow</small>
              </article>
              <article>
                <span>{completedTasks}</span>
                <small>Done</small>
              </article>
            </div>
          </article>

          <section className="workspace-panels">
            <article className="card project-directory">
              <div className="section-copy">
                <h2>Your projects</h2>
                <p>Switch context quickly and keep the active board in focus.</p>
              </div>

              {isLoading ? <p className="status-copy">Loading projects...</p> : null}
              {error ? <p className="form-error">{error}</p> : null}
              {!isLoading && projects.length === 0 ? (
                <p className="status-copy">
                  No projects yet. Create your first one to generate the default
                  board structure.
                </p>
              ) : null}

              <div className="project-list">
                {projects.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    className={`project-list-item ${
                      project.id === selectedProject?.id ? 'project-list-item--active' : ''
                    }`}
                    onClick={() => onSelectProject(project.id)}
                  >
                    <div className="project-list-item-top">
                      <h3>{project.name}</h3>
                      <span>{project.columns.length} lanes</span>
                    </div>
                    <p>{project.description || 'No description yet.'}</p>
                  </button>
                ))}
              </div>
            </article>

            <article className="card board-summary">
              <div className="section-copy">
                <h2>Board preview</h2>
                <p>
                  {selectedProject
                    ? `The structure for ${selectedProject.name} is ready to receive work.`
                    : 'Your board columns will appear here once a project is created.'}
                </p>
              </div>

              {selectedProject ? (
                <div className="column-pill-row">
                  {selectedProject.columns.map((column) => (
                    <div key={column.id} className="column-pill">
                      <strong>{column.name}</strong>
                      <span>{column.tasks.length}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="status-copy">Create a project to preview its board columns.</p>
              )}
            </article>
          </section>

          {selectedProject ? (
            <div className="board-preview">
              {selectedProject.columns.map((column, columnIndex) => (
                <section
                  key={column.id}
                  className={`board-column ${
                    dragState.overColumnId === column.id ? 'board-column--active' : ''
                  }`}
                  onDragOver={(event) => handleDragOverColumn(event, column.id)}
                  onDrop={() => handleDropTask(column.id)}
                >
                  <header className="board-column-header">
                    <h3>{column.name}</h3>
                    <span>{column.tasks.length} cards</span>
                  </header>

                  <div className="board-column-body board-column-body--stack">
                    {column.tasks.length === 0 ? (
                      <p className="drop-hint">
                        {dragState.taskId ? 'Drop a task here' : 'No tasks yet.'}
                      </p>
                    ) : (
                      column.tasks.map((task) => (
                        <article
                          key={task.id}
                          className={`task-card ${
                            dragState.taskId === task.id ? 'task-card--dragging' : ''
                          }`}
                          draggable={editingTaskId !== task.id}
                          onDragStart={() => handleDragStart(task.id, column.id)}
                          onDragEnd={handleDragEnd}
                        >
                          {editingTaskId === task.id ? (
                            <form
                              className="form-grid task-edit-form"
                              onSubmit={(event) => handleUpdateTask(event, task.id)}
                            >
                              <label>
                                <span>Task title</span>
                                <input
                                  type="text"
                                  name="title"
                                  value={editingValues.title}
                                  onChange={handleEditingValueChange}
                                />
                              </label>

                              <label>
                                <span>Description</span>
                                <textarea
                                  name="description"
                                  rows="3"
                                  value={editingValues.description}
                                  onChange={handleEditingValueChange}
                                />
                              </label>

                              <div className="task-actions">
                                <button
                                  type="submit"
                                  className="primary-button"
                                  disabled={isUpdatingTask}
                                >
                                  {isUpdatingTask ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                  type="button"
                                  className="ghost-button"
                                  onClick={cancelEditingTask}
                                  disabled={isUpdatingTask}
                                >
                                  Cancel
                                </button>
                              </div>
                            </form>
                          ) : (
                            <div className="task-card-copy">
                              <div className="task-card-top">
                                <h4>{task.title}</h4>
                                <span className="task-grip">Drag</span>
                              </div>
                              <p>{task.description || 'No description yet.'}</p>
                            </div>
                          )}

                          <div className="task-actions">
                            <button
                              type="button"
                              className="ghost-button"
                              disabled={isUpdatingTask || isDeletingTask}
                              onClick={() => startEditingTask(task)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="ghost-button"
                              disabled={columnIndex === 0 || isUpdatingTask || isDeletingTask}
                              onClick={() =>
                                handleMoveTask(
                                  task.id,
                                  selectedProject.columns[columnIndex - 1].id
                                )
                              }
                            >
                              Move left
                            </button>
                            <button
                              type="button"
                              className="ghost-button"
                              disabled={
                                columnIndex === selectedProject.columns.length - 1 ||
                                isUpdatingTask ||
                                isDeletingTask
                              }
                              onClick={() =>
                                handleMoveTask(
                                  task.id,
                                  selectedProject.columns[columnIndex + 1].id
                                )
                              }
                            >
                              Move right
                            </button>
                            <button
                              type="button"
                              className="ghost-button ghost-button--danger"
                              disabled={isUpdatingTask || isDeletingTask}
                              onClick={() => handleDeleteTask(task.id)}
                            >
                              {isDeletingTask ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </article>
                      ))
                    )}
                  </div>

                  <form
                    className="form-grid board-task-form"
                    onSubmit={(event) => handleTaskSubmit(event, column.id)}
                  >
                    <label>
                      <span>Task title</span>
                      <input
                        type="text"
                        name={`task-title-${column.id}`}
                        placeholder={`Add a task to ${column.name}`}
                        value={taskForms[column.id]?.title || ''}
                        onChange={(event) =>
                          handleTaskChange(column.id, 'title', event.target.value)
                        }
                      />
                    </label>

                    <label>
                      <span>Description</span>
                      <textarea
                        name={`task-description-${column.id}`}
                        placeholder="Optional details"
                        value={taskForms[column.id]?.description || ''}
                        onChange={(event) =>
                          handleTaskChange(column.id, 'description', event.target.value)
                        }
                        rows="3"
                      />
                    </label>

                    <button
                      type="submit"
                      className="primary-button"
                      disabled={isCreatingTask}
                    >
                      {isCreatingTask ? 'Saving task...' : 'Add task'}
                    </button>
                  </form>
                </section>
              ))}
            </div>
          ) : (
            <article className="card board-empty">
              <p className="eyebrow">Board preview</p>
              <h3>No active project yet</h3>
              <p>Create a project to bring the kanban board to life.</p>
            </article>
          )}
        </section>
      </section>
    </section>
  );
}

export default ProjectWorkspace;
