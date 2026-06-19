import { Link, useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import ActionDialog from './ActionDialog';
import EmptyStatePanel from './ui/EmptyStatePanel';
import InsightBanner from './ui/InsightBanner';
import MetricCard from './ui/MetricCard';
import { buttonClassName, cardClassName, inputClassName, labelClassName, panelClassName } from '../lib/ui';

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
      projectColumns.find((column) => column.name.toLowerCase() === 'backlog') ||
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
      <EmptyStatePanel
        eyebrow="Project"
        title="Loading project"
        description="We are pulling the latest sprint, backlog, and history details for this workspace."
      />
    );
  }

  if (!selectedProject) {
    return (
      <EmptyStatePanel
        eyebrow="Project"
        title="No project selected"
        description="Go back to the dashboard and choose a project before managing sprints or the board."
      />
    );
  }

  return (
    <section className="space-y-6">
      <article
        className={`${panelClassName} overflow-hidden bg-[linear-gradient(135deg,rgba(239,244,255,0.96),rgba(255,255,255,0.98))]`}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-600">
              Project overview
            </p>
            <h1 className="text-4xl font-semibold tracking-[-0.06em] text-ink-950 sm:text-5xl">
              {selectedProject.name}
            </h1>
            <p className="text-base leading-7 text-slate-600">
              {selectedProject.description ||
                'Use this space to manage backlog planning and move ready work into sprint execution.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className={buttonClassName('secondary')}
              onClick={startEditingProject}
              disabled={isUpdatingProject || isDeletingProject}
            >
              Edit project
            </button>
            <button
              type="button"
              className={buttonClassName('danger')}
              onClick={openDeleteProjectDialog}
              disabled={isUpdatingProject || isDeletingProject}
            >
              {isDeletingProject ? 'Deleting...' : 'Delete project'}
            </button>
          </div>
        </div>

        {!activeSprint ? (
          <div className="mt-5 rounded-[24px] border border-brand-100 bg-white/88 px-4 py-4 text-sm leading-6 text-slate-500">
            Start a sprint when the backlog has work ready to commit.
          </div>
        ) : null}

        {error ? (
          <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {error}
          </p>
        ) : null}

        {editingProjectId === selectedProject.id ? (
          <form className="mt-6 grid gap-4 rounded-[24px] border border-stroke-1 bg-white/88 p-4" onSubmit={handleUpdateProjectSubmit}>
            <div className="grid gap-4 lg:grid-cols-2">
              <label className={labelClassName}>
                <span>Project name</span>
                <input
                  type="text"
                  name="name"
                  value={editingProjectValues.name}
                  onChange={handleEditingProjectChange}
                  className={inputClassName}
                />
              </label>

              <label className={`${labelClassName} lg:col-span-2`}>
                <span>Description</span>
                <textarea
                  name="description"
                  rows="4"
                  value={editingProjectValues.description}
                  onChange={handleEditingProjectChange}
                  className={`${inputClassName} min-h-32 resize-y`}
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-3">
              <button type="submit" className={buttonClassName()} disabled={isUpdatingProject}>
                {isUpdatingProject ? 'Saving...' : 'Save project'}
              </button>
              <button
                type="button"
                className={buttonClassName('secondary')}
                onClick={cancelEditingProject}
                disabled={isUpdatingProject}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : null}
      </article>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1.05fr)_minmax(320px,0.9fr)]">
        <article className={panelClassName}>
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
              Active sprint
            </p>
            <h2 className="text-2xl font-semibold tracking-[-0.04em] text-ink-950">
              {activeSprint ? activeSprint.name : 'No active sprint yet'}
            </h2>
            <p className="text-sm leading-6 text-slate-500">
              {activeSprint
                ? activeSprint.goal || 'This sprint is ready to receive and organize committed work.'
                : 'Start one sprint for this project before organizing work inside the sprint board.'}
            </p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            <MetricCard label="Sprint tasks" value={sprintTaskCount} />
            <MetricCard label="Sprint points" value={sprintPointCount} />
            <MetricCard label="Sprint done" value={sprintDoneCount} />
            <MetricCard label="Done points" value={sprintDonePointCount} />
            <MetricCard
              label="Target end"
              value={activeSprint ? formatDate(activeSprint.endDate) : 'None'}
            />
          </div>

          {activeSprint ? <div className="mt-5"><InsightBanner insight={sprintCapacityInsight} /></div> : null}

          {activeSprint ? (
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                to={`/projects/${selectedProject.id}/sprints/${activeSprint.id}/board`}
                className={buttonClassName()}
              >
                Open sprint board
              </Link>
              <button
                type="button"
                className={buttonClassName('secondary')}
                onClick={openCompleteSprintDialog}
                disabled={isCompletingSprint}
              >
                {isCompletingSprint ? 'Closing sprint...' : 'Complete sprint'}
              </button>
            </div>
          ) : (
            <form className="mt-5 grid gap-4" onSubmit={handleSprintSubmit}>
              <label className={labelClassName}>
                <span>Sprint name</span>
                <input
                  type="text"
                  name="name"
                  placeholder="Sprint 1"
                  value={sprintValues.name}
                  onChange={handleSprintChange}
                  className={inputClassName}
                />
              </label>

              <label className={labelClassName}>
                <span>Goal</span>
                <textarea
                  name="goal"
                  rows="4"
                  placeholder="What should this sprint deliver?"
                  value={sprintValues.goal}
                  onChange={handleSprintChange}
                  className={`${inputClassName} min-h-32 resize-y`}
                />
              </label>

              <label className={labelClassName}>
                <span>Target end date</span>
                <input
                  type="date"
                  name="endDate"
                  value={sprintValues.endDate}
                  onChange={handleSprintChange}
                  className={inputClassName}
                />
              </label>

              <button type="submit" className={buttonClassName()} disabled={isCreatingSprint}>
                {isCreatingSprint ? 'Starting sprint...' : 'Start sprint'}
              </button>
            </form>
          )}
        </article>

        <article className={panelClassName}>
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
              Project backlog
            </p>
            <h2 className="text-2xl font-semibold tracking-[-0.04em] text-ink-950">
              {backlogTaskCount} tasks outside the sprint
            </h2>
            <p className="text-sm leading-6 text-slate-500">
              Keep uncommitted work here, then pull it into a sprint when it is ready to be executed.
            </p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <MetricCard label="Total tasks" value={projectTaskCount} />
            <MetricCard label="Lanes" value={projectColumns.length} />
            <MetricCard label="Backlog tasks" value={backlogTaskCount} />
            <MetricCard label="Backlog points" value={backlogPointCount} />
          </div>

          <div className="mt-5">
            <InsightBanner insight={backlogCapacityInsight} />
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              className={buttonClassName('secondary')}
              onClick={() => setIsBacklogComposerOpen((currentValue) => !currentValue)}
            >
              {isBacklogComposerOpen ? 'Cancel backlog task' : 'Add backlog task'}
            </button>
            <span className="max-w-md text-sm leading-6 text-slate-500">
              Backlog tasks live in <strong>{backlogColumn?.name || 'Backlog'}</strong> until they are assigned to a sprint.
            </span>
          </div>

          {carryOverBacklogTaskCount ? (
            <p className="mt-4 rounded-[20px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-700">
              {carryOverBacklogTaskCount} task{carryOverBacklogTaskCount === 1 ? '' : 's'} moved here after the last sprint was closed.
            </p>
          ) : null}

          {isBacklogComposerOpen ? (
            <form className="mt-5 grid gap-4 rounded-[24px] border border-stroke-1 bg-surface-100/80 p-4" onSubmit={handleBacklogTaskSubmit}>
              <label className={labelClassName}>
                <span>Backlog task title</span>
                <input
                  type="text"
                  name="title"
                  placeholder="Prepare release checklist"
                  value={backlogTaskValues.title}
                  onChange={handleBacklogTaskChange}
                  className={inputClassName}
                />
              </label>

              <label className={labelClassName}>
                <span>Description</span>
                <textarea
                  name="description"
                  rows="4"
                  placeholder="Optional details for the backlog item"
                  value={backlogTaskValues.description}
                  onChange={handleBacklogTaskChange}
                  className={`${inputClassName} min-h-32 resize-y`}
                />
              </label>

              <div className="grid gap-4 md:grid-cols-3">
                <label className={labelClassName}>
                  <span>Priority</span>
                  <select
                    name="priority"
                    value={backlogTaskValues.priority}
                    onChange={handleBacklogTaskChange}
                    className={inputClassName}
                  >
                    {priorityOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <label className={labelClassName}>
                  <span>Story points</span>
                  <input
                    type="number"
                    name="storyPoints"
                    min="0"
                    max="100"
                    step="1"
                    value={backlogTaskValues.storyPoints}
                    onChange={handleBacklogTaskChange}
                    className={inputClassName}
                  />
                </label>

                <label className={labelClassName}>
                  <span>Due date</span>
                  <input
                    type="date"
                    name="dueDate"
                    value={backlogTaskValues.dueDate}
                    onChange={handleBacklogTaskChange}
                    className={inputClassName}
                  />
                </label>
              </div>

              <label className={labelClassName}>
                <span>Labels</span>
                <input
                  type="text"
                  name="labels"
                  placeholder="frontend, qa"
                  value={backlogTaskValues.labels}
                  onChange={handleBacklogTaskChange}
                  className={inputClassName}
                />
              </label>

              <button type="submit" className={buttonClassName()} disabled={isCreatingTask}>
                {isCreatingTask ? 'Saving task...' : 'Add to backlog'}
              </button>
            </form>
          ) : null}

          {backlogTasks.length ? (
            <div className="mt-5 grid gap-4">
              {backlogTasks.map((task) => (
                <article key={task.id} className={cardClassName}>
                  {editingBacklogTaskId === task.id ? (
                    <form
                      className="grid gap-4"
                      onSubmit={(event) => handleUpdateBacklogTaskSubmit(event, task.id)}
                    >
                      <label className={labelClassName}>
                        <span>Task title</span>
                        <input
                          type="text"
                          name="title"
                          value={editingBacklogTaskValues.title}
                          onChange={handleEditingBacklogTaskChange}
                          className={inputClassName}
                        />
                      </label>

                      <label className={labelClassName}>
                        <span>Description</span>
                        <textarea
                          name="description"
                          rows="4"
                          value={editingBacklogTaskValues.description}
                          onChange={handleEditingBacklogTaskChange}
                          className={`${inputClassName} min-h-32 resize-y`}
                        />
                      </label>

                      <div className="grid gap-4 md:grid-cols-3">
                        <label className={labelClassName}>
                          <span>Priority</span>
                          <select
                            name="priority"
                            value={editingBacklogTaskValues.priority}
                            onChange={handleEditingBacklogTaskChange}
                            className={inputClassName}
                          >
                            {priorityOptions.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className={labelClassName}>
                          <span>Story points</span>
                          <input
                            type="number"
                            name="storyPoints"
                            min="0"
                            max="100"
                            step="1"
                            value={editingBacklogTaskValues.storyPoints}
                            onChange={handleEditingBacklogTaskChange}
                            className={inputClassName}
                          />
                        </label>

                        <label className={labelClassName}>
                          <span>Due date</span>
                          <input
                            type="date"
                            name="dueDate"
                            value={editingBacklogTaskValues.dueDate}
                            onChange={handleEditingBacklogTaskChange}
                            className={inputClassName}
                          />
                        </label>
                      </div>

                      <label className={labelClassName}>
                        <span>Labels</span>
                        <input
                          type="text"
                          name="labels"
                          value={editingBacklogTaskValues.labels}
                          onChange={handleEditingBacklogTaskChange}
                          className={inputClassName}
                        />
                      </label>

                      <div className="flex flex-wrap gap-3">
                        <button type="submit" className={buttonClassName()} disabled={isUpdatingTask}>
                          {isUpdatingTask ? 'Saving...' : 'Save task'}
                        </button>
                        <button
                          type="button"
                          className={buttonClassName('secondary')}
                          onClick={cancelEditingBacklogTask}
                          disabled={isUpdatingTask}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-3">
                        <div>
                          <strong className="text-lg font-semibold tracking-[-0.03em] text-ink-950">
                            {task.title}
                          </strong>
                          <p className="mt-2 text-sm leading-6 text-slate-500">
                            {[task.columnName, task.description].filter(Boolean).join(' - ')}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                            {getStoryPoints(task)} pts
                          </span>
                          {task.carryOverSprintName || task.carryOverColumnName ? (
                            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                              Carry over
                            </span>
                          ) : null}
                          {task.carryOverSprintName ? (
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                              From {task.carryOverSprintName}
                            </span>
                          ) : null}
                          {task.carryOverColumnName ? (
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                              Left in {task.carryOverColumnName}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3 lg:justify-end">
                        <button
                          type="button"
                          className={buttonClassName('secondary')}
                          onClick={() => startEditingBacklogTask(task)}
                          disabled={isUpdatingTask || isDeletingTask}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className={buttonClassName('danger')}
                          onClick={() => openDeleteBacklogTaskDialog(task)}
                          disabled={isUpdatingTask || isDeletingTask}
                        >
                          {isDeletingTask ? 'Deleting...' : 'Delete'}
                        </button>
                        <button
                          type="button"
                          className={buttonClassName('secondary')}
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
                    </div>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-5 rounded-[24px] border border-dashed border-stroke-2 bg-surface-100 px-4 py-5 text-sm leading-6 text-slate-500">
              No backlog tasks yet. Add one when work is ready to be planned.
            </p>
          )}
        </article>

        <article className={panelClassName}>
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
              Sprint history
            </p>
            <h2 className="text-2xl font-semibold tracking-[-0.04em] text-ink-950">
              {completedSprints.length ? 'Previous sprints' : 'No previous sprints yet'}
            </h2>
            <p className="text-sm leading-6 text-slate-500">
              {completedSprints.length
                ? 'Open any previous sprint to inspect the board state and its committed work.'
                : 'Completed sprints will appear here once the project starts shipping work in cycles.'}
            </p>
          </div>

          {completedSprints.length ? (
            <>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <MetricCard label="Completed sprints" value={completedSprints.length} />
                <MetricCard label="Last velocity" value={velocitySummary.lastVelocity} />
                <MetricCard
                  label="Average velocity"
                  value={formatPointAverage(velocitySummary.averageVelocity)}
                />
              </div>

              <div className="mt-5 grid gap-4">
                {completedSprints.map((sprint) => (
                  <article key={sprint.id} className={cardClassName}>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-3">
                        <div>
                          <h3 className="text-lg font-semibold tracking-[-0.03em] text-ink-950">
                            {sprint.name}
                          </h3>
                          <p className="mt-2 text-sm leading-6 text-slate-500">
                            {sprint.goal || 'No sprint goal was added.'}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                            {historyTaskCountBySprintId[sprint.id] || 0} tasks
                          </span>
                          <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                            {historyPointCountBySprintId[sprint.id] || 0} pts
                          </span>
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                            {historyVelocityBySprintId[sprint.id] || 0} done pts
                          </span>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                            Ended {getSprintCompletedDateLabel(sprint)}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Link
                          to={`/projects/${selectedProject.id}/sprints/${sprint.id}/board`}
                          className={buttonClassName('secondary')}
                        >
                          View board
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <p className="mt-5 rounded-[24px] border border-dashed border-stroke-2 bg-surface-100 px-4 py-5 text-sm leading-6 text-slate-500">
              Completed sprints will show up here once the team closes its first cycle.
            </p>
          )}
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
