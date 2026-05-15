import { useState } from 'react';

const priorityOptions = ['low', 'medium', 'high', 'urgent'];

function formatDueDate(value) {
  if (!value) {
    return 'No due date';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'No due date';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric'
  }).format(date);
}

function normalizeLabels(value) {
  return value
    .split(',')
    .map((label) => label.trim())
    .filter(Boolean);
}

function getColumnTone(name) {
  return name.toLowerCase().replace(/\s+/g, '-');
}

function BoardWorkspace({
  selectedProject,
  isLoading,
  error,
  onCreateTask,
  onMoveTask,
  onUpdateTask,
  onDeleteTask,
  isCreatingTask,
  isUpdatingTask,
  isDeletingTask
}) {
  const [taskForms, setTaskForms] = useState({});
  const [openTaskComposerByColumn, setOpenTaskComposerByColumn] = useState({});
  const [editingTaskId, setEditingTaskId] = useState('');
  const [editingValues, setEditingValues] = useState({
    title: '',
    description: '',
    priority: 'medium',
    labels: '',
    dueDate: ''
  });
  const [dragState, setDragState] = useState({
    taskId: '',
    fromColumnId: '',
    overColumnId: ''
  });

  const handleTaskChange = (columnId, field, value) => {
    setTaskForms((currentForms) => ({
      ...currentForms,
      [columnId]: {
        title: currentForms[columnId]?.title || '',
        description: currentForms[columnId]?.description || '',
        priority: currentForms[columnId]?.priority || 'medium',
        labels: currentForms[columnId]?.labels || '',
        dueDate: currentForms[columnId]?.dueDate || '',
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
      description: '',
      priority: 'medium',
      labels: '',
      dueDate: ''
    };

    await onCreateTask(selectedProject.id, {
      title: values.title,
      description: values.description,
      priority: values.priority,
      labels: normalizeLabels(values.labels),
      dueDate: values.dueDate,
      columnId
    });

    setTaskForms((currentForms) => ({
      ...currentForms,
      [columnId]: {
        title: '',
        description: '',
        priority: 'medium',
        labels: '',
        dueDate: ''
      }
    }));
    setOpenTaskComposerByColumn((currentState) => ({
      ...currentState,
      [columnId]: false
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
      description: task.description || '',
      priority: task.priority || 'medium',
      labels: (task.labels || []).join(', '),
      dueDate: task.dueDate ? String(task.dueDate).slice(0, 10) : ''
    });
  };

  const cancelEditingTask = () => {
    setEditingTaskId('');
    setEditingValues({
      title: '',
      description: '',
      priority: 'medium',
      labels: '',
      dueDate: ''
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

    await onUpdateTask(selectedProject.id, taskId, {
      ...editingValues,
      labels: normalizeLabels(editingValues.labels)
    });
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

  const toggleTaskComposer = (columnId) => {
    setOpenTaskComposerByColumn((currentState) => ({
      ...currentState,
      [columnId]: !currentState[columnId]
    }));
  };

  return (
    <section className="dashboard-stack">
      <section className="board-shell">
        <article className="card board-project-bar">
          <div className="board-project-bar__copy">
            <p className="eyebrow">Board</p>
            <h1>{selectedProject ? selectedProject.name : 'Choose a project'}</h1>
            <p>
              {selectedProject
                ? selectedProject.description ||
                  'Manage tasks, priorities, due dates, and delivery in one focused space.'
                : 'Select a project in the dashboard before managing the board.'}
            </p>
          </div>

          {isLoading ? <p className="status-copy">Loading projects...</p> : null}
          {error ? <p className="form-error">{error}</p> : null}
        </article>

        {selectedProject ? (
          <div className="board-preview board-preview--full">
            {selectedProject.columns.map((column) => (
              <section
                key={column.id}
                className={`board-column ${
                  dragState.overColumnId === column.id ? 'board-column--active' : ''
                } board-column--${getColumnTone(column.name)}`}
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

                            <div className="task-meta-grid">
                              <label>
                                <span>Priority</span>
                                <select
                                  name="priority"
                                  value={editingValues.priority}
                                  onChange={handleEditingValueChange}
                                >
                                  {priorityOptions.map((option) => (
                                    <option key={option} value={option}>
                                      {option}
                                    </option>
                                  ))}
                                </select>
                              </label>

                              <label>
                                <span>Due date</span>
                                <input
                                  type="date"
                                  name="dueDate"
                                  value={editingValues.dueDate}
                                  onChange={handleEditingValueChange}
                                />
                              </label>
                            </div>

                            <label>
                              <span>Labels</span>
                              <input
                                type="text"
                                name="labels"
                                placeholder="design, frontend"
                                value={editingValues.labels}
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
                                className="ghost-button ghost-button--action"
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
                            <div className="task-meta-row">
                              <span
                                className={`priority-badge priority-badge--${
                                  task.priority || 'medium'
                                }`}
                              >
                                {task.priority || 'medium'}
                              </span>
                              <span className="due-date-badge">
                                {formatDueDate(task.dueDate)}
                              </span>
                            </div>
                            <p>{task.description || 'No description yet.'}</p>
                            {task.labels?.length ? (
                              <div className="label-row">
                                {task.labels.map((label) => (
                                  <span key={label} className="label-chip">
                                    {label}
                                  </span>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        )}

                        <div className="task-actions">
                          <button
                            type="button"
                            className="ghost-button ghost-button--action"
                            disabled={isUpdatingTask || isDeletingTask}
                            onClick={() => startEditingTask(task)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="ghost-button ghost-button--action ghost-button--danger-solid"
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

                <div className="column-footer">
                  <button
                    type="button"
                    className="ghost-button ghost-button--panel"
                    onClick={() => toggleTaskComposer(column.id)}
                  >
                    {openTaskComposerByColumn[column.id] ? 'Close composer' : 'Add task'}
                  </button>
                </div>

                {openTaskComposerByColumn[column.id] ? (
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

                    <div className="task-meta-grid">
                      <label>
                        <span>Priority</span>
                        <select
                          name={`task-priority-${column.id}`}
                          value={taskForms[column.id]?.priority || 'medium'}
                          onChange={(event) =>
                            handleTaskChange(column.id, 'priority', event.target.value)
                          }
                        >
                          {priorityOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label>
                        <span>Due date</span>
                        <input
                          type="date"
                          name={`task-due-date-${column.id}`}
                          value={taskForms[column.id]?.dueDate || ''}
                          onChange={(event) =>
                            handleTaskChange(column.id, 'dueDate', event.target.value)
                          }
                        />
                      </label>
                    </div>

                    <label>
                      <span>Labels</span>
                      <input
                        type="text"
                        name={`task-labels-${column.id}`}
                        placeholder="design, frontend"
                        value={taskForms[column.id]?.labels || ''}
                        onChange={(event) =>
                          handleTaskChange(column.id, 'labels', event.target.value)
                        }
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
                ) : null}
              </section>
            ))}
          </div>
        ) : (
          <article className="card board-empty">
            <p className="eyebrow">Board</p>
            <h3>No active project yet</h3>
            <p>Create or select a project from the dashboard before managing tasks here.</p>
          </article>
        )}
      </section>
    </section>
  );
}

export default BoardWorkspace;
