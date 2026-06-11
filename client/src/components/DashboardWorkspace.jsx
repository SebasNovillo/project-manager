import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ActionDialog from './ActionDialog';

function getStoryPoints(task) {
  return Number(task?.storyPoints) || 0;
}

function DashboardWorkspace({
  projects,
  selectedProject,
  isLoading,
  error,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
  onSelectProject,
  isCreating,
  isUpdatingProject,
  isDeletingProject
}) {
  const [formValues, setFormValues] = useState({
    name: '',
    description: ''
  });
  const [editingProjectId, setEditingProjectId] = useState('');
  const [editingProjectValues, setEditingProjectValues] = useState({
    name: '',
    description: ''
  });
  const [isDeleteProjectDialogOpen, setIsDeleteProjectDialogOpen] = useState(false);

  const selectedProjectSummary = useMemo(() => {
    if (!selectedProject) {
      return {
        totalCards: 0,
        totalPoints: 0
      };
    }

    return {
      totalCards: selectedProject.columns.reduce(
        (count, column) => count + column.tasks.length,
        0
      ),
      totalPoints: selectedProject.columns.reduce(
        (points, column) =>
          points +
          column.tasks.reduce(
            (columnPoints, task) => columnPoints + getStoryPoints(task),
            0
          ),
        0
      )
    };
  }, [selectedProject]);

  const activeSprint = useMemo(
    () => selectedProject?.sprints?.find((sprint) => sprint.status === 'active') || null,
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
  const backlogTaskCount = useMemo(() => {
    if (!selectedProject) {
      return 0;
    }

    return selectedProject.columns.reduce(
      (count, column) => count + column.tasks.filter((task) => !task.sprintId).length,
      0
    );
  }, [selectedProject]);
  const sprintPointCount = useMemo(() => {
    if (!selectedProject || !activeSprint) {
      return 0;
    }

    return selectedProject.columns.reduce(
      (points, column) =>
        points +
        column.tasks
          .filter((task) => task.sprintId === activeSprint.id)
          .reduce((taskPoints, task) => taskPoints + getStoryPoints(task), 0),
      0
    );
  }, [activeSprint, selectedProject]);
  const backlogPointCount = useMemo(() => {
    if (!selectedProject) {
      return 0;
    }

    return selectedProject.columns.reduce(
      (points, column) =>
        points +
        column.tasks
          .filter((task) => !task.sprintId)
          .reduce((taskPoints, task) => taskPoints + getStoryPoints(task), 0),
      0
    );
  }, [selectedProject]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormValues((currentValues) => ({
      ...currentValues,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onCreateProject(formValues);
    setFormValues({
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
    cancelEditingProject();
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
    cancelEditingProject();
    setIsDeleteProjectDialogOpen(false);
  };

  return (
    <section className="dashboard-stack">
      <section className="dashboard-main-grid">
        <article className="card board-summary board-summary--compact dashboard-overview">
          <div className="section-copy">
            <p className="eyebrow">Workspace overview</p>
            <h1>{selectedProject ? selectedProject.name : 'No project selected'}</h1>
            <p>
              {selectedProject
                ? activeSprint
                  ? `Active sprint: ${activeSprint.name}. Keep planning in the backlog and execute committed work inside the sprint board.`
                  : 'This project has no active sprint yet. Build up the backlog first, then start a sprint when the scope is ready.'
                : 'Choose a project to review its backlog, sprint status, and delivery progress.'}
            </p>
          </div>

          <div className="summary-metric-grid summary-metric-grid--compact dashboard-overview__metrics">
            <article className="summary-metric-card">
              <strong>{activeSprint ? sprintTaskCount : 0}</strong>
              <span>Sprint tasks</span>
            </article>
            <article className="summary-metric-card">
              <strong>{activeSprint ? sprintPointCount : 0}</strong>
              <span>Sprint points</span>
            </article>
            <article className="summary-metric-card">
              <strong>{backlogTaskCount}</strong>
              <span>Backlog tasks</span>
            </article>
            <article className="summary-metric-card">
              <strong>{backlogPointCount}</strong>
              <span>Backlog points</span>
            </article>
            <article className="summary-metric-card">
              <strong>{selectedProjectSummary.totalCards}</strong>
              <span>Total tasks</span>
            </article>
            <article className="summary-metric-card">
              <strong>{selectedProjectSummary.totalPoints}</strong>
              <span>Total points</span>
            </article>
          </div>

          {selectedProject ? (
            <div className="summary-action-row summary-action-row--split dashboard-overview__actions">
              <Link to={`/projects/${selectedProject.id}`} className="primary-button">
                Open project
              </Link>
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
          ) : null}

          {editingProjectId === selectedProject?.id ? (
            <form
              className="form-grid project-edit-form"
              onSubmit={handleUpdateProjectSubmit}
            >
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
                <button
                  type="submit"
                  className="primary-button"
                  disabled={isUpdatingProject}
                >
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

        <article className="card project-directory project-directory--wide">
          <div className="section-copy">
            <p className="eyebrow">Projects</p>
            <h2>Your workspaces</h2>
            <p>
              Browse the projects in this account and jump into the one you want to plan or execute.
            </p>
          </div>

          {isLoading ? <p className="status-copy">Loading projects...</p> : null}
          {error ? <p className="form-error">{error}</p> : null}
          {!isLoading && projects.length === 0 ? (
            <p className="status-copy">
              No projects yet. Your first project will generate the default five-stage board.
            </p>
          ) : null}

          <div className="project-list project-list--dashboard">
            {projects.map((project) => (
              <article
                key={project.id}
                className={`project-list-item ${
                  project.id === selectedProject?.id ? 'project-list-item--active' : ''
                }`}
              >
                <Link
                  to={`/projects/${project.id}`}
                  className="project-select-button"
                  onClick={() => onSelectProject(project.id)}
                >
                  <div className="project-list-item-top">
                    <h3>{project.name}</h3>
                    <span>{project.columns.length} lanes</span>
                  </div>
                  <p>{project.description || 'No description yet.'}</p>
                </Link>
              </article>
            ))}
          </div>
        </article>

        <article className="card project-creation-panel">
          <div className="section-copy">
            <p className="eyebrow">New project</p>
            <h2>Create a new workspace</h2>
            <p>
              Define the name and context. The default Kanban structure will be
              created automatically.
            </p>
          </div>

          <form className="form-grid project-creation-form" onSubmit={handleSubmit}>
            <label>
              <span>Project name</span>
              <input
                type="text"
                name="name"
                placeholder="Website redesign"
                value={formValues.name}
                onChange={handleChange}
              />
            </label>

            <label className="project-creation-form__description">
              <span>Description</span>
              <textarea
                name="description"
                placeholder="Summarize the goals, scope, or outcome of this workspace"
                value={formValues.description}
                onChange={handleChange}
                rows="4"
              />
            </label>

            <button type="submit" className="primary-button" disabled={isCreating}>
              {isCreating ? 'Creating project...' : 'Create project'}
            </button>
          </form>
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
    </section>
  );
}

export default DashboardWorkspace;
