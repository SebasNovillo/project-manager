import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import EmptyStatePanel from './ui/EmptyStatePanel';
import FeedbackBanner from './ui/FeedbackBanner';
import MetricCard from './ui/MetricCard';
import {
  buttonClassName,
  cx,
  inputClassName,
  labelClassName,
  panelClassName
} from '../lib/ui';

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

function formatSprintDateRange(sprint) {
  if (!sprint?.startDate && !sprint?.endDate) {
    return 'Schedule not set';
  }

  const formatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric'
  });
  const start = sprint?.startDate ? formatter.format(new Date(sprint.startDate)) : 'Start now';
  const end = sprint?.endDate ? formatter.format(new Date(sprint.endDate)) : 'No deadline';

  return `${start} - ${end}`;
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

function getBoardColumnLabel(name, sprint) {
  if (sprint?.status === 'active' && name.toLowerCase() === 'backlog') {
    return 'Sprint Backlog';
  }

  return name;
}

function getColumnDroppableId(columnId) {
  return `column-${columnId}`;
}

function getTaskDraggableId(taskId) {
  return `task-${taskId}`;
}

function matchesSprintBoardTask(task, sprint) {
  if (!sprint) {
    return false;
  }

  return (
    task.sprintId === sprint.id ||
    (sprint.status !== 'active' && task.carryOverSprintId === sprint.id)
  );
}

function getSprintBoardColumnName(task, sprint, currentColumnName) {
  if (
    sprint?.status !== 'active' &&
    task.carryOverSprintId === sprint.id &&
    task.carryOverColumnName
  ) {
    return task.carryOverColumnName;
  }

  return currentColumnName;
}

function getColumnTheme(name) {
  const tone = name.toLowerCase();

  if (tone === 'backlog') {
    return {
      shell: 'border-slate-200 bg-white/88',
      body: 'bg-white/72'
    };
  }

  if (tone === 'to do' || tone === 'todo') {
    return {
      shell: 'border-sky-200 bg-sky-50/70',
      body: 'bg-white/80'
    };
  }

  if (tone === 'in progress') {
    return {
      shell: 'border-brand-200 bg-brand-50/70',
      body: 'bg-white/82'
    };
  }

  if (tone === 'review') {
    return {
      shell: 'border-amber-200 bg-amber-50/70',
      body: 'bg-white/82'
    };
  }

  if (tone === 'done') {
    return {
      shell: 'border-emerald-200 bg-emerald-50/70',
      body: 'bg-white/82'
    };
  }

  return {
    shell: 'border-stroke-1 bg-surface-100/80',
    body: 'bg-white/80'
  };
}

function getPriorityBadgeClass(priority) {
  const tone = (priority || 'medium').toLowerCase();

  if (tone === 'urgent') {
    return 'bg-red-50 text-red-700';
  }

  if (tone === 'high') {
    return 'bg-amber-50 text-amber-700';
  }

  if (tone === 'low') {
    return 'bg-slate-100 text-slate-600';
  }

  return 'bg-brand-50 text-brand-700';
}

function DroppableColumn({ column, isActive, children }) {
  const { setNodeRef, isOver } = useDroppable({
    id: getColumnDroppableId(column.id),
    data: {
      columnId: column.id,
      type: 'column'
    }
  });
  const theme = getColumnTheme(column.name);

  return (
    <section
      ref={setNodeRef}
      className={cx(
        'rounded-[28px] border p-4 shadow-soft-card transition',
        theme.shell,
        isOver
          ? 'border-brand-300 ring-4 ring-brand-100'
          : isActive
            ? 'border-brand-200 ring-2 ring-brand-100'
            : ''
      )}
    >
      {children({ isOver, theme })}
    </section>
  );
}

function TaskCard({
  task,
  columnId,
  isEditing,
  isDragging,
  isDragEnabled,
  children
}) {
  const draggableId = getTaskDraggableId(task.id);
  const {
    attributes,
    listeners,
    setNodeRef: setDraggableNodeRef,
    transform,
    isDragging: isDraggingCard
  } = useDraggable({
    id: draggableId,
    data: {
      taskId: task.id,
      columnId,
      type: 'task'
    },
    disabled: isEditing || !isDragEnabled
  });
  const { setNodeRef: setDroppableNodeRef, isOver } = useDroppable({
    id: draggableId,
    data: {
      taskId: task.id,
      columnId,
      type: 'task'
    }
  });

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform)
      }
    : undefined;

  const setNodeRef = (node) => {
    setDraggableNodeRef(node);
    setDroppableNodeRef(node);
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={cx(
        'rounded-[24px] border border-stroke-1 bg-white p-4 shadow-soft-card transition',
        isDragging || isDraggingCard
          ? 'rotate-[1deg] scale-[1.01] border-brand-300 shadow-soft-panel'
          : '',
        isOver && !isDragging ? 'border-brand-300 ring-4 ring-brand-100' : ''
      )}
    >
      {children({
        dragHandleProps:
          isEditing || !isDragEnabled
            ? {}
            : {
                ...attributes,
                ...listeners
              }
      })}
    </article>
  );
}

function BoardWorkspace({
  selectedProject,
  sprintId,
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
  const [taskFormError, setTaskFormError] = useState('');
  const [taskFormSuccess, setTaskFormSuccess] = useState('');
  const [editingValues, setEditingValues] = useState({
    title: '',
    description: '',
    priority: 'medium',
    storyPoints: '0',
    labels: '',
    dueDate: ''
  });
  const [mobileMoveTargetByTask, setMobileMoveTargetByTask] = useState({});
  const [activeDragTaskId, setActiveDragTaskId] = useState('');
  const [overColumnId, setOverColumnId] = useState('');
  const [mobileColumnId, setMobileColumnId] = useState('');
  const [isMobileBoard, setIsMobileBoard] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.matchMedia('(max-width: 767px) and (orientation: portrait)').matches;
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    })
  );

  const activeDragTask = useMemo(() => {
    if (!selectedProject || !activeDragTaskId) {
      return null;
    }

    return selectedProject.columns
      .flatMap((column) => column.tasks)
      .find((task) => task.id === activeDragTaskId) || null;
  }, [activeDragTaskId, selectedProject]);

  const boardStats = useMemo(() => {
    const routeSprint = selectedProject?.sprints?.find((sprint) => sprint.id === sprintId) || null;

    if (!selectedProject || !routeSprint) {
      return {
        totalTasks: 0,
        inFlow: 0,
        done: 0,
        totalPoints: 0,
        inFlowPoints: 0,
        donePoints: 0
      };
    }

    const scopedTasks = selectedProject.columns.flatMap((column) =>
      column.tasks
        .filter((task) => matchesSprintBoardTask(task, routeSprint))
        .map((task) => ({
          ...task,
          boardColumnName: getSprintBoardColumnName(task, routeSprint, column.name)
        }))
    );
    const totalTasks = scopedTasks.length;
    const done = scopedTasks.filter(
      (task) => task.boardColumnName?.toLowerCase() === 'done'
    ).length;
    const totalPoints = scopedTasks.reduce((points, task) => points + getStoryPoints(task), 0);
    const donePoints = scopedTasks
      .filter((task) => task.boardColumnName?.toLowerCase() === 'done')
      .reduce((points, task) => points + getStoryPoints(task), 0);

    return {
      totalTasks,
      inFlow: Math.max(totalTasks - done, 0),
      done,
      totalPoints,
      inFlowPoints: Math.max(totalPoints - donePoints, 0),
      donePoints
    };
  }, [selectedProject, sprintId]);

  const selectedSprint = useMemo(
    () => selectedProject?.sprints?.find((sprint) => sprint.id === sprintId) || null,
    [selectedProject, sprintId]
  );

  const isReadonlySprintBoard = Boolean(selectedSprint && selectedSprint.status !== 'active');
  const boardPhaseLabel = isReadonlySprintBoard ? 'Sprint history' : 'Active sprint';
  const boardDateRange = selectedSprint ? formatSprintDateRange(selectedSprint) : 'Choose a sprint';

  const backlogColumn = useMemo(() => {
    if (!selectedProject) {
      return null;
    }

    return (
      selectedProject.columns.find((column) => column.name.toLowerCase() === 'backlog') ||
      selectedProject.columns[0] ||
      null
    );
  }, [selectedProject]);

  const sprintTaskCount = useMemo(() => {
    if (!selectedProject || !selectedSprint) {
      return 0;
    }

    return selectedProject.columns.reduce((count, column) => {
      return (
        count +
        column.tasks.filter((task) => matchesSprintBoardTask(task, selectedSprint)).length
      );
    }, 0);
  }, [selectedProject, selectedSprint]);

  const scopedColumns = useMemo(() => {
    if (!selectedProject || !selectedSprint) {
      return [];
    }

    const sprintTasks = selectedProject.columns.flatMap((column) =>
      column.tasks
        .filter((task) => matchesSprintBoardTask(task, selectedSprint))
        .map((task) => ({
          ...task,
          boardColumnName: getSprintBoardColumnName(task, selectedSprint, column.name),
          isCarriedOverFromHistory:
            selectedSprint.status !== 'active' && task.carryOverSprintId === selectedSprint.id
        }))
    );

    return selectedProject.columns.map((column) => ({
      ...column,
      tasks: sprintTasks.filter(
        (task) => task.boardColumnName?.toLowerCase() === column.name.toLowerCase()
      )
    }));
  }, [selectedProject, selectedSprint]);

  const visibleColumns = useMemo(() => {
    if (!selectedProject) {
      return [];
    }

    if (!isMobileBoard || !mobileColumnId) {
      return scopedColumns;
    }

    return scopedColumns.filter((column) => column.id === mobileColumnId);
  }, [isMobileBoard, mobileColumnId, scopedColumns, selectedProject]);

  const moveTargetsByColumnId = useMemo(() => {
    if (!selectedProject) {
      return {};
    }

    return selectedProject.columns.reduce((lookup, column) => {
      lookup[column.id] = selectedProject.columns.filter(
        (candidate) => candidate.id !== column.id
      );

      return lookup;
    }, {});
  }, [selectedProject]);

  useEffect(() => {
    if (!taskFormSuccess) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setTaskFormSuccess('');
    }, 2200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [taskFormSuccess]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(max-width: 767px) and (orientation: portrait)');

    const syncViewport = (event) => {
      setIsMobileBoard(event.matches);
    };

    setIsMobileBoard(mediaQuery.matches);

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', syncViewport);

      return () => {
        mediaQuery.removeEventListener('change', syncViewport);
      };
    }

    mediaQuery.addListener(syncViewport);

    return () => {
      mediaQuery.removeListener(syncViewport);
    };
  }, []);

  useEffect(() => {
    if (!selectedProject) {
      setMobileColumnId('');
      return;
    }

    const hasActiveColumn = selectedProject.columns.some(
      (column) => column.id === mobileColumnId
    );

    if (!hasActiveColumn) {
      setMobileColumnId(selectedProject.columns[0]?.id || '');
    }
  }, [mobileColumnId, selectedProject]);

  const handleTaskChange = (columnId, field, value) => {
    if (taskFormError) {
      setTaskFormError('');
    }

    setTaskForms((currentForms) => ({
      ...currentForms,
      [columnId]: {
        title: currentForms[columnId]?.title || '',
        description: currentForms[columnId]?.description || '',
        priority: currentForms[columnId]?.priority || 'medium',
        storyPoints: currentForms[columnId]?.storyPoints || '0',
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
      storyPoints: '0',
      labels: '',
      dueDate: ''
    };

    if (!values.title?.trim()) {
      setTaskFormError('Task title is required');
      return;
    }

    try {
      await onCreateTask(selectedProject.id, {
        title: values.title.trim(),
        description: values.description,
        priority: values.priority,
        storyPoints: values.storyPoints,
        labels: normalizeLabels(values.labels),
        dueDate: values.dueDate,
        sprintId: selectedSprint?.status === 'active' ? selectedSprint.id : null,
        columnId
      });
      setTaskFormError('');
      setTaskFormSuccess('Task created successfully.');

      setTaskForms((currentForms) => ({
        ...currentForms,
        [columnId]: {
          title: '',
          description: '',
          priority: 'medium',
          storyPoints: '0',
          labels: '',
          dueDate: ''
        }
      }));
      setOpenTaskComposerByColumn((currentState) => ({
        ...currentState,
        [columnId]: false
      }));
    } catch (requestError) {
      setTaskFormError(requestError.message || 'Could not create task');
    }
  };

  const handleMoveTask = async (taskId, columnId, targetIndex) => {
    if (!selectedProject) {
      return;
    }

    try {
      await onMoveTask(selectedProject.id, taskId, columnId, targetIndex);
      setTaskFormError('');
      setTaskFormSuccess('Task moved successfully.');
    } catch (requestError) {
      setTaskFormError(requestError.message || 'Could not move task');
    }
  };

  const startEditingTask = (task) => {
    setOpenTaskComposerByColumn({});
    setTaskFormError('');
    setTaskFormSuccess('');
    setEditingTaskId(task.id);
    setEditingValues({
      title: task.title,
      description: task.description || '',
      priority: task.priority || 'medium',
      storyPoints: String(task.storyPoints ?? 0),
      labels: (task.labels || []).join(', '),
      dueDate: task.dueDate ? String(task.dueDate).slice(0, 10) : ''
    });
  };

  const cancelEditingTask = () => {
    setEditingTaskId('');
    setTaskFormError('');
    setEditingValues({
      title: '',
      description: '',
      priority: 'medium',
      storyPoints: '0',
      labels: '',
      dueDate: ''
    });
  };

  const handleEditingValueChange = (event) => {
    const { name, value } = event.target;

    if (taskFormError) {
      setTaskFormError('');
    }

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

    if (!editingValues.title?.trim()) {
      setTaskFormError('Task title is required');
      return;
    }

    try {
      await onUpdateTask(selectedProject.id, taskId, {
        ...editingValues,
        title: editingValues.title.trim(),
        labels: normalizeLabels(editingValues.labels)
      });
      setTaskFormError('');
      setTaskFormSuccess('Task updated successfully.');
      cancelEditingTask();
    } catch (requestError) {
      setTaskFormError(requestError.message || 'Could not update task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!selectedProject) {
      return;
    }

    try {
      await onDeleteTask(selectedProject.id, taskId);
      setTaskFormError('');
      setTaskFormSuccess('Task deleted successfully.');

      if (editingTaskId === taskId) {
        cancelEditingTask();
      }
    } catch (requestError) {
      setTaskFormError(requestError.message || 'Could not delete task');
    }
  };

  const handleToggleSprintTask = async (task) => {
    if (!selectedProject || !selectedSprint || selectedSprint.status !== 'active') {
      return;
    }

    const isRemovingFromSprint = task.sprintId === selectedSprint.id;
    const nextSprintId = isRemovingFromSprint ? null : selectedSprint.id;
    const updates = {
      sprintId: nextSprintId
    };

    if (isRemovingFromSprint && backlogColumn) {
      updates.columnId = backlogColumn.id;
    }

    try {
      await onUpdateTask(selectedProject.id, task.id, updates);
      setTaskFormError('');
      setTaskFormSuccess(
        nextSprintId ? 'Task added to the sprint.' : 'Task removed from the sprint.'
      );
    } catch (requestError) {
      setTaskFormError(requestError.message || 'Could not update sprint assignment');
    }
  };

  const handleDragStart = (event) => {
    if (isMobileBoard || isReadonlySprintBoard) {
      return;
    }

    const taskId = event.active.data.current?.taskId || '';
    const fromColumnId = event.active.data.current?.columnId || '';

    setActiveDragTaskId(taskId);
    setOverColumnId(fromColumnId);
  };

  const handleDragEnd = () => {
    setActiveDragTaskId('');
    setOverColumnId('');
  };

  const toggleTaskComposer = (columnId) => {
    setEditingTaskId('');
    setTaskFormError('');
    setTaskFormSuccess('');
    setOpenTaskComposerByColumn((currentState) => {
      const nextValue = !currentState[columnId];

      if (!nextValue) {
        return {};
      }

      return {
        [columnId]: true
      };
    });
  };

  const handleDragOver = (event) => {
    if (isMobileBoard || isReadonlySprintBoard) {
      return;
    }

    const nextColumnId = event.over?.data.current?.columnId || '';

    setOverColumnId(nextColumnId);
  };

  const handleMobileMoveTargetChange = (taskId, columnId) => {
    setMobileMoveTargetByTask((currentTargets) => ({
      ...currentTargets,
      [taskId]: columnId
    }));
  };

  const handleMobileMove = async (taskId, currentColumnId) => {
    const availableTargets = moveTargetsByColumnId[currentColumnId] || [];
    const fallbackTarget = availableTargets[0]?.id || '';
    const targetColumnId = mobileMoveTargetByTask[taskId] || fallbackTarget;

    if (!targetColumnId) {
      return;
    }

    await handleMoveTask(taskId, targetColumnId);
  };

  const handleDropTask = async (event) => {
    if (isMobileBoard || isReadonlySprintBoard) {
      handleDragEnd();
      return;
    }

    const taskId = event.active.data.current?.taskId || '';
    const fromColumnId = event.active.data.current?.columnId || '';
    const overData = event.over?.data.current;
    const targetColumnId = overData?.columnId || '';

    if (!taskId || !fromColumnId || !targetColumnId) {
      handleDragEnd();
      return;
    }

    let targetIndex;
    const targetColumn = selectedProject?.columns.find((column) => column.id === targetColumnId);

    if (overData?.type === 'task') {
      if (overData.taskId === taskId) {
        handleDragEnd();
        return;
      }

      targetIndex = targetColumn?.tasks.findIndex((task) => task.id === overData.taskId);

      if (targetIndex !== undefined && targetIndex < 0) {
        targetIndex = undefined;
      }
    } else if (overData?.type === 'column' && fromColumnId === targetColumnId) {
      targetIndex = targetColumn?.tasks.length;
    }

    if (
      fromColumnId === targetColumnId &&
      (targetIndex === undefined || targetIndex < 0)
    ) {
      handleDragEnd();
      return;
    }

    await handleMoveTask(taskId, targetColumnId, targetIndex);
    handleDragEnd();
  };

  if (isLoading) {
    return (
      <EmptyStatePanel
        eyebrow="Board"
        title="Loading sprint board"
        description="We are bringing in the latest sprint lanes and cards for this project."
      />
    );
  }

  if (!selectedSprint) {
    return (
      <EmptyStatePanel
        eyebrow="Board"
        title="No sprint selected"
        description="Open a project sprint before managing tasks in the board."
      />
    );
  }

  return (
    <section className="space-y-6">
      <article
        className={`${panelClassName} overflow-hidden bg-[linear-gradient(135deg,rgba(239,244,255,0.96),rgba(255,255,255,0.98))]`}
      >
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-600">
                {boardPhaseLabel}
              </p>
              {selectedProject ? (
                <p className="text-sm font-medium text-slate-500">{selectedProject.name}</p>
              ) : null}
              <h1 className="text-4xl font-semibold tracking-[-0.06em] text-ink-950 sm:text-5xl">
                {selectedSprint.name}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-600">
                {selectedSprint.goal ||
                  'Manage the tasks committed to this sprint and move them across the board.'}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-soft-card">
                {boardDateRange}
              </span>
              <span className="rounded-full bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-700 shadow-soft-card">
                {sprintTaskCount} tasks
              </span>
              <span className="rounded-full bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-soft-card">
                {boardStats.totalPoints} pts planned
              </span>
            </div>

            <p className="text-sm leading-6 text-slate-500">
              {isReadonlySprintBoard
                ? 'This sprint is archived. Review the state of the board without editing cards.'
                : isMobileBoard
                  ? 'Use the column tabs and move controls to update work from mobile.'
                  : "Drag cards across the board to reflect the team's progress in real time."}
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link
                to={`/projects/${selectedProject.id}`}
                className={buttonClassName('secondary')}
              >
                Back to project
              </Link>
              <span
                className={`rounded-full px-3 py-2 text-sm font-semibold ${
                  isReadonlySprintBoard
                    ? 'bg-slate-100 text-slate-500'
                    : 'bg-emerald-50 text-emerald-700'
                }`}
              >
                {isReadonlySprintBoard ? 'Closed sprint' : 'Live board'}
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <MetricCard label="Total cards" value={boardStats.totalTasks} />
              <MetricCard label="In flow" value={boardStats.inFlow} />
              <MetricCard label="Done" value={boardStats.done} />
              <MetricCard label="Done points" value={boardStats.donePoints} />
            </div>
          </div>
        </div>

        {(error || taskFormError || taskFormSuccess) ? (
          <div className="mt-5 grid gap-3" aria-live="polite">
            {error ? <FeedbackBanner message={error} tone="error" /> : null}
            {taskFormError ? <FeedbackBanner message={taskFormError} tone="error" /> : null}
            {taskFormSuccess ? <FeedbackBanner message={taskFormSuccess} tone="success" /> : null}
          </div>
        ) : null}
      </article>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDropTask}
        onDragCancel={handleDragEnd}
      >
        {isMobileBoard ? (
          <div className="flex gap-3 overflow-x-auto pb-1" role="tablist" aria-label="Board columns">
            {scopedColumns.map((column) => (
              <button
                key={column.id}
                type="button"
                className={`inline-flex min-h-12 items-center gap-3 rounded-2xl border px-4 py-3 text-left shadow-soft-card transition ${
                  column.id === mobileColumnId
                    ? 'border-brand-200 bg-brand-50 text-brand-700'
                    : 'border-stroke-1 bg-white text-slate-600'
                }`}
                onClick={() => setMobileColumnId(column.id)}
              >
                <span className="whitespace-nowrap text-sm font-semibold">
                  {getBoardColumnLabel(column.name, selectedSprint)}
                </span>
                <strong className="rounded-full bg-white/90 px-2 py-1 text-xs font-semibold">
                  {column.tasks.length}
                </strong>
              </button>
            ))}
          </div>
        ) : null}

        <div className={`grid gap-4 ${isMobileBoard ? 'grid-cols-1' : 'xl:grid-cols-4 md:grid-cols-2'}`}>
          {visibleColumns.map((column) => (
            <DroppableColumn
              key={column.id}
              column={column}
              isActive={overColumnId === column.id}
            >
              {({ isOver, theme }) => (
                <div className="space-y-4">
                  <header className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold tracking-[-0.03em] text-ink-950">
                        {getBoardColumnLabel(column.name, selectedSprint)}
                      </h2>
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        {column.tasks.length} cards
                      </p>
                    </div>
                    <strong className="rounded-full bg-white/92 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                      {column.tasks.reduce((total, task) => total + getStoryPoints(task), 0)} pts
                    </strong>
                  </header>

                  <div
                    className={`grid gap-3 rounded-[24px] p-2 transition ${theme.body} ${
                      isOver ? 'ring-4 ring-brand-100' : ''
                    }`}
                  >
                    {column.tasks.length === 0 ? (
                      <p className="rounded-[20px] border border-dashed border-stroke-2 bg-white/70 px-4 py-8 text-center text-sm leading-6 text-slate-500">
                        {activeDragTaskId ? 'Drop a task here' : 'No tasks in this stage yet.'}
                      </p>
                    ) : (
                      column.tasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          columnId={column.id}
                          isEditing={editingTaskId === task.id}
                          isDragging={activeDragTaskId === task.id}
                          isDragEnabled={!isMobileBoard && !isReadonlySprintBoard}
                        >
                          {({ dragHandleProps }) => {
                            if (editingTaskId === task.id) {
                              return (
                                <form
                                  className="grid gap-4"
                                  onSubmit={(event) => handleUpdateTask(event, task.id)}
                                >
                                  <label className={labelClassName}>
                                    <span>Task title</span>
                                    <input
                                      type="text"
                                      name="title"
                                      value={editingValues.title}
                                      onChange={handleEditingValueChange}
                                      className={inputClassName}
                                    />
                                  </label>

                                  <label className={labelClassName}>
                                    <span>Description</span>
                                    <textarea
                                      name="description"
                                      rows="4"
                                      value={editingValues.description}
                                      onChange={handleEditingValueChange}
                                      className={`${inputClassName} min-h-28 resize-y`}
                                    />
                                  </label>

                                  <div className="grid gap-4 md:grid-cols-3">
                                    <label className={labelClassName}>
                                      <span>Priority</span>
                                      <select
                                        name="priority"
                                        value={editingValues.priority}
                                        onChange={handleEditingValueChange}
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
                                        value={editingValues.storyPoints}
                                        onChange={handleEditingValueChange}
                                        className={inputClassName}
                                      />
                                    </label>

                                    <label className={labelClassName}>
                                      <span>Due date</span>
                                      <input
                                        type="date"
                                        name="dueDate"
                                        value={editingValues.dueDate}
                                        onChange={handleEditingValueChange}
                                        className={inputClassName}
                                      />
                                    </label>
                                  </div>

                                  <label className={labelClassName}>
                                    <span>Labels</span>
                                    <input
                                      type="text"
                                      name="labels"
                                      placeholder="design, frontend"
                                      value={editingValues.labels}
                                      onChange={handleEditingValueChange}
                                      className={inputClassName}
                                    />
                                  </label>

                                  <div className="flex flex-wrap gap-3">
                                    <button
                                      type="submit"
                                      className={buttonClassName()}
                                      disabled={isUpdatingTask}
                                    >
                                      {isUpdatingTask ? 'Saving...' : 'Save'}
                                    </button>
                                    <button
                                      type="button"
                                      className={buttonClassName('secondary')}
                                      onClick={cancelEditingTask}
                                      disabled={isUpdatingTask}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </form>
                              );
                            }

                            return (
                              <div className="space-y-4">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="space-y-2">
                                    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                                      TK-{task.id.slice(0, 4).toUpperCase()}
                                    </span>
                                    <h3 className="text-lg font-semibold tracking-[-0.03em] text-ink-950">
                                      {task.title}
                                    </h3>
                                  </div>

                                  {!isMobileBoard ? (
                                    <button
                                      type="button"
                                      className="inline-flex min-h-10 items-center gap-2 rounded-2xl border border-stroke-1 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 transition hover:border-brand-200 hover:text-brand-700"
                                      aria-label={`Drag task ${task.title}`}
                                      {...dragHandleProps}
                                    >
                                      <span aria-hidden="true">::</span>
                                      Move
                                    </button>
                                  ) : null}
                                </div>

                                <div className="flex flex-wrap gap-2">
                                  {task.labels?.[0] ? (
                                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                                      {task.labels[0]}
                                    </span>
                                  ) : null}
                                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${getPriorityBadgeClass(task.priority)}`}>
                                    {task.priority || 'medium'}
                                  </span>
                                  <span className="rounded-full bg-surface-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                                    {formatDueDate(task.dueDate)}
                                  </span>
                                  <span className="rounded-full bg-surface-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                                    {getStoryPoints(task)} pts
                                  </span>
                                </div>

                                <p className="text-sm leading-6 text-slate-500">
                                  {task.description || 'No description yet.'}
                                </p>

                                {task.isCarriedOverFromHistory ? (
                                  <p className="rounded-[18px] border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-700">
                                    Carried over after sprint close from {task.carryOverColumnName || 'this stage'}.
                                  </p>
                                ) : null}

                                {task.labels?.length ? (
                                  <div className="flex flex-wrap gap-2">
                                    {task.labels.map((label) => (
                                      <span
                                        key={label}
                                        className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700"
                                      >
                                        {label}
                                      </span>
                                    ))}
                                  </div>
                                ) : null}

                                {!isReadonlySprintBoard ? (
                                  <div className="flex flex-wrap gap-3">
                                    <button
                                      type="button"
                                      className={buttonClassName('secondary')}
                                      disabled={isUpdatingTask || isDeletingTask}
                                      onClick={() => startEditingTask(task)}
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      className={buttonClassName('danger')}
                                      disabled={isUpdatingTask || isDeletingTask}
                                      onClick={() => handleDeleteTask(task.id)}
                                    >
                                      {isDeletingTask ? 'Deleting...' : 'Delete'}
                                    </button>
                                    <button
                                      type="button"
                                      className={buttonClassName('secondary')}
                                      disabled={isUpdatingTask || isDeletingTask}
                                      onClick={() => handleToggleSprintTask(task)}
                                    >
                                      Return to backlog
                                    </button>
                                  </div>
                                ) : null}

                                {isMobileBoard &&
                                !isReadonlySprintBoard &&
                                moveTargetsByColumnId[column.id]?.length ? (
                                  <div className="grid gap-3 rounded-[20px] border border-stroke-1 bg-surface-100/70 p-3">
                                    <select
                                      aria-label={`Move ${task.title} to another column`}
                                      value={
                                        mobileMoveTargetByTask[task.id] ||
                                        moveTargetsByColumnId[column.id][0]?.id ||
                                        ''
                                      }
                                      onChange={(event) =>
                                        handleMobileMoveTargetChange(task.id, event.target.value)
                                      }
                                      disabled={isUpdatingTask}
                                      className="w-full rounded-2xl border border-stroke-1 bg-white px-4 py-3 text-sm text-ink-950 outline-none"
                                    >
                                      {moveTargetsByColumnId[column.id].map((targetColumn) => (
                                        <option key={targetColumn.id} value={targetColumn.id}>
                                          {getBoardColumnLabel(targetColumn.name, selectedSprint)}
                                        </option>
                                      ))}
                                    </select>
                                    <button
                                      type="button"
                                      className={buttonClassName('secondary')}
                                      disabled={isUpdatingTask}
                                      onClick={() => handleMobileMove(task.id, column.id)}
                                    >
                                      Move to
                                    </button>
                                  </div>
                                ) : null}
                              </div>
                            );
                          }}
                        </TaskCard>
                      ))
                    )}
                  </div>

                  {!isReadonlySprintBoard ? (
                    <div className="pt-1">
                      <button
                        type="button"
                        className={buttonClassName('secondary')}
                        onClick={() => toggleTaskComposer(column.id)}
                      >
                        {openTaskComposerByColumn[column.id] ? 'Cancel' : 'Add card'}
                      </button>
                    </div>
                  ) : null}

                  {!isReadonlySprintBoard && openTaskComposerByColumn[column.id] ? (
                    <form
                      className="grid gap-4 rounded-[24px] border border-stroke-1 bg-white/88 p-4"
                      onSubmit={(event) => handleTaskSubmit(event, column.id)}
                    >
                      <label className={labelClassName}>
                        <span>Task title</span>
                        <input
                          type="text"
                          name={`task-title-${column.id}`}
                          placeholder={`Add a task to ${getBoardColumnLabel(column.name, selectedSprint)}`}
                          value={taskForms[column.id]?.title || ''}
                          onChange={(event) =>
                            handleTaskChange(column.id, 'title', event.target.value)
                          }
                          className={inputClassName}
                        />
                      </label>

                      <label className={labelClassName}>
                        <span>Description</span>
                        <textarea
                          name={`task-description-${column.id}`}
                          placeholder="Optional details"
                          value={taskForms[column.id]?.description || ''}
                          onChange={(event) =>
                            handleTaskChange(column.id, 'description', event.target.value)
                          }
                          rows="4"
                          className={`${inputClassName} min-h-28 resize-y`}
                        />
                      </label>

                      <p className="rounded-[20px] border border-brand-100 bg-brand-50/70 px-4 py-3 text-sm leading-6 text-brand-700">
                        This task will be created directly in <strong>{getBoardColumnLabel(column.name, selectedSprint)}</strong>.
                      </p>

                      <div className="grid gap-4 md:grid-cols-3">
                        <label className={labelClassName}>
                          <span>Priority</span>
                          <select
                            name={`task-priority-${column.id}`}
                            value={taskForms[column.id]?.priority || 'medium'}
                            onChange={(event) =>
                              handleTaskChange(column.id, 'priority', event.target.value)
                            }
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
                            name={`task-story-points-${column.id}`}
                            min="0"
                            max="100"
                            step="1"
                            value={taskForms[column.id]?.storyPoints || '0'}
                            onChange={(event) =>
                              handleTaskChange(column.id, 'storyPoints', event.target.value)
                            }
                            className={inputClassName}
                          />
                        </label>

                        <label className={labelClassName}>
                          <span>Due date</span>
                          <input
                            type="date"
                            name={`task-due-date-${column.id}`}
                            value={taskForms[column.id]?.dueDate || ''}
                            onChange={(event) =>
                              handleTaskChange(column.id, 'dueDate', event.target.value)
                            }
                            className={inputClassName}
                          />
                        </label>
                      </div>

                      <label className={labelClassName}>
                        <span>Labels</span>
                        <input
                          type="text"
                          name={`task-labels-${column.id}`}
                          placeholder="design, frontend"
                          value={taskForms[column.id]?.labels || ''}
                          onChange={(event) =>
                            handleTaskChange(column.id, 'labels', event.target.value)
                          }
                          className={inputClassName}
                        />
                      </label>

                      <button
                        type="submit"
                        className={buttonClassName()}
                        disabled={isCreatingTask}
                      >
                        {isCreatingTask ? 'Saving task...' : 'Add task'}
                      </button>
                    </form>
                  ) : null}
                </div>
              )}
            </DroppableColumn>
          ))}
        </div>

        <DragOverlay>
          {activeDragTask ? (
            <article className="w-[320px] rounded-[24px] border border-brand-300 bg-white p-4 shadow-soft-panel">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-semibold tracking-[-0.03em] text-ink-950">
                    {activeDragTask.title}
                  </h3>
                  <span className="inline-flex min-h-10 items-center gap-2 rounded-2xl border border-stroke-1 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    <span aria-hidden="true">::</span>
                    Move
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${getPriorityBadgeClass(activeDragTask.priority)}`}>
                    {activeDragTask.priority || 'medium'}
                  </span>
                  <span className="rounded-full bg-surface-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                    {formatDueDate(activeDragTask.dueDate)}
                  </span>
                  <span className="rounded-full bg-surface-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                    {getStoryPoints(activeDragTask)} pts
                  </span>
                </div>
                <p className="text-sm leading-6 text-slate-500">
                  {activeDragTask.description || 'No description yet.'}
                </p>
              </div>
            </article>
          ) : null}
        </DragOverlay>
      </DndContext>
    </section>
  );
}

export default BoardWorkspace;
