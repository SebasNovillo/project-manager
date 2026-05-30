import { DndContext, DragOverlay, PointerSensor, useDraggable, useDroppable, useSensor, useSensors } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

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

function DroppableColumn({
  column,
  isActive,
  children
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: getColumnDroppableId(column.id),
    data: {
      columnId: column.id,
      type: 'column'
    }
  });

  return (
    <section
      ref={setNodeRef}
      className={`board-column ${isActive ? 'board-column--active' : ''} ${
        isOver ? 'board-column--over' : ''
      } board-column--${getColumnTone(column.name)}`}
    >
      {children(isOver)}
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
  const { attributes, listeners, setNodeRef: setDraggableNodeRef, transform, isDragging: isDraggingCard } = useDraggable({
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
      className={`task-card ${
        isDragging || isDraggingCard ? 'task-card--dragging' : ''
      } ${isOver && !isDragging ? 'task-card--over' : ''}`}
    >
      {children({
        dragHandleProps: isEditing || !isDragEnabled
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
        done: 0
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

    return {
      totalTasks,
      inFlow: Math.max(totalTasks - done, 0),
      done
    };
  }, [selectedProject, sprintId]);
  const selectedSprint = useMemo(
    () => selectedProject?.sprints?.find((sprint) => sprint.id === sprintId) || null,
    [selectedProject, sprintId]
  );
  const isReadonlySprintBoard = Boolean(selectedSprint && selectedSprint.status !== 'active');
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

    if (!values.title?.trim()) {
      setTaskFormError('Task title is required');
      return;
    }

    try {
      await onCreateTask(selectedProject.id, {
        title: values.title.trim(),
        description: values.description,
        priority: values.priority,
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

    const nextSprintId = task.sprintId === selectedSprint.id ? null : selectedSprint.id;

    try {
      await onUpdateTask(selectedProject.id, task.id, {
        sprintId: nextSprintId
      });
      setTaskFormError('');
      setTaskFormSuccess(
        nextSprintId ? 'Task added to the sprint.' : 'Task moved back to the backlog.'
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

  return (
    <section className="dashboard-stack">
      <section className="board-shell">
        <article className="card board-project-bar">
          <div className="board-project-bar__content">
            <div className="board-project-bar__copy">
              <p className="eyebrow">Sprint Board</p>
              {selectedProject ? (
                <p className="board-project-kicker">{selectedProject.name}</p>
              ) : null}
              {selectedProject ? (
                <Link
                  to={`/projects/${selectedProject.id}`}
                  className="ghost-button ghost-button--panel board-project-link"
                >
                  Back to project
                </Link>
              ) : null}
              <h1>{selectedSprint ? selectedSprint.name : 'Choose a sprint'}</h1>
              <p>
                {selectedSprint
                  ? selectedSprint.goal ||
                    'Manage the tasks committed to this sprint and move them across the board.'
                  : 'Open a project sprint before managing the board.'}
              </p>
              {selectedSprint ? (
                <p className="board-instruction">
                  {isReadonlySprintBoard
                    ? 'This sprint is closed. You can review its board, but changes are locked.'
                    : isMobileBoard
                      ? 'Use the column selector and the Move to control to update progress.'
                      : 'Drag cards between columns to update progress.'}
                </p>
              ) : null}
              {selectedSprint ? (
                <div className="board-sprint-banner">
                  <span className="board-sprint-banner__eyebrow">
                    {isReadonlySprintBoard ? 'Sprint history' : 'Active sprint'}
                  </span>
                  <strong>{selectedSprint.name}</strong>
                  <span>{sprintTaskCount} tasks included</span>
                </div>
              ) : null}
            </div>

            {selectedProject ? (
              <div className="board-stat-grid">
                <div className="board-stat-chip">
                  <strong>{boardStats.totalTasks}</strong>
                  <span>Total cards</span>
                </div>
                <div className="board-stat-chip">
                  <strong>{boardStats.inFlow}</strong>
                  <span>In flow</span>
                </div>
                <div className="board-stat-chip">
                  <strong>{boardStats.done}</strong>
                  <span>Done</span>
                </div>
              </div>
            ) : null}
          </div>

          {isLoading ? <p className="status-copy">Loading projects...</p> : null}
          {error ? <p className="form-error">{error}</p> : null}
          {taskFormError || taskFormSuccess ? (
            <div className="board-feedback" aria-live="polite">
              {taskFormError ? (
                <p className="board-feedback__item board-feedback__item--error">{taskFormError}</p>
              ) : null}
              {taskFormSuccess ? (
                <p className="board-feedback__item board-feedback__item--success">
                  {taskFormSuccess}
                </p>
              ) : null}
            </div>
          ) : null}
        </article>

        {selectedSprint ? (
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDropTask}
            onDragCancel={handleDragEnd}
          >
            {isMobileBoard ? (
              <div className="board-mobile-switcher" role="tablist" aria-label="Board columns">
                {scopedColumns.map((column) => (
                  <button
                    key={column.id}
                    type="button"
                    className={`board-mobile-switcher__chip ${
                      column.id === mobileColumnId ? 'board-mobile-switcher__chip--active' : ''
                    }`}
                    onClick={() => setMobileColumnId(column.id)}
                  >
                    <span>{column.name}</span>
                    <strong>{column.tasks.length}</strong>
                  </button>
                ))}
              </div>
            ) : null}

            <div className="board-preview board-preview--full">
              {visibleColumns.map((column) => (
                <DroppableColumn
                  key={column.id}
                  column={column}
                  isActive={overColumnId === column.id}
                >
                  {(isOver) => (
                    <>
                      <header className="board-column-header">
                        <h3>{column.name}</h3>
                        <span>{column.tasks.length} cards</span>
                      </header>

                      <div
                        className={`board-column-body board-column-body--stack ${
                          isOver ? 'board-column-body--over' : ''
                        }`}
                      >
                        {column.tasks.length === 0 ? (
                          <p className="drop-hint">
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
                                  );
                                }

                                return (
                                  <>
                                    <div className="task-card-copy">
                                      <div className="task-card-top">
                                        <h4>{task.title}</h4>
                                        {!isMobileBoard ? (
                                          <button
                                            type="button"
                                            className="task-grip"
                                            aria-label={`Drag task ${task.title}`}
                                            {...dragHandleProps}
                                          >
                                            <span className="task-grip__dots" aria-hidden="true">
                                              ::
                                            </span>
                                            Move
                                          </button>
                                        ) : null}
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
                                      {task.isCarriedOverFromHistory ? (
                                        <p className="task-history-note">
                                          Carried over after sprint close from {task.carryOverColumnName || 'this stage'}.
                                        </p>
                                      ) : null}
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

                                    {!isReadonlySprintBoard ? (
                                      <div className="task-card-footer">
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
                                        <button
                                          type="button"
                                          className="ghost-button task-secondary-action"
                                          disabled={isUpdatingTask || isDeletingTask}
                                          onClick={() => handleToggleSprintTask(task)}
                                        >
                                          Move back to backlog
                                        </button>
                                      </div>
                                    ) : null}

                                    {!isReadonlySprintBoard && moveTargetsByColumnId[column.id]?.length ? (
                                      <div className="task-mobile-move">
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
                                        >
                                          {moveTargetsByColumnId[column.id].map((targetColumn) => (
                                            <option key={targetColumn.id} value={targetColumn.id}>
                                              {targetColumn.name}
                                            </option>
                                          ))}
                                        </select>
                                        <button
                                          type="button"
                                          className="ghost-button ghost-button--panel"
                                          disabled={isUpdatingTask}
                                          onClick={() => handleMobileMove(task.id, column.id)}
                                        >
                                          Move to
                                        </button>
                                      </div>
                                    ) : null}
                                  </>
                                );
                              }}
                            </TaskCard>
                          ))
                        )}
                      </div>

                      {!isReadonlySprintBoard ? (
                        <div className="column-footer">
                          <button
                            type="button"
                            className="ghost-button ghost-button--panel"
                            onClick={() => toggleTaskComposer(column.id)}
                          >
                            {openTaskComposerByColumn[column.id] ? 'Cancel' : 'Add task'}
                          </button>
                        </div>
                      ) : null}

                      {!isReadonlySprintBoard && openTaskComposerByColumn[column.id] ? (
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

                          <p className="task-form-note">
                            This task will be created directly in <strong>{column.name}</strong>.
                          </p>

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
                    </>
                  )}
                </DroppableColumn>
              ))}
            </div>

            <DragOverlay>
              {activeDragTask ? (
                <article className="task-card task-card--overlay">
                  <div className="task-card-copy">
                    <div className="task-card-top">
                      <h4>{activeDragTask.title}</h4>
                      <span className="task-grip task-grip--static">
                        <span className="task-grip__dots" aria-hidden="true">
                          ::
                        </span>
                        Move
                      </span>
                    </div>
                    <div className="task-meta-row">
                      <span
                        className={`priority-badge priority-badge--${
                          activeDragTask.priority || 'medium'
                        }`}
                      >
                        {activeDragTask.priority || 'medium'}
                      </span>
                      <span className="due-date-badge">
                        {formatDueDate(activeDragTask.dueDate)}
                      </span>
                    </div>
                    <p>{activeDragTask.description || 'No description yet.'}</p>
                  </div>
                </article>
              ) : null}
            </DragOverlay>
          </DndContext>
        ) : (
          <article className="card board-empty">
            <p className="eyebrow">Board</p>
            <h3>No sprint selected</h3>
            <p>Open a project sprint before managing tasks in the board.</p>
          </article>
        )}
      </section>
    </section>
  );
}

export default BoardWorkspace;
