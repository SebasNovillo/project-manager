import BoardWorkspace from '../components/BoardWorkspace';
import useWorkspaceData from '../hooks/useWorkspaceData';
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

function BoardPage() {
  const workspace = useWorkspaceData();
  const { projectId, sprintId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (projectId && workspace.selectedProjectId !== projectId) {
      workspace.onSelectProject(projectId);
    }
  }, [projectId, workspace]);

  useEffect(() => {
    if (!workspace.selectedProject) {
      return;
    }

    const activeSprint = workspace.selectedProject.sprints?.find(
      (sprint) => sprint.status === 'active'
    );

    if (!sprintId) {
      if (activeSprint) {
        navigate(`/projects/${workspace.selectedProject.id}/sprints/${activeSprint.id}/board`, {
          replace: true
        });
      } else {
        navigate(`/projects/${workspace.selectedProject.id}`, { replace: true });
      }
      return;
    }

    const sprintExists = workspace.selectedProject.sprints?.some(
      (sprint) => sprint.id === sprintId
    );

    if (!sprintExists) {
      navigate(`/projects/${workspace.selectedProject.id}`, { replace: true });
    }
  }, [navigate, sprintId, workspace.selectedProject]);

  return <BoardWorkspace {...workspace} sprintId={sprintId || ''} />;
}

export default BoardPage;
