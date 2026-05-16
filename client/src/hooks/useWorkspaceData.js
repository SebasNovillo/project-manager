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

function useWorkspaceData() {
  const { token } = useAuth();
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
  const [error, setError] = useState('');

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
          setError(requestError.message);
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
      setError(requestError.message);
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
      setError(requestError.message);
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
      setError(requestError.message);
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
      setError(requestError.message);
      throw requestError;
    } finally {
      setIsCreatingTask(false);
    }
  };

  const handleMoveTask = async (projectId, taskId, columnId) => {
    try {
      setIsUpdatingTask(true);
      const updatedTask = await updateTask(taskId, { columnId }, token);

      setProjects((currentProjects) =>
        updateProjectInList(currentProjects, projectId, (project) => ({
          ...project,
          columns: sortColumns(
            project.columns.map((column) => {
              const remainingTasks = column.tasks.filter((task) => task.id !== taskId);

              if (column.id === updatedTask.columnId) {
                return {
                  ...column,
                  tasks: [...remainingTasks, updatedTask].sort(
                    (left, right) => left.position - right.position
                  )
                };
              }

              return {
                ...column,
                tasks: remainingTasks
              };
            })
          )
        }))
      );
      setError('');
    } catch (requestError) {
      setError(requestError.message);
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
      setError(requestError.message);
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
      setError(requestError.message);
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
    error,
    onCreateProject: handleCreateProject,
    onUpdateProject: handleUpdateProject,
    onDeleteProject: handleDeleteProject,
    onSelectProject: handleSelectProject,
    onCreateTask: handleCreateTask,
    onMoveTask: handleMoveTask,
    onUpdateTask: handleUpdateTask,
    onDeleteTask: handleDeleteTask
  };
}

export default useWorkspaceData;
