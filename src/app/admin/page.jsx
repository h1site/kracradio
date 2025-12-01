import AdminPanel from '../../pages-components/AdminPanel';
import ProtectedRoute from '../../components/ProtectedRoute';
export default function AdminPage() { return <ProtectedRoute><AdminPanel /></ProtectedRoute>; }
