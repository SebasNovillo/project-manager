import BoardWorkspace from '../components/BoardWorkspace';
import useWorkspaceData from '../hooks/useWorkspaceData';

function BoardPage() {
  const workspace = useWorkspaceData();

  return <BoardWorkspace {...workspace} />;
}

export default BoardPage;
