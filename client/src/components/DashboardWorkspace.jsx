import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

function DashboardWorkspace({
  projects,
  selectedProject,
  isLoading,
  error,
  onCreateProject,
  onSelectProject,
  isCreating
}) {
  const [formValues, setFormValues] = useState({
    name: '',
    description: ''
  });

  const totalTasks = useMemo(
    () =>
      projects.reduce(
        (count, project) =>
          count +
          project.columns.reduce((columnCount, column) => columnCount + column.tasks.length, 0),
        0
      ),
    [projects]
  );

  const totalCompletedTasks = useMemo(
    () =>
      projects.reduce(
        (count, project) =>
          count +
          (project.columns.find((column) => column.name === 'Done')?.tasks.length || 0),
        0
      ),
    [projects]
  );

  const activeTasks = useMemo(
    () =>
      selectedProject
        ? selectedProject.columns
            .filter((column) => column.name !== 'Done')
            .reduce((count, column) => count + column.tasks.length, 0)
        : 0,
    [selectedProject]
  );

  const completionRatio = useMemo(() => {
    if (!totalTasks) {
      return 0;
    }

    return Math.round((totalCompletedTasks / totalTasks) * 100);
  }, [totalCompletedTasks, totalTasks]);

  const selectedProjectSummary = useMemo(() => {
    if (!selectedProject) {
      return {
        lanes: 0,
        totalCards: 0,
        completedCards: 0
      };
    }

    return {
      lanes: selectedProject.columns.length,
      totalCards: selectedProject.columns.reduce(
        (count, column) => count + column.tasks.length,
        0
      ),
      completedCards:
        selectedProject.columns.find((column) => column.name === 'Done')?.tasks.length || 0
    };
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

  return (
    <section className="dashboard-stack">
      <section className="dashboard-main-grid">
        <article className="card project-directory project-directory--wide">
          <div className="section-copy">
            <h1>Projects</h1>
            <p>
              Keep this area for organizing workspaces. Open the board only when you
              want to work on tasks.
            </p>
          </div>

          {isLoading ? <p className="status-copy">Loading projects...</p> : null}
          {error ? <p className="form-error">{error}</p> : null}
          {!isLoading && projects.length === 0 ? (
            <p className="status-copy">
              No projects yet. Create your first one to generate the default structure.
            </p>
          ) : null}

          <div className="project-list project-list--dashboard">
            {projects.map((project) => (
              <button
                key={project.id}
                type="button"
                className={`project-list-item ${
                  project.id === selectedProject?.id ? 'project-list-item--active' : ''
                }`}
                onClick={() => onSelectProject(project.id)}
              >
                <div className="project-list-item-top">
                  <h3>{project.name}</h3>
                  <span>{project.columns.length} lanes</span>
                </div>
                <p>{project.description || 'No description yet.'}</p>
              </button>
            ))}
          </div>
        </article>

        <article className="card board-summary board-summary--compact">
          <div className="section-copy">
            <p className="eyebrow">Current project</p>
            <h2>{selectedProject ? selectedProject.name : 'No project selected'}</h2>
            <p>
              {selectedProject
                ? selectedProject.description || 'Open the board to manage tasks and delivery.'
                : 'Create a project to start working with the board.'}
            </p>
          </div>

          <div className="summary-metric-grid summary-metric-grid--compact">
            <article className="summary-metric-card">
              <strong>{projects.length}</strong>
              <span>Projects</span>
            </article>
            <article className="summary-metric-card">
              <strong>{totalTasks}</strong>
              <span>Tasks</span>
            </article>
            <article className="summary-metric-card">
              <strong>{completionRatio}%</strong>
              <span>Completion</span>
            </article>
            <article className="summary-metric-card">
              <strong>{activeTasks}</strong>
              <span>In flow</span>
            </article>
            <article className="summary-metric-card">
              <strong>{selectedProjectSummary.lanes}</strong>
              <span>Lanes</span>
            </article>
            <article className="summary-metric-card">
              <strong>{selectedProjectSummary.completedCards}</strong>
              <span>Done</span>
            </article>
          </div>

          {selectedProject ? (
            <div className="summary-action-row">
              <Link to="/board" className="primary-button">
                Open board
              </Link>
            </div>
          ) : null}
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
    </section>
  );
}

export default DashboardWorkspace;
