import DashboardWorkspace from '../components/DashboardWorkspace';
import useWorkspaceData from '../hooks/useWorkspaceData';

function DashboardPage() {
  const workspace = useWorkspaceData();

  return <DashboardWorkspace {...workspace} />;
}

export default DashboardPage;
