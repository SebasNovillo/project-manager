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
  const [showProjectForm, setShowProjectForm] = useState(projects.length === 0);

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
    setShowProjectForm(false);
  };

  return (
    <section className="dashboard-stack">
      <section className="workspace-layout">
        <aside className="workspace-sidebar">
          <article className="card workspace-intel">
            <p className="eyebrow">Workspace pulse</p>
            <h1>Lead the work before you open the board.</h1>
            <p>
              The dashboard should show context, momentum, and project health at a
              glance. Execution belongs in the board view.
            </p>

            <div className="workspace-stats">
              <article>
                <span>{projects.length}</span>
                <small>Projects</small>
              </article>
              <article>
                <span>{totalTasks}</span>
                <small>Total tasks</small>
              </article>
              <article>
                <span>{completionRatio}%</span>
                <small>Completion</small>
              </article>
            </div>
          </article>
        </aside>

        <section className="workspace-main">
          <article className="card board-hero">
            <div className="board-hero-copy">
              <p className="eyebrow">Active workspace</p>
              <h2>{selectedProject ? selectedProject.name : 'Choose a project'}</h2>
              <p>
                {selectedProject
                  ? selectedProject.description ||
                    'A clear project summary with room to move into execution.'
                  : 'Create or select a project to unlock the board and execution flow.'}
              </p>
            </div>

            <div className="board-hero-metrics">
              <article>
                <span>{activeTasks}</span>
                <small>In flow</small>
              </article>
              <article>
                <span>{selectedProjectSummary.completedCards}</span>
                <small>Done</small>
              </article>
            </div>
          </article>

          <section className="workspace-panels">
            <article className="card project-directory">
              <div className="section-copy">
                <div className="section-heading-row">
                  <div>
                    <h2>Your projects</h2>
                    <p>Switch context here. Open the board only when you are ready to execute.</p>
                  </div>
                  <button
                    type="button"
                    className="ghost-button ghost-button--panel"
                    onClick={() => setShowProjectForm((currentValue) => !currentValue)}
                  >
                    {showProjectForm ? 'Close form' : 'New project'}
                  </button>
                </div>
              </div>

              {isLoading ? <p className="status-copy">Loading projects...</p> : null}
              {error ? <p className="form-error">{error}</p> : null}
              {!isLoading && projects.length === 0 ? (
                <p className="status-copy">
                  No projects yet. Create your first one to generate the default structure.
                </p>
              ) : null}

              <div className="project-list">
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

              {showProjectForm ? (
                <div className="inline-panel">
                  <div className="section-copy">
                    <h3>Create a project</h3>
                    <p>Launch a fresh workspace with the default Kanban structure already prepared.</p>
                  </div>

                  <form className="form-grid" onSubmit={handleSubmit}>
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

                    <label>
                      <span>Description</span>
                      <textarea
                        name="description"
                        placeholder="Short summary of the project goals"
                        value={formValues.description}
                        onChange={handleChange}
                        rows="4"
                      />
                    </label>

                    <button type="submit" className="primary-button" disabled={isCreating}>
                      {isCreating ? 'Creating project...' : 'Create project'}
                    </button>
                  </form>
                </div>
              ) : null}
            </article>

            <article className="card board-summary">
              <div className="section-copy">
                <h2>Execution readiness</h2>
                <p>
                  {selectedProject
                    ? `The ${selectedProject.name} workspace is ready to be opened in board view.`
                    : 'Select a project to see its execution summary.'}
                </p>
              </div>

              {selectedProject ? (
                <>
                  <div className="summary-metric-grid">
                    <article className="summary-metric-card">
                      <strong>{selectedProjectSummary.lanes}</strong>
                      <span>Workflow lanes</span>
                    </article>
                    <article className="summary-metric-card">
                      <strong>{selectedProjectSummary.totalCards}</strong>
                      <span>Total cards</span>
                    </article>
                    <article className="summary-metric-card">
                      <strong>{selectedProjectSummary.completedCards}</strong>
                      <span>Completed</span>
                    </article>
                  </div>

                  <div className="summary-action-row">
                    <Link to="/board" className="primary-button">
                      Open board
                    </Link>
                  </div>
                </>
              ) : (
                <p className="status-copy">Create a project to unlock the board view.</p>
              )}
            </article>
          </section>

          <section className="dashboard-lower-grid">
            <article className="card dashboard-info-card">
              <p className="eyebrow">Project health</p>
              <h3>{selectedProject ? 'Focus on signals before execution' : 'No active project yet'}</h3>
              <p>
                {selectedProject
                  ? 'Use this area to confirm scope, workload, and completion before diving into day-to-day task movement.'
                  : 'Create a project first. Then use the board view to manage backlog, tasks, and progress.'}
              </p>
            </article>

            <article className="card dashboard-info-card dashboard-info-card--accent">
              <p className="eyebrow">Board view</p>
              <h3>Kanban now lives in its own space</h3>
              <p>
                The board is intentionally separated so this dashboard stays clean and executive instead of turning into an operational wall.
              </p>
            </article>
          </section>
        </section>
      </section>
    </section>
  );
}

export default DashboardWorkspace;
