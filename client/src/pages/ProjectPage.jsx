import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ProjectWorkspace from '../components/ProjectWorkspace';
import useWorkspaceData from '../hooks/useWorkspaceData';

function ProjectPage() {
  const workspace = useWorkspaceData();
  const { projectId } = useParams();

  useEffect(() => {
    if (projectId && workspace.selectedProjectId !== projectId) {
      workspace.onSelectProject(projectId);
    }
  }, [projectId, workspace]);

  return <ProjectWorkspace {...workspace} />;
}

export default ProjectPage;
