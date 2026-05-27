import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';

function formatDate(value) {
  if (!value) {
    return 'Open';
  }

  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
}

function ProjectWorkspace({
  selectedProject,
  isLoading,
  error,
  onUpdateProject,
  onUpdateTask,
  onDeleteProject,
  onCreateSprint,
  onCompleteSprint,
  isUpdatingProject,
  isUpdatingTask,
  isDeletingProject,
  isCreatingSprint,
  isCompletingSprint
}) {
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

  const backlogTaskCount = Math.max(projectTaskCount - sprintTaskCount, 0);
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

    const confirmed = window.confirm(
      `Delete "${selectedProject.name}"? This will remove its columns, tasks, and sprints.`
    );

    if (!confirmed) {
      return;
    }

    await onDeleteProject(selectedProject.id);
  };

  const handleSprintChange = (event) => {
    const { name, value } = event.target;

    setSprintValues((currentValues) => ({
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

  const handleAddTaskToSprint = async (taskId) => {
    if (!selectedProject || !activeSprint) {
      return;
    }

    await onUpdateTask(selectedProject.id, taskId, {
      sprintId: activeSprint.id
    });
  };

  if (isLoading) {
    return <article className="card board-empty"><p className="status-copy">Loading project...</p></article>;
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
              'Use this space to manage the active sprint before moving into board execution.'}
          </p>
        </div>

        <div className="summary-action-row summary-action-row--split">
          {activeSprint ? (
            <Link
              to={`/projects/${selectedProject.id}/sprints/${activeSprint.id}/board`}
              className="primary-button"
            >
              Open active sprint board
            </Link>
          ) : (
            <span className="status-copy project-view-note">
              Start a sprint to unlock the board for this project.
            </span>
          )}
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
          <Link to="/" className="ghost-button ghost-button--panel">
            Back to dashboard
          </Link>
        </div>

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
                : 'Start one sprint for this project before organizing its work inside the board.'}
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
                onClick={() => onCompleteSprint(selectedProject.id, activeSprint.id)}
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
              Use the board to decide what stays in backlog and what becomes part of the active sprint.
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

          {activeSprint && backlogTasks.length ? (
            <div className="project-backlog-list">
              {backlogTasks.map((task) => (
                <article key={task.id} className="project-backlog-item">
                  <div>
                    <strong>{task.title}</strong>
                    <p>
                      {task.columnName}
                      {task.description ? ` · ${task.description}` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="ghost-button ghost-button--panel"
                    disabled={isUpdatingTask}
                    onClick={() => handleAddTaskToSprint(task.id)}
                  >
                    {isUpdatingTask ? 'Adding...' : 'Add to sprint'}
                  </button>
                </article>
              ))}
            </div>
          ) : null}
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
            <div className="project-list">
              {completedSprints.map((sprint) => (
                <article key={sprint.id} className="project-list-item">
                  <div className="project-select-button">
                    <div className="project-list-item-top">
                      <h3>{sprint.name}</h3>
                      <span>{sprint.tasks?.length || 0} tasks</span>
                    </div>
                    <p>{sprint.goal || 'No sprint goal was added.'}</p>
                    <div className="summary-action-row summary-action-row--split">
                      <span className="status-copy">Ended {formatDate(sprint.endDate)}</span>
                      <Link
                        to={`/projects/${selectedProject.id}/sprints/${sprint.id}/board`}
                        className="ghost-button ghost-button--panel"
                      >
                        View board
                      </Link>
                    </div>
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
