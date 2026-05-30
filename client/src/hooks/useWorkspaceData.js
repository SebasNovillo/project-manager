import { useEffect, useMemo, useState } from 'react';
import useAuth from './useAuth';
import {
  createProject,
  deleteProject as deleteProjectRequest,
  getProjects,
  updateProject as updateProjectRequest
} from '../services/projectService';
import {
  createTask,
  deleteTask as deleteTaskRequest,
  updateTask
} from '../services/taskService';
import {
  completeSprint as completeSprintRequest,
  createSprint as createSprintRequest
} from '../services/sprintService';

const SELECTED_PROJECT_STORAGE_KEY = 'project-manager-selected-project';

function sortColumns(columns) {
  return [...columns].sort((left, right) => left.position - right.position);
}

function updateProjectInList(projects, projectId, updater) {
  return projects.map((project) => {
    if (project.id !== projectId) {
      return project;
    }

    return updater(project);
  });
}

function reorderProjectTasks(project, taskId, targetColumnId, targetIndex, updatedTaskData = {}) {
  let movedTask = null;

  const columnsWithoutTask = project.columns.map((column) => {
    const foundTask = column.tasks.find((task) => task.id === taskId);

    if (foundTask) {
      movedTask = foundTask;
    }

    return {
      ...column,
      tasks: column.tasks.filter((task) => task.id !== taskId)
    };
  });

  if (!movedTask) {
    return project;
  }

  return {
    ...project,
    columns: sortColumns(
      columnsWithoutTask.map((column) => {
        if (column.id !== targetColumnId) {
          return {
            ...column,
            tasks: column.tasks.map((task, index) => ({
              ...task,
              position: index
            }))
          };
        }

        const insertionIndex = Math.max(
          0,
          Math.min(
            typeof targetIndex === 'number' ? targetIndex : column.tasks.length,
            column.tasks.length
          )
        );
        const nextTasks = [...column.tasks];

        nextTasks.splice(insertionIndex, 0, {
          ...movedTask,
          ...updatedTaskData,
          columnId: targetColumnId
        });

        return {
          ...column,
          tasks: nextTasks.map((task, index) => ({
            ...task,
            position: index
          }))
        };
      })
    )
  };
}

function useWorkspaceData() {
  const { token, logout } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(() => {
    return window.localStorage.getItem(SELECTED_PROJECT_STORAGE_KEY) || '';
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isUpdatingTask, setIsUpdatingTask] = useState(false);
  const [isDeletingTask, setIsDeletingTask] = useState(false);
  const [isUpdatingProject, setIsUpdatingProject] = useState(false);
  const [isDeletingProject, setIsDeletingProject] = useState(false);
  const [isCreatingSprint, setIsCreatingSprint] = useState(false);
  const [isCompletingSprint, setIsCompletingSprint] = useState(false);
  const [error, setError] = useState('');

  const handleWorkspaceError = (requestError) => {
    if (requestError?.status === 401) {
      logout();
      setProjects([]);
      setSelectedProjectId('');
      setError('');
      return;
    }

    setError(requestError.message);
  };

  useEffect(() => {
    let isMounted = true;

    async function loadProjects() {
      try {
        setIsLoading(true);
        const items = await getProjects(token);

        if (isMounted) {
          setProjects(items);
          setSelectedProjectId((currentId) => {
            const hasCurrent = items.some((project) => project.id === currentId);

            if (hasCurrent) {
              return currentId;
            }

            return items[0]?.id || '';
          });
          setError('');
        }
      } catch (requestError) {
        if (isMounted) {
          handleWorkspaceError(requestError);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadProjects();

    return () => {
      isMounted = false;
    };
  }, [token]);

  useEffect(() => {
    if (selectedProjectId) {
      window.localStorage.setItem(
        SELECTED_PROJECT_STORAGE_KEY,
        selectedProjectId
      );
      return;
    }

    window.localStorage.removeItem(SELECTED_PROJECT_STORAGE_KEY);
  }, [selectedProjectId]);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) || projects[0] || null,
    [projects, selectedProjectId]
  );

  const handleCreateProject = async (values) => {
    try {
      setIsCreating(true);
      const createdProject = await createProject(values, token);

      setProjects((currentProjects) => [createdProject, ...currentProjects]);
      setSelectedProjectId(createdProject.id);
      setError('');
      return createdProject;
    } catch (requestError) {
      handleWorkspaceError(requestError);
      throw requestError;
    } finally {
      setIsCreating(false);
    }
  };

  const handleSelectProject = (projectId) => {
    setSelectedProjectId(projectId);
  };

  const handleUpdateProject = async (projectId, values) => {
    try {
      setIsUpdatingProject(true);
      const updatedProject = await updateProjectRequest(projectId, values, token);

      setProjects((currentProjects) =>
        updateProjectInList(currentProjects, projectId, () => updatedProject)
      );
      setError('');
      return updatedProject;
    } catch (requestError) {
      handleWorkspaceError(requestError);
      throw requestError;
    } finally {
      setIsUpdatingProject(false);
    }
  };

  const handleDeleteProject = async (projectId) => {
    try {
      setIsDeletingProject(true);
      await deleteProjectRequest(projectId, token);

      setProjects((currentProjects) => {
        const nextProjects = currentProjects.filter((project) => project.id !== projectId);

        setSelectedProjectId((currentSelectedProjectId) => {
          if (currentSelectedProjectId !== projectId) {
            return currentSelectedProjectId;
          }

          return nextProjects[0]?.id || '';
        });

        return nextProjects;
      });
      setError('');
    } catch (requestError) {
      handleWorkspaceError(requestError);
      throw requestError;
    } finally {
      setIsDeletingProject(false);
    }
  };

  const handleCreateTask = async (projectId, values) => {
    try {
      setIsCreatingTask(true);
      const createdTask = await createTask(projectId, values, token);

      setProjects((currentProjects) =>
        updateProjectInList(currentProjects, projectId, (project) => ({
          ...project,
          columns: sortColumns(
            project.columns.map((column) =>
              column.id === createdTask.columnId
                ? {
                    ...column,
                    tasks: [...column.tasks, createdTask].sort(
                      (left, right) => left.position - right.position
                    )
                  }
                : column
            )
          )
        }))
      );
      setError('');
      return createdTask;
    } catch (requestError) {
      handleWorkspaceError(requestError);
      throw requestError;
    } finally {
      setIsCreatingTask(false);
    }
  };

  const handleCreateSprint = async (projectId, values) => {
    try {
      setIsCreatingSprint(true);
      const createdSprint = await createSprintRequest(projectId, values, token);

      setProjects((currentProjects) =>
        updateProjectInList(currentProjects, projectId, (project) => ({
          ...project,
          sprints: [createdSprint, ...(project.sprints || [])]
        }))
      );
      setError('');
      return createdSprint;
    } catch (requestError) {
      handleWorkspaceError(requestError);
      throw requestError;
    } finally {
      setIsCreatingSprint(false);
    }
  };

  const handleCompleteSprint = async (projectId, sprintId) => {
    try {
      setIsCompletingSprint(true);
      await completeSprintRequest(sprintId, token);
      const items = await getProjects(token);

      setProjects(items);
      setSelectedProjectId((currentId) => {
        const hasCurrent = items.some((project) => project.id === currentId);

        if (hasCurrent) {
          return currentId;
        }

        return items[0]?.id || '';
      });
      setError('');
      return items.find((project) => project.id === projectId) || null;
    } catch (requestError) {
      handleWorkspaceError(requestError);
      throw requestError;
    } finally {
      setIsCompletingSprint(false);
    }
  };

  const handleMoveTask = async (projectId, taskId, columnId, targetIndex) => {
    try {
      setIsUpdatingTask(true);
      const updatedTask = await updateTask(taskId, { columnId, position: targetIndex }, token);

      setProjects((currentProjects) =>
        updateProjectInList(currentProjects, projectId, (project) =>
          reorderProjectTasks(
            project,
            taskId,
            updatedTask.columnId,
            updatedTask.position,
            updatedTask
          )
        )
      );
      setError('');
      return updatedTask;
    } catch (requestError) {
      handleWorkspaceError(requestError);
      throw requestError;
    } finally {
      setIsUpdatingTask(false);
    }
  };

  const handleUpdateTask = async (projectId, taskId, values) => {
    try {
      setIsUpdatingTask(true);
      const updatedTask = await updateTask(taskId, values, token);

      setProjects((currentProjects) =>
        updateProjectInList(currentProjects, projectId, (project) => ({
          ...project,
          columns: sortColumns(
            project.columns.map((column) => ({
              ...column,
              tasks: column.tasks
                .map((task) => (task.id === taskId ? { ...task, ...updatedTask } : task))
                .sort((left, right) => left.position - right.position)
            }))
          )
        }))
      );
      setError('');
      return updatedTask;
    } catch (requestError) {
      handleWorkspaceError(requestError);
      throw requestError;
    } finally {
      setIsUpdatingTask(false);
    }
  };

  const handleDeleteTask = async (projectId, taskId) => {
    try {
      setIsDeletingTask(true);
      await deleteTaskRequest(taskId, token);

      setProjects((currentProjects) =>
        updateProjectInList(currentProjects, projectId, (project) => ({
          ...project,
          columns: sortColumns(
            project.columns.map((column) => ({
              ...column,
              tasks: column.tasks.filter((task) => task.id !== taskId)
            }))
          )
        }))
      );
      setError('');
    } catch (requestError) {
      handleWorkspaceError(requestError);
      throw requestError;
    } finally {
      setIsDeletingTask(false);
    }
  };

  return {
    projects,
    selectedProjectId,
    selectedProject,
    isLoading,
    isCreating,
    isCreatingTask,
    isUpdatingTask,
    isDeletingTask,
    isUpdatingProject,
    isDeletingProject,
    isCreatingSprint,
    isCompletingSprint,
    error,
    onCreateProject: handleCreateProject,
    onUpdateProject: handleUpdateProject,
    onDeleteProject: handleDeleteProject,
    onSelectProject: handleSelectProject,
    onCreateTask: handleCreateTask,
    onMoveTask: handleMoveTask,
    onUpdateTask: handleUpdateTask,
    onDeleteTask: handleDeleteTask,
    onCreateSprint: handleCreateSprint,
    onCompleteSprint: handleCompleteSprint
  };
}

export default useWorkspaceData;
