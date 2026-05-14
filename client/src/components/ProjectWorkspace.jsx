import { useMemo, useState } from 'react';

function ProjectWorkspace({
  projects,
  selectedProjectId,
  isLoading,
  error,
  onCreateProject,
  onSelectProject,
  onCreateTask,
  onMoveTask,
  isCreating,
  isCreatingTask,
  isUpdatingTask
}) {
  const [formValues, setFormValues] = useState({
    name: '',
    description: ''
  });
  const [taskForms, setTaskForms] = useState({});

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) || projects[0] || null,
    [projects, selectedProjectId]
  );

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

  const handleTaskChange = (columnId, field, value) => {
    setTaskForms((currentForms) => ({
      ...currentForms,
      [columnId]: {
        title: currentForms[columnId]?.title || '',
        description: currentForms[columnId]?.description || '',
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
      description: ''
    };

    await onCreateTask(selectedProject.id, {
      title: values.title,
      description: values.description,
      columnId
    });

    setTaskForms((currentForms) => ({
      ...currentForms,
      [columnId]: {
        title: '',
        description: ''
      }
    }));
  };

  const handleMoveTask = async (taskId, columnId) => {
    if (!selectedProject) {
      return;
    }

    await onMoveTask(selectedProject.id, taskId, columnId);
  };

  return (
    <section className="dashboard-stack">
      <article className="card hero-card">
        <p className="eyebrow">Workspace foundation</p>
        <h1>Start with one project and a clean board flow.</h1>
        <p>
          This dashboard is focused on the MVP path: create a project, seed
          default columns, and prepare the next step for task creation.
        </p>
      </article>

      <section className="dashboard-grid dashboard-grid--workspace">
        <article className="card">
          <div className="section-copy">
            <h2>Create a project</h2>
            <p>Each project starts with the kanban columns defined in the MVP.</p>
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
        </article>

        <article className="card">
          <div className="section-copy">
            <h2>Your projects</h2>
            <p>The newest project appears first and becomes the active preview.</p>
          </div>

          {isLoading ? <p className="status-copy">Loading projects...</p> : null}
          {error ? <p className="form-error">{error}</p> : null}
          {!isLoading && projects.length === 0 ? (
            <p className="status-copy">
              No projects yet. Create your first one to generate the default
              board structure.
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
                <h3>{project.name}</h3>
                <p>{project.description || 'No description yet.'}</p>
                <span>{project.columns.length} columns ready</span>
              </button>
            ))}
          </div>
        </article>
      </section>

      <article className="card">
        <div className="section-copy">
          <h2>Board preview</h2>
          <p>
            {selectedProject
              ? `Default workflow for ${selectedProject.name}.`
              : 'Project columns will appear here once a project is created.'}
          </p>
        </div>

        {selectedProject ? (
          <div className="board-preview">
            {selectedProject.columns.map((column, columnIndex) => (
              <section key={column.id} className="board-column">
                <header className="board-column-header">
                  <h3>{column.name}</h3>
                  <span>{column.tasks.length} tasks</span>
                </header>

                <div className="board-column-body board-column-body--stack">
                  {column.tasks.length === 0 ? (
                    <p>No tasks yet.</p>
                  ) : (
                    column.tasks.map((task) => (
                      <article key={task.id} className="task-card">
                        <div className="task-card-copy">
                          <h4>{task.title}</h4>
                          <p>{task.description || 'No description yet.'}</p>
                        </div>

                        <div className="task-actions">
                          <button
                            type="button"
                            className="ghost-button"
                            disabled={columnIndex === 0 || isUpdatingTask}
                            onClick={() =>
                              handleMoveTask(
                                task.id,
                                selectedProject.columns[columnIndex - 1].id
                              )
                            }
                          >
                            Move left
                          </button>
                          <button
                            type="button"
                            className="ghost-button"
                            disabled={
                              columnIndex === selectedProject.columns.length - 1 ||
                              isUpdatingTask
                            }
                            onClick={() =>
                              handleMoveTask(
                                task.id,
                                selectedProject.columns[columnIndex + 1].id
                              )
                            }
                          >
                            Move right
                          </button>
                        </div>
                      </article>
                    ))
                  )}
                </div>

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

                  <button
                    type="submit"
                    className="primary-button"
                    disabled={isCreatingTask}
                  >
                    {isCreatingTask ? 'Saving task...' : 'Add task'}
                  </button>
                </form>
              </section>
            ))}
          </div>
        ) : (
          <p className="status-copy">Create a project to preview its board columns.</p>
        )}
      </article>
    </section>
  );
}

export default ProjectWorkspace;
