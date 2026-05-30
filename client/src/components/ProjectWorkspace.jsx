import { Link, useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';

const priorityOptions = ['low', 'medium', 'high', 'urgent'];

function formatDate(value) {
  if (!value) {
    return 'Open';
  }

  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
}

function formatDateInput(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toISOString().slice(0, 10);
}

function normalizeLabels(value) {
  return value
    .split(',')
    .map((label) => label.trim())
    .filter(Boolean);
}

function ProjectWorkspace({
  selectedProject,
  isLoading,
  error,
  onCreateTask,
  onUpdateProject,
  onUpdateTask,
  onDeleteTask,
  onDeleteProject,
  onCreateSprint,
  onCompleteSprint,
  isCreatingTask,
  isUpdatingProject,
  isUpdatingTask,
  isDeletingTask,
  isDeletingProject,
  isCreatingSprint,
  isCompletingSprint
}) {
  const navigate = useNavigate();
  const [editingProjectId, setEditingProjectId] = useState('');
  const [editingProjectValues, setEditingProjectValues] = useState({
    name: '',
    description: ''
  });
  const [sprintValues, setSprintValues] = useState({
    name: '',
    goal: '',
    endDate: ''
  });
  const [backlogTaskValues, setBacklogTaskValues] = useState({
    title: '',
    description: '',
    priority: 'medium',
    labels: '',
    dueDate: ''
  });
  const [isBacklogComposerOpen, setIsBacklogComposerOpen] = useState(false);
  const [editingBacklogTaskId, setEditingBacklogTaskId] = useState('');
  const [editingBacklogTaskValues, setEditingBacklogTaskValues] = useState({
    title: '',
    description: '',
    priority: 'medium',
    labels: '',
    dueDate: ''
  });

  const activeSprint = useMemo(
    () => selectedProject?.sprints?.find((sprint) => sprint.status === 'active') || null,
    [selectedProject]
  );
  const completedSprints = useMemo(
    () => selectedProject?.sprints?.filter((sprint) => sprint.status !== 'active') || [],
    [selectedProject]
  );

  const sprintTaskCount = useMemo(() => {
    if (!selectedProject || !activeSprint) {
      return 0;
    }

    return selectedProject.columns.reduce(
      (count, column) =>
        count + column.tasks.filter((task) => task.sprintId === activeSprint.id).length,
      0
    );
  }, [activeSprint, selectedProject]);

  const projectTaskCount = useMemo(() => {
    if (!selectedProject) {
      return 0;
    }

    return selectedProject.columns.reduce((count, column) => count + column.tasks.length, 0);
  }, [selectedProject]);

  const sprintDoneCount = useMemo(() => {
    if (!selectedProject || !activeSprint) {
      return 0;
    }

    const doneColumn = selectedProject.columns.find(
      (column) => column.name.toLowerCase() === 'done'
    );

    return doneColumn?.tasks.filter((task) => task.sprintId === activeSprint.id).length || 0;
  }, [activeSprint, selectedProject]);
  const incompleteSprintTaskCount = Math.max(sprintTaskCount - sprintDoneCount, 0);

  const backlogTasks = useMemo(() => {
    if (!selectedProject) {
      return [];
    }

    return selectedProject.columns.flatMap((column) =>
      column.tasks
        .filter((task) => !task.sprintId)
        .map((task) => ({
          ...task,
          columnName: column.name
        }))
    );
  }, [selectedProject]);

  const backlogTaskCount = backlogTasks.length;

  const backlogColumn = useMemo(() => {
    if (!selectedProject) {
      return null;
    }

    return (
      selectedProject.columns.find(
        (column) => column.name.toLowerCase() === 'backlog'
      ) ||
      selectedProject.columns[0] ||
      null
    );
  }, [selectedProject]);

  const handleEditingProjectChange = (event) => {
    const { name, value } = event.target;

    setEditingProjectValues((currentValues) => ({
      ...currentValues,
      [name]: value
    }));
  };

  const handleUpdateProjectSubmit = async (event) => {
    event.preventDefault();

    if (!selectedProject) {
      return;
    }

    await onUpdateProject(selectedProject.id, editingProjectValues);
    setEditingProjectId('');
    setEditingProjectValues({
      name: '',
      description: ''
    });
  };

  const startEditingProject = () => {
    if (!selectedProject) {
      return;
    }

    setEditingProjectId(selectedProject.id);
    setEditingProjectValues({
      name: selectedProject.name,
      description: selectedProject.description || ''
    });
  };

  const cancelEditingProject = () => {
    setEditingProjectId('');
    setEditingProjectValues({
      name: '',
      description: ''
    });
  };

  const handleDeleteProjectClick = async () => {
    if (!selectedProject) {
      return;
    }

    const confirmation = window.prompt(
      `Type "${selectedProject.name}" to delete this project, including its columns, tasks, and sprints.`
    );

    if (confirmation !== selectedProject.name) {
      return;
    }

    await onDeleteProject(selectedProject.id);
    navigate('/');
  };

  const handleSprintChange = (event) => {
    const { name, value } = event.target;

    setSprintValues((currentValues) => ({
      ...currentValues,
      [name]: value
    }));
  };

  const handleBacklogTaskChange = (event) => {
    const { name, value } = event.target;

    setBacklogTaskValues((currentValues) => ({
      ...currentValues,
      [name]: value
    }));
  };

  const handleEditingBacklogTaskChange = (event) => {
    const { name, value } = event.target;

    setEditingBacklogTaskValues((currentValues) => ({
      ...currentValues,
      [name]: value
    }));
  };

  const handleSprintSubmit = async (event) => {
    event.preventDefault();

    if (!selectedProject) {
      return;
    }

    await onCreateSprint(selectedProject.id, sprintValues);
    setSprintValues({
      name: '',
      goal: '',
      endDate: ''
    });
  };

  const handleBacklogTaskSubmit = async (event) => {
    event.preventDefault();

    if (!selectedProject || !backlogColumn || !backlogTaskValues.title.trim()) {
      return;
    }

    await onCreateTask(selectedProject.id, {
      title: backlogTaskValues.title.trim(),
      description: backlogTaskValues.description,
      priority: backlogTaskValues.priority,
      labels: normalizeLabels(backlogTaskValues.labels),
      dueDate: backlogTaskValues.dueDate,
      sprintId: null,
      columnId: backlogColumn.id
    });
    setBacklogTaskValues({
      title: '',
      description: '',
      priority: 'medium',
      labels: '',
      dueDate: ''
    });
    setIsBacklogComposerOpen(false);
  };

  const handleAddTaskToSprint = async (taskId) => {
    if (!selectedProject || !activeSprint) {
      return;
    }

    await onUpdateTask(selectedProject.id, taskId, {
      sprintId: activeSprint.id
    });
  };

  const handleCompleteSprintClick = async () => {
    if (!selectedProject || !activeSprint) {
      return;
    }

    const confirmationMessage = incompleteSprintTaskCount
      ? `Close "${activeSprint.name}" with ${incompleteSprintTaskCount} incomplete task${
          incompleteSprintTaskCount === 1 ? '' : 's'
        }?`
      : `Close "${activeSprint.name}" now?`;

    const confirmed = window.confirm(confirmationMessage);

    if (!confirmed) {
      return;
    }

    await onCompleteSprint(selectedProject.id, activeSprint.id);
  };

  const startEditingBacklogTask = (task) => {
    setEditingBacklogTaskId(task.id);
    setEditingBacklogTaskValues({
      title: task.title,
      description: task.description || '',
      priority: task.priority || 'medium',
      labels: (task.labels || []).join(', '),
      dueDate: formatDateInput(task.dueDate)
    });
  };

  const cancelEditingBacklogTask = () => {
    setEditingBacklogTaskId('');
    setEditingBacklogTaskValues({
      title: '',
      description: '',
      priority: 'medium',
      labels: '',
      dueDate: ''
    });
  };

  const handleUpdateBacklogTaskSubmit = async (event, taskId) => {
    event.preventDefault();

    if (!selectedProject || !editingBacklogTaskValues.title.trim()) {
      return;
    }

    await onUpdateTask(selectedProject.id, taskId, {
      title: editingBacklogTaskValues.title.trim(),
      description: editingBacklogTaskValues.description,
      priority: editingBacklogTaskValues.priority,
      labels: normalizeLabels(editingBacklogTaskValues.labels),
      dueDate: editingBacklogTaskValues.dueDate || null
    });
    cancelEditingBacklogTask();
  };

  const handleDeleteBacklogTask = async (task) => {
    if (!selectedProject) {
      return;
    }

    const confirmed = window.confirm(`Delete "${task.title}" from the backlog?`);

    if (!confirmed) {
      return;
    }

    await onDeleteTask(selectedProject.id, task.id);

    if (editingBacklogTaskId === task.id) {
      cancelEditingBacklogTask();
    }
  };

  if (isLoading) {
    return (
      <article className="card board-empty">
        <p className="status-copy">Loading project...</p>
      </article>
    );
  }

  if (!selectedProject) {
    return (
      <article className="card board-empty">
        <p className="eyebrow">Project</p>
        <h3>No project selected</h3>
        <p>Go back to the dashboard and choose a project before managing sprints or the board.</p>
      </article>
    );
  }

  return (
    <section className="dashboard-stack">
      <article className="card project-view-hero">
        <div className="section-copy">
          <p className="eyebrow">Project overview</p>
          <h1>{selectedProject.name}</h1>
          <p>
            {selectedProject.description ||
              'Use this space to manage backlog planning and move ready work into sprint execution.'}
          </p>
        </div>

        <div className="summary-action-row summary-action-row--split">
          <button
            type="button"
            className="ghost-button ghost-button--action"
            onClick={startEditingProject}
            disabled={isUpdatingProject || isDeletingProject}
          >
            Edit project
          </button>
          <button
            type="button"
            className="ghost-button ghost-button--action ghost-button--danger-solid"
            onClick={handleDeleteProjectClick}
            disabled={isUpdatingProject || isDeletingProject}
          >
            {isDeletingProject ? 'Deleting...' : 'Delete project'}
          </button>
        </div>

        {!activeSprint ? (
          <p className="status-copy project-view-note">
            Start a sprint when the backlog has work ready to commit.
          </p>
        ) : null}

        {error ? <p className="form-error">{error}</p> : null}

        {editingProjectId === selectedProject.id ? (
          <form className="form-grid project-edit-form" onSubmit={handleUpdateProjectSubmit}>
            <label>
              <span>Project name</span>
              <input
                type="text"
                name="name"
                value={editingProjectValues.name}
                onChange={handleEditingProjectChange}
              />
            </label>

            <label>
              <span>Description</span>
              <textarea
                name="description"
                rows="3"
                value={editingProjectValues.description}
                onChange={handleEditingProjectChange}
              />
            </label>

            <div className="task-actions">
              <button type="submit" className="primary-button" disabled={isUpdatingProject}>
                {isUpdatingProject ? 'Saving...' : 'Save project'}
              </button>
              <button
                type="button"
                className="ghost-button ghost-button--action"
                onClick={cancelEditingProject}
                disabled={isUpdatingProject}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : null}
      </article>

      <section className="dashboard-main-grid project-view-grid">
        <article className="card board-summary board-summary--compact">
          <div className="section-copy">
            <p className="eyebrow">Active sprint</p>
            <h2>{activeSprint ? activeSprint.name : 'No active sprint yet'}</h2>
            <p>
              {activeSprint
                ? activeSprint.goal || 'This sprint is ready to receive and organize committed work.'
                : 'Start one sprint for this project before organizing work inside the sprint board.'}
            </p>
          </div>

          <div className="summary-metric-grid summary-metric-grid--compact">
            <article className="summary-metric-card">
              <strong>{sprintTaskCount}</strong>
              <span>Sprint tasks</span>
            </article>
            <article className="summary-metric-card">
              <strong>{sprintDoneCount}</strong>
              <span>Sprint done</span>
            </article>
            <article className="summary-metric-card">
              <strong>{activeSprint ? formatDate(activeSprint.endDate) : 'None'}</strong>
              <span>Target end</span>
            </article>
          </div>

          {activeSprint ? (
            <div className="summary-action-row summary-action-row--split">
              <Link
                to={`/projects/${selectedProject.id}/sprints/${activeSprint.id}/board`}
                className="primary-button"
              >
                Open sprint board
              </Link>
              <button
                type="button"
                className="ghost-button ghost-button--panel"
                onClick={handleCompleteSprintClick}
                disabled={isCompletingSprint}
              >
                {isCompletingSprint ? 'Closing sprint...' : 'Complete sprint'}
              </button>
            </div>
          ) : (
            <form className="form-grid sprint-form" onSubmit={handleSprintSubmit}>
              <label>
                <span>Sprint name</span>
                <input
                  type="text"
                  name="name"
                  placeholder="Sprint 1"
                  value={sprintValues.name}
                  onChange={handleSprintChange}
                />
              </label>

              <label>
                <span>Goal</span>
                <textarea
                  name="goal"
                  rows="3"
                  placeholder="What should this sprint deliver?"
                  value={sprintValues.goal}
                  onChange={handleSprintChange}
                />
              </label>

              <label>
                <span>Target end date</span>
                <input
                  type="date"
                  name="endDate"
                  value={sprintValues.endDate}
                  onChange={handleSprintChange}
                />
              </label>

              <button type="submit" className="primary-button" disabled={isCreatingSprint}>
                {isCreatingSprint ? 'Starting sprint...' : 'Start sprint'}
              </button>
            </form>
          )}
        </article>

        <article className="card board-summary board-summary--compact">
          <div className="section-copy">
            <p className="eyebrow">Project backlog</p>
            <h2>{backlogTaskCount} tasks outside the sprint</h2>
            <p>
              Keep uncommitted work here, then pull it into a sprint when it is ready to be executed.
            </p>
          </div>

          <div className="summary-metric-grid summary-metric-grid--compact">
            <article className="summary-metric-card">
              <strong>{projectTaskCount}</strong>
              <span>Total tasks</span>
            </article>
            <article className="summary-metric-card">
              <strong>{selectedProject.columns.length}</strong>
              <span>Lanes</span>
            </article>
            <article className="summary-metric-card">
              <strong>{backlogTaskCount}</strong>
              <span>Backlog tasks</span>
            </article>
          </div>

          <div className="summary-action-row summary-action-row--split project-backlog-toolbar">
            <button
              type="button"
              className="ghost-button ghost-button--panel"
              onClick={() => setIsBacklogComposerOpen((currentValue) => !currentValue)}
            >
              {isBacklogComposerOpen ? 'Cancel backlog task' : 'Add backlog task'}
            </button>
            <span className="status-copy">
              Backlog tasks live in <strong>{backlogColumn?.name || 'Backlog'}</strong> until they are assigned to a sprint.
            </span>
          </div>

          {isBacklogComposerOpen ? (
            <form className="form-grid sprint-form" onSubmit={handleBacklogTaskSubmit}>
              <label>
                <span>Backlog task title</span>
                <input
                  type="text"
                  name="title"
                  placeholder="Prepare release checklist"
                  value={backlogTaskValues.title}
                  onChange={handleBacklogTaskChange}
                />
              </label>

              <label>
                <span>Description</span>
                <textarea
                  name="description"
                  rows="3"
                  placeholder="Optional details for the backlog item"
                  value={backlogTaskValues.description}
                  onChange={handleBacklogTaskChange}
                />
              </label>

              <div className="task-meta-grid">
                <label>
                  <span>Priority</span>
                  <select
                    name="priority"
                    value={backlogTaskValues.priority}
                    onChange={handleBacklogTaskChange}
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
                    value={backlogTaskValues.dueDate}
                    onChange={handleBacklogTaskChange}
                  />
                </label>
              </div>

              <label>
                <span>Labels</span>
                <input
                  type="text"
                  name="labels"
                  placeholder="frontend, qa"
                  value={backlogTaskValues.labels}
                  onChange={handleBacklogTaskChange}
                />
              </label>

              <button type="submit" className="primary-button" disabled={isCreatingTask}>
                {isCreatingTask ? 'Saving task...' : 'Add to backlog'}
              </button>
            </form>
          ) : null}

          {backlogTasks.length ? (
            <div className="project-backlog-list">
              {backlogTasks.map((task) => (
                <article key={task.id} className="project-backlog-item">
                  {editingBacklogTaskId === task.id ? (
                    <form
                      className="form-grid project-backlog-edit-form"
                      onSubmit={(event) => handleUpdateBacklogTaskSubmit(event, task.id)}
                    >
                      <label>
                        <span>Task title</span>
                        <input
                          type="text"
                          name="title"
                          value={editingBacklogTaskValues.title}
                          onChange={handleEditingBacklogTaskChange}
                        />
                      </label>

                      <label>
                        <span>Description</span>
                        <textarea
                          name="description"
                          rows="3"
                          value={editingBacklogTaskValues.description}
                          onChange={handleEditingBacklogTaskChange}
                        />
                      </label>

                      <div className="task-meta-grid">
                        <label>
                          <span>Priority</span>
                          <select
                            name="priority"
                            value={editingBacklogTaskValues.priority}
                            onChange={handleEditingBacklogTaskChange}
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
                            value={editingBacklogTaskValues.dueDate}
                            onChange={handleEditingBacklogTaskChange}
                          />
                        </label>
                      </div>

                      <label>
                        <span>Labels</span>
                        <input
                          type="text"
                          name="labels"
                          value={editingBacklogTaskValues.labels}
                          onChange={handleEditingBacklogTaskChange}
                        />
                      </label>

                      <div className="task-actions">
                        <button type="submit" className="primary-button" disabled={isUpdatingTask}>
                          {isUpdatingTask ? 'Saving...' : 'Save task'}
                        </button>
                        <button
                          type="button"
                          className="ghost-button ghost-button--action"
                          onClick={cancelEditingBacklogTask}
                          disabled={isUpdatingTask}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="project-backlog-item__copy">
                        <strong>{task.title}</strong>
                        <p>{[task.columnName, task.description].filter(Boolean).join(' - ')}</p>
                      </div>

                      <div className="project-backlog-item__actions">
                        <button
                          type="button"
                          className="ghost-button ghost-button--action"
                          onClick={() => startEditingBacklogTask(task)}
                          disabled={isUpdatingTask || isDeletingTask}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="ghost-button ghost-button--action ghost-button--danger-solid"
                          onClick={() => handleDeleteBacklogTask(task)}
                          disabled={isUpdatingTask || isDeletingTask}
                        >
                          {isDeletingTask ? 'Deleting...' : 'Delete'}
                        </button>
                        <button
                          type="button"
                          className="ghost-button ghost-button--panel"
                          disabled={!activeSprint || isUpdatingTask || isDeletingTask}
                          onClick={() => handleAddTaskToSprint(task.id)}
                        >
                          {!activeSprint
                            ? 'Start a sprint first'
                            : isUpdatingTask
                              ? 'Adding...'
                              : 'Add to sprint'}
                        </button>
                      </div>
                    </>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <p className="status-copy project-backlog-empty">
              No backlog tasks yet. Add one when work is ready to be planned.
            </p>
          )}
        </article>

        <article className="card sprint-history-panel">
          <div className="section-copy">
            <p className="eyebrow">Sprint history</p>
            <h2>{completedSprints.length ? 'Previous sprints' : 'No previous sprints yet'}</h2>
            <p>
              {completedSprints.length
                ? 'Open any previous sprint to inspect the board state and its committed work.'
                : 'Completed sprints will appear here once the project starts shipping work in cycles.'}
            </p>
          </div>

          {completedSprints.length ? (
            <div className="project-list sprint-history-list">
              {completedSprints.map((sprint) => (
                <article key={sprint.id} className="history-sprint-item">
                  <div className="history-sprint-item__copy">
                    <h3>{sprint.name}</h3>
                    <p>{sprint.goal || 'No sprint goal was added.'}</p>
                    <div className="history-sprint-item__meta">
                      <span className="history-sprint-item__pill">
                        {sprint.tasks?.length || 0} tasks
                      </span>
                      <span className="status-copy">Ended {formatDate(sprint.endDate)}</span>
                    </div>
                  </div>

                  <div className="history-sprint-item__actions">
                    <Link
                      to={`/projects/${selectedProject.id}/sprints/${sprint.id}/board`}
                      className="ghost-button ghost-button--panel"
                    >
                      View board
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </article>
      </section>
    </section>
  );
}

export default ProjectWorkspace;
