import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ActionDialog from './ActionDialog';

const inputClassName =
  'mt-2 w-full rounded-2xl border border-stroke-1 bg-white px-4 py-3 text-sm text-ink-950 outline-none transition placeholder:text-slate-400 focus:border-brand-300 focus:ring-4 focus:ring-brand-100';
const primaryButtonClassName =
  'inline-flex min-h-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#4f46e5_0%,#3525cd_100%)] px-4 py-2.5 text-sm font-semibold text-white shadow-soft-card transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60';
const secondaryButtonClassName =
  'inline-flex min-h-11 items-center justify-center rounded-2xl border border-stroke-1 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-60';
const dangerButtonClassName =
  'inline-flex min-h-11 items-center justify-center rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60';
const panelClassName =
  'rounded-[28px] border border-stroke-1 bg-white/92 p-5 shadow-soft-card backdrop-blur sm:p-6';

function getStoryPoints(task) {
  return Number(task?.storyPoints) || 0;
}

function formatPointAverage(value) {
  if (!value) {
    return '0';
  }

  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function MetricCard({ label, value, accent = 'default' }) {
  const accentClassName =
    accent === 'brand'
      ? 'bg-brand-50 text-brand-700'
      : accent === 'dark'
        ? 'bg-ink-950 text-white'
        : 'bg-surface-100 text-slate-600';

  return (
    <article className="rounded-[24px] border border-stroke-1 bg-white/90 p-4 shadow-soft-card">
      <div className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${accentClassName}`}>
        {label}
      </div>
      <strong className="mt-4 block text-3xl font-semibold tracking-[-0.05em] text-ink-950">
        {value}
      </strong>
    </article>
  );
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
  const projectList = projects || [];

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

  const velocitySummary = useMemo(() => {
    if (!selectedProject) {
      return {
        averageVelocity: 0
      };
    }

    const completedSprints = (selectedProject.sprints || []).filter(
      (sprint) => sprint.status !== 'active'
    );

    if (!completedSprints.length) {
      return {
        averageVelocity: 0
      };
    }

    const doneColumn = selectedProject.columns.find(
      (column) => column.name.toLowerCase() === 'done'
    );
    const doneTasks = doneColumn?.tasks || [];
    const totalVelocity = completedSprints.reduce(
      (points, sprint) =>
        points +
        doneTasks
          .filter((task) => task.sprintId === sprint.id)
          .reduce((taskPoints, task) => taskPoints + getStoryPoints(task), 0),
      0
    );

    return {
      averageVelocity: totalVelocity / completedSprints.length
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

  const heroDescription = selectedProject
    ? activeSprint
      ? `Active sprint: ${activeSprint.name}. Keep backlog decisions lightweight and move committed work into execution with a clean rhythm.`
      : 'This workspace does not have an active sprint yet. Shape the backlog first, then open a sprint when the scope feels stable.'
    : 'Choose a project to review its sprint health, backlog load, and team delivery signal.';

  return (
    <section className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.9fr)]">
        <article
          className={`${panelClassName} overflow-hidden bg-[linear-gradient(135deg,rgba(239,244,255,0.96),rgba(255,255,255,0.98))]`}
        >
          <div className="grid gap-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-3xl space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-600">
                  Workspace overview
                </p>
                <div className="space-y-2">
                  <h1 className="text-4xl font-semibold tracking-[-0.06em] text-ink-950 sm:text-5xl">
                    {selectedProject ? selectedProject.name : 'No project selected'}
                  </h1>
                  <p className="max-w-2xl text-base leading-7 text-slate-600">
                    {heroDescription}
                  </p>
                </div>
              </div>

              <div className="rounded-[24px] border border-brand-100 bg-white/88 px-4 py-3 shadow-soft-card">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Current focus
                </p>
                <strong className="mt-2 block text-base font-semibold text-ink-950">
                  {activeSprint ? activeSprint.name : 'Backlog shaping'}
                </strong>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {activeSprint ? `${sprintTaskCount} tasks committed` : 'No sprint commitment yet'}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
              <MetricCard label="Sprint tasks" value={activeSprint ? sprintTaskCount : 0} accent="brand" />
              <MetricCard label="Sprint points" value={activeSprint ? sprintPointCount : 0} />
              <MetricCard label="Backlog tasks" value={backlogTaskCount} />
              <MetricCard label="Backlog points" value={backlogPointCount} accent="dark" />
              <MetricCard label="Total tasks" value={selectedProjectSummary.totalCards} />
              <MetricCard label="Total points" value={selectedProjectSummary.totalPoints} />
              <MetricCard
                label="Average velocity"
                value={formatPointAverage(velocitySummary.averageVelocity)}
                accent="brand"
              />
            </div>

            {selectedProject ? (
              <div className="flex flex-wrap gap-3">
                <Link to={`/projects/${selectedProject.id}`} className={primaryButtonClassName}>
                  Open project
                </Link>
                <button
                  type="button"
                  className={secondaryButtonClassName}
                  onClick={startEditingProject}
                  disabled={isUpdatingProject || isDeletingProject}
                >
                  Edit project
                </button>
                <button
                  type="button"
                  className={dangerButtonClassName}
                  onClick={openDeleteProjectDialog}
                  disabled={isUpdatingProject || isDeletingProject}
                >
                  {isDeletingProject ? 'Deleting...' : 'Delete project'}
                </button>
              </div>
            ) : null}

            {editingProjectId === selectedProject?.id ? (
              <form className="grid gap-4 rounded-[24px] border border-stroke-1 bg-white/88 p-4" onSubmit={handleUpdateProjectSubmit}>
                <div className="grid gap-4 lg:grid-cols-2">
                  <label className="grid gap-1.5 text-sm font-medium text-slate-600">
                    <span>Project name</span>
                    <input
                      type="text"
                      name="name"
                      value={editingProjectValues.name}
                      onChange={handleEditingProjectChange}
                      className={inputClassName}
                    />
                  </label>

                  <label className="grid gap-1.5 text-sm font-medium text-slate-600 lg:col-span-2">
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
                  <button
                    type="submit"
                    className={primaryButtonClassName}
                    disabled={isUpdatingProject}
                  >
                    {isUpdatingProject ? 'Saving...' : 'Save project'}
                  </button>
                  <button
                    type="button"
                    className={secondaryButtonClassName}
                    onClick={cancelEditingProject}
                    disabled={isUpdatingProject}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : null}
          </div>
        </article>

        <article className={`${panelClassName} flex h-full flex-col`}>
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
              Projects
            </p>
            <h2 className="text-2xl font-semibold tracking-[-0.04em] text-ink-950">
              Your workspaces
            </h2>
            <p className="text-sm leading-6 text-slate-500">
              Browse the spaces in this account and jump into the one you want to plan or execute next.
            </p>
          </div>

          <div className="mt-5 space-y-3">
            {isLoading ? (
              <p className="rounded-2xl border border-stroke-1 bg-surface-100 px-4 py-3 text-sm font-medium text-slate-500">
                Loading projects...
              </p>
            ) : null}

            {error ? (
              <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                {error}
              </p>
            ) : null}

            {!isLoading && projectList.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-stroke-2 bg-surface-100 px-4 py-5 text-sm leading-6 text-slate-500">
                No projects yet. Your first project will generate the default five-stage board.
              </p>
            ) : null}

            <div className="grid gap-3">
              {projectList.map((project) => {
                const isActive = project.id === selectedProject?.id;

                return (
                  <article
                    key={project.id}
                    className={`rounded-[24px] border p-1 transition ${
                      isActive
                        ? 'border-brand-200 bg-brand-50/60 shadow-soft-card'
                        : 'border-stroke-1 bg-white hover:border-brand-100 hover:bg-surface-100'
                    }`}
                  >
                    <Link
                      to={`/projects/${project.id}`}
                      className="block rounded-[20px] px-4 py-4"
                      onClick={() => onSelectProject(project.id)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-base font-semibold tracking-[-0.02em] text-ink-950">
                            {project.name}
                          </h3>
                          <p className="mt-2 text-sm leading-6 text-slate-500">
                            {project.description || 'No description yet.'}
                          </p>
                        </div>
                        <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                          {project.columns.length} lanes
                        </span>
                      </div>
                    </Link>
                  </article>
                );
              })}
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.75fr)]">
        <article className={`${panelClassName} bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(239,244,255,0.78))]`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                New project
              </p>
              <h2 className="text-2xl font-semibold tracking-[-0.04em] text-ink-950">
                Create a new workspace
              </h2>
              <p className="max-w-xl text-sm leading-6 text-slate-500">
                Define the project name and context. We will create the default Kanban structure now, and later we can tailor each flow to the methodology you want.
              </p>
            </div>

            <div className="rounded-[22px] border border-stroke-1 bg-white px-4 py-3 shadow-soft-card">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-600">
                Design direction
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Stitch palette, calmer layout, more editorial spacing.
              </p>
            </div>
          </div>

          <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <label className="grid gap-1.5 text-sm font-medium text-slate-600">
                <span>Project name</span>
                <input
                  type="text"
                  name="name"
                  placeholder="Website redesign"
                  value={formValues.name}
                  onChange={handleChange}
                  className={inputClassName}
                />
              </label>

              <label className="grid gap-1.5 text-sm font-medium text-slate-600">
                <span>Description</span>
                <textarea
                  name="description"
                  placeholder="Summarize the goals, scope, or outcome of this workspace"
                  value={formValues.description}
                  onChange={handleChange}
                  rows="4"
                  className={`${inputClassName} min-h-32 resize-y`}
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-3">
              <button type="submit" className={primaryButtonClassName} disabled={isCreating}>
                {isCreating ? 'Creating project...' : 'Create project'}
              </button>
              <p className="self-center text-sm leading-6 text-slate-500">
                We can evolve this flow later into Agile, Kanban, or hybrid presets.
              </p>
            </div>
          </form>
        </article>

        <article className={`${panelClassName} bg-ink-950 text-white`}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-200">
            Delivery pulse
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
            The dashboard is now becoming the command surface.
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            We are not copying Stitch literally. We are borrowing its color discipline, typography, and sense of calm while giving the app more breathing room and a stronger hierarchy.
          </p>

          <div className="mt-6 grid gap-3">
            <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-200">
                Selected project
              </p>
              <strong className="mt-2 block text-lg font-semibold">
                {selectedProject?.name || 'Choose one to continue'}
              </strong>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-200">
                Velocity signal
              </p>
              <strong className="mt-2 block text-lg font-semibold">
                {formatPointAverage(velocitySummary.averageVelocity)} pts avg
              </strong>
            </div>
          </div>
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
