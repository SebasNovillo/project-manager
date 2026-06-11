import { Link, useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import ActionDialog from './ActionDialog';

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

function getSprintCompletedDateLabel(sprint) {
  return formatDate(sprint?.completedAt || sprint?.endDate);
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

function getStoryPoints(task) {
  return Number(task?.storyPoints) || 0;
}

function formatPointAverage(value) {
  if (!value) {
    return '0';
  }

  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function getCapacityInsight(plannedPoints, averageVelocity, scopeLabel) {
  if (!averageVelocity) {
    return {
      tone: 'neutral',
      title: 'Capacity guidance needs history',
      description: `Complete at least one sprint to compare this ${scopeLabel} against your average velocity.`
    };
  }

  if (!plannedPoints) {
    return {
      tone: 'neutral',
      title: 'No estimated work yet',
      description: `Add story points to this ${scopeLabel} to compare it with your ${formatPointAverage(averageVelocity)} point average velocity.`
    };
  }

  const ratio = plannedPoints / averageVelocity;
  const averageLabel = formatPointAverage(averageVelocity);

  if (ratio <= 0.9) {
    return {
      tone: 'good',
      title: 'Comfortably within capacity',
      description: `This ${scopeLabel} has ${plannedPoints} pts against an average velocity of ${averageLabel} pts.`
    };
  }

  if (ratio <= 1.15) {
    return {
      tone: 'warning',
      title: 'Close to average capacity',
      description: `This ${scopeLabel} is near the team average of ${averageLabel} pts. Keep scope changes small.`
    };
  }

  return {
    tone: 'risk',
    title: 'Above average capacity',
    description: `This ${scopeLabel} has ${plannedPoints} pts, which is above the ${averageLabel} pt average velocity. Consider trimming scope.`
  };
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
    storyPoints: '0',
    labels: '',
    dueDate: ''
  });
  const [isBacklogComposerOpen, setIsBacklogComposerOpen] = useState(false);
  const [editingBacklogTaskId, setEditingBacklogTaskId] = useState('');
  const [editingBacklogTaskValues, setEditingBacklogTaskValues] = useState({
    title: '',
    description: '',
    priority: 'medium',
    storyPoints: '0',
    labels: '',
    dueDate: ''
  });
  const [isDeleteProjectDialogOpen, setIsDeleteProjectDialogOpen] = useState(false);
  const [isCompleteSprintDialogOpen, setIsCompleteSprintDialogOpen] = useState(false);
  const [taskPendingDelete, setTaskPendingDelete] = useState(null);
  const projectColumns = selectedProject?.columns || [];

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

    return projectColumns.reduce(
      (count, column) =>
        count + column.tasks.filter((task) => task.sprintId === activeSprint.id).length,
      0
    );
  }, [activeSprint, projectColumns, selectedProject]);

  const projectTaskCount = useMemo(() => {
    if (!selectedProject) {
      return 0;
    }

    return projectColumns.reduce((count, column) => count + column.tasks.length, 0);
  }, [projectColumns, selectedProject]);

  const sprintDoneCount = useMemo(() => {
    if (!selectedProject || !activeSprint) {
      return 0;
    }

    const doneColumn = projectColumns.find(
      (column) => column.name.toLowerCase() === 'done'
    );

    return doneColumn?.tasks.filter((task) => task.sprintId === activeSprint.id).length || 0;
  }, [activeSprint, projectColumns, selectedProject]);
  const sprintPointCount = useMemo(() => {
    if (!selectedProject || !activeSprint) {
      return 0;
    }

    return projectColumns.reduce(
      (count, column) =>
        count +
        column.tasks
          .filter((task) => task.sprintId === activeSprint.id)
          .reduce((points, task) => points + getStoryPoints(task), 0),
      0
    );
  }, [activeSprint, projectColumns, selectedProject]);
  const sprintDonePointCount = useMemo(() => {
    if (!selectedProject || !activeSprint) {
      return 0;
    }

    const doneColumn = projectColumns.find(
      (column) => column.name.toLowerCase() === 'done'
    );

    return (
      doneColumn?.tasks
        .filter((task) => task.sprintId === activeSprint.id)
        .reduce((points, task) => points + getStoryPoints(task), 0) || 0
    );
  }, [activeSprint, projectColumns, selectedProject]);
  const incompleteSprintTaskCount = Math.max(sprintTaskCount - sprintDoneCount, 0);

  const backlogTasks = useMemo(() => {
    if (!selectedProject) {
      return [];
    }

    return projectColumns.flatMap((column) =>
      column.tasks
        .filter((task) => !task.sprintId)
        .map((task) => ({
          ...task,
          columnName: column.name
        }))
    );
  }, [projectColumns, selectedProject]);

  const backlogTaskCount = backlogTasks.length;
  const backlogPointCount = backlogTasks.reduce(
    (points, task) => points + getStoryPoints(task),
    0
  );
  const carryOverBacklogTaskCount = backlogTasks.filter((task) => task.carryOverSprintId).length;
  const historyTaskCountBySprintId = useMemo(() => {
    if (!selectedProject) {
      return {};
    }

    return projectColumns
      .flatMap((column) => column.tasks)
      .reduce((lookup, task) => {
        if (task.sprintId) {
          lookup[task.sprintId] = (lookup[task.sprintId] || 0) + 1;
        }

        if (task.carryOverSprintId) {
          lookup[task.carryOverSprintId] = (lookup[task.carryOverSprintId] || 0) + 1;
        }

        return lookup;
      }, {});
  }, [projectColumns, selectedProject]);
  const historyPointCountBySprintId = useMemo(() => {
    if (!selectedProject) {
      return {};
    }

    return projectColumns
      .flatMap((column) => column.tasks)
      .reduce((lookup, task) => {
        const points = getStoryPoints(task);

        if (task.sprintId) {
          lookup[task.sprintId] = (lookup[task.sprintId] || 0) + points;
        }

        if (task.carryOverSprintId) {
          lookup[task.carryOverSprintId] = (lookup[task.carryOverSprintId] || 0) + points;
        }

        return lookup;
      }, {});
  }, [projectColumns, selectedProject]);
  const historyVelocityBySprintId = useMemo(() => {
    if (!selectedProject) {
      return {};
    }

    const doneColumn = projectColumns.find(
      (column) => column.name.toLowerCase() === 'done'
    );

    if (!doneColumn) {
      return {};
    }

    return doneColumn.tasks.reduce((lookup, task) => {
      if (task.sprintId) {
        lookup[task.sprintId] = (lookup[task.sprintId] || 0) + getStoryPoints(task);
      }

      return lookup;
    }, {});
  }, [projectColumns, selectedProject]);
  const velocitySummary = useMemo(() => {
    if (!completedSprints.length) {
      return {
        lastVelocity: 0,
        averageVelocity: 0
      };
    }

    const velocities = completedSprints.map(
      (sprint) => historyVelocityBySprintId[sprint.id] || 0
    );
    const totalVelocity = velocities.reduce((sum, points) => sum + points, 0);

    return {
      lastVelocity: velocities[0] || 0,
      averageVelocity: totalVelocity / velocities.length
    };
  }, [completedSprints, historyVelocityBySprintId]);
  const sprintCapacityInsight = useMemo(
    () => getCapacityInsight(sprintPointCount, velocitySummary.averageVelocity, 'sprint'),
    [sprintPointCount, velocitySummary.averageVelocity]
  );
  const backlogCapacityInsight = useMemo(
    () => getCapacityInsight(backlogPointCount, velocitySummary.averageVelocity, 'backlog'),
    [backlogPointCount, velocitySummary.averageVelocity]
  );

  const backlogColumn = useMemo(() => {
    if (!selectedProject) {
      return null;
    }

    return (
      projectColumns.find(
        (column) => column.name.toLowerCase() === 'backlog'
      ) ||
      projectColumns[0] ||
      null
    );
  }, [projectColumns, selectedProject]);

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

  const openDeleteProjectDialog = () => {
    if (!selectedProject) {
      return;
    }

    setIsDeleteProjectDialogOpen(true);
  };

  const handleDeleteProjectConfirm = async () => {
    if (!selectedProject) {
      return;
    }

    await onDeleteProject(selectedProject.id);
    setIsDeleteProjectDialogOpen(false);
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
      storyPoints: backlogTaskValues.storyPoints,
      labels: normalizeLabels(backlogTaskValues.labels),
      dueDate: backlogTaskValues.dueDate,
      sprintId: null,
      columnId: backlogColumn.id
    });
    setBacklogTaskValues({
      title: '',
      description: '',
      priority: 'medium',
      storyPoints: '0',
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

  const openCompleteSprintDialog = () => {
    if (!selectedProject || !activeSprint) {
      return;
    }

    setIsCompleteSprintDialogOpen(true);
  };

  const handleCompleteSprintConfirm = async () => {
    if (!selectedProject || !activeSprint) {
      return;
    }

    await onCompleteSprint(selectedProject.id, activeSprint.id);
    setIsCompleteSprintDialogOpen(false);
  };

  const startEditingBacklogTask = (task) => {
    setEditingBacklogTaskId(task.id);
    setEditingBacklogTaskValues({
      title: task.title,
      description: task.description || '',
      priority: task.priority || 'medium',
      storyPoints: String(task.storyPoints ?? 0),
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
      storyPoints: '0',
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
      storyPoints: editingBacklogTaskValues.storyPoints,
      labels: normalizeLabels(editingBacklogTaskValues.labels),
      dueDate: editingBacklogTaskValues.dueDate || null
    });
    cancelEditingBacklogTask();
  };

  const openDeleteBacklogTaskDialog = (task) => {
    if (!selectedProject) {
      return;
    }

    setTaskPendingDelete(task);
  };

  const handleDeleteBacklogTaskConfirm = async () => {
    if (!selectedProject || !taskPendingDelete) {
      return;
    }

    await onDeleteTask(selectedProject.id, taskPendingDelete.id);

    if (editingBacklogTaskId === taskPendingDelete.id) {
      cancelEditingBacklogTask();
    }

    setTaskPendingDelete(null);
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
            onClick={openDeleteProjectDialog}
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
              <strong>{sprintPointCount}</strong>
              <span>Sprint points</span>
            </article>
            <article className="summary-metric-card">
              <strong>{sprintDoneCount}</strong>
              <span>Sprint done</span>
            </article>
            <article className="summary-metric-card">
              <strong>{sprintDonePointCount}</strong>
              <span>Done points</span>
            </article>
            <article className="summary-metric-card">
              <strong>{activeSprint ? formatDate(activeSprint.endDate) : 'None'}</strong>
              <span>Target end</span>
            </article>
          </div>

          {activeSprint ? (
            <div className={`capacity-insight capacity-insight--${sprintCapacityInsight.tone}`}>
              <strong>{sprintCapacityInsight.title}</strong>
              <span>{sprintCapacityInsight.description}</span>
            </div>
          ) : null}

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
                onClick={openCompleteSprintDialog}
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
              <strong>{projectColumns.length}</strong>
              <span>Lanes</span>
            </article>
            <article className="summary-metric-card">
              <strong>{backlogTaskCount}</strong>
              <span>Backlog tasks</span>
            </article>
            <article className="summary-metric-card">
              <strong>{backlogPointCount}</strong>
              <span>Backlog points</span>
            </article>
          </div>

          <div className={`capacity-insight capacity-insight--${backlogCapacityInsight.tone}`}>
            <strong>{backlogCapacityInsight.title}</strong>
            <span>{backlogCapacityInsight.description}</span>
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

          {carryOverBacklogTaskCount ? (
            <p className="status-copy project-backlog-carryover-note">
              {carryOverBacklogTaskCount} task{carryOverBacklogTaskCount === 1 ? '' : 's'} moved here after the last sprint was closed.
            </p>
          ) : null}

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
                  <span>Story points</span>
                  <input
                    type="number"
                    name="storyPoints"
                    min="0"
                    max="100"
                    step="1"
                    value={backlogTaskValues.storyPoints}
                    onChange={handleBacklogTaskChange}
                  />
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
                          <span>Story points</span>
                          <input
                            type="number"
                            name="storyPoints"
                            min="0"
                            max="100"
                            step="1"
                            value={editingBacklogTaskValues.storyPoints}
                            onChange={handleEditingBacklogTaskChange}
                          />
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
                        <div className="project-backlog-item__meta">
                          <span className="project-backlog-pill">{getStoryPoints(task)} pts</span>
                          {task.carryOverSprintName || task.carryOverColumnName ? (
                            <span className="project-backlog-pill">Carry over</span>
                          ) : null}
                          {task.carryOverSprintName ? (
                            <span className="status-copy">From {task.carryOverSprintName}</span>
                          ) : null}
                          {task.carryOverColumnName ? (
                            <span className="status-copy">Left in {task.carryOverColumnName}</span>
                          ) : null}
                        </div>
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
                          onClick={() => openDeleteBacklogTaskDialog(task)}
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
            <div className="summary-metric-grid summary-metric-grid--compact sprint-history-metrics">
              <article className="summary-metric-card">
                <strong>{completedSprints.length}</strong>
                <span>Completed sprints</span>
              </article>
              <article className="summary-metric-card">
                <strong>{velocitySummary.lastVelocity}</strong>
                <span>Last velocity</span>
              </article>
              <article className="summary-metric-card">
                <strong>{formatPointAverage(velocitySummary.averageVelocity)}</strong>
                <span>Average velocity</span>
              </article>
            </div>
          ) : null}

          {completedSprints.length ? (
            <div className="project-list sprint-history-list">
              {completedSprints.map((sprint) => (
                <article key={sprint.id} className="history-sprint-item">
                  <div className="history-sprint-item__copy">
                    <h3>{sprint.name}</h3>
                    <p>{sprint.goal || 'No sprint goal was added.'}</p>
                    <div className="history-sprint-item__meta">
                      <span className="history-sprint-item__pill">
                        {historyTaskCountBySprintId[sprint.id] || 0} tasks
                      </span>
                      <span className="history-sprint-item__pill">
                        {historyPointCountBySprintId[sprint.id] || 0} pts
                      </span>
                      <span className="history-sprint-item__pill history-sprint-item__pill--velocity">
                        {historyVelocityBySprintId[sprint.id] || 0} done pts
                      </span>
                      <span className="status-copy">Ended {getSprintCompletedDateLabel(sprint)}</span>
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

      <ActionDialog
        isOpen={isDeleteProjectDialogOpen}
        title={`Delete ${selectedProject?.name || 'project'}?`}
        description="This action will remove the project, its columns, every task, and its sprint history."
        confirmLabel={isDeletingProject ? 'Deleting...' : 'Delete project'}
        tone="danger"
        isBusy={isDeletingProject}
        requiredText={selectedProject?.name || ''}
        inputLabel="Project name"
        inputPlaceholder={selectedProject?.name || ''}
        inputHelp="Type the project name exactly to confirm permanent deletion."
        onClose={() => setIsDeleteProjectDialogOpen(false)}
        onConfirm={handleDeleteProjectConfirm}
      />

      <ActionDialog
        isOpen={isCompleteSprintDialogOpen}
        title={`Complete ${activeSprint?.name || 'sprint'}?`}
        description={
          incompleteSprintTaskCount
            ? `This sprint still has ${incompleteSprintTaskCount} incomplete task${
                incompleteSprintTaskCount === 1 ? '' : 's'
              }. They will move back to the project backlog and keep carry-over context.`
            : 'All visible sprint work is done. You can close this sprint now.'
        }
        confirmLabel={isCompletingSprint ? 'Closing sprint...' : 'Complete sprint'}
        tone="warning"
        isBusy={isCompletingSprint}
        onClose={() => setIsCompleteSprintDialogOpen(false)}
        onConfirm={handleCompleteSprintConfirm}
      />

      <ActionDialog
        isOpen={Boolean(taskPendingDelete)}
        title={`Delete ${taskPendingDelete?.title || 'task'}?`}
        description="This backlog task will be permanently removed from the project."
        confirmLabel={isDeletingTask ? 'Deleting...' : 'Delete task'}
        tone="danger"
        isBusy={isDeletingTask}
        onClose={() => setTaskPendingDelete(null)}
        onConfirm={handleDeleteBacklogTaskConfirm}
      />
    </section>
  );
}

export default ProjectWorkspace;
