import CommunityDashboard from '../../pages-components/CommunityDashboard';
import ProtectedRoute from '../../components/ProtectedRoute';
export default function SettingsPage() { return <ProtectedRoute><CommunityDashboard /></ProtectedRoute>; }
