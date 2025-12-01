import AdminStore from '../../../pages-components/AdminStore';
import ProtectedRoute from '../../../components/ProtectedRoute';
export default function AdminStorePage() { return <ProtectedRoute><AdminStore /></ProtectedRoute>; }
