import { useEffect, useState } from 'react';
import ProjectWorkspace from '../components/ProjectWorkspace';
import useAuth from '../hooks/useAuth';
import { createProject, getProjects } from '../services/projectService';
import {
  createTask,
  deleteTask as deleteTaskRequest,
  updateTask
} from '../services/taskService';

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

function DashboardPage() {
  const { token } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isUpdatingTask, setIsUpdatingTask] = useState(false);
  const [isDeletingTask, setIsDeletingTask] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadProjects() {
      try {
        setIsLoading(true);
        const items = await getProjects(token);

        if (isMounted) {
          setProjects(items);
          setSelectedProjectId((currentId) => currentId || items[0]?.id || '');
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

  return (
    <ProjectWorkspace
      projects={projects}
      selectedProjectId={selectedProjectId}
      isLoading={isLoading}
      error={error}
      onCreateProject={handleCreateProject}
      onSelectProject={handleSelectProject}
      onCreateTask={handleCreateTask}
      onMoveTask={handleMoveTask}
      onUpdateTask={handleUpdateTask}
      onDeleteTask={handleDeleteTask}
      isCreating={isCreating}
      isCreatingTask={isCreatingTask}
      isUpdatingTask={isUpdatingTask}
      isDeletingTask={isDeletingTask}
    />
  );
}

export default DashboardPage;
