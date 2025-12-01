import UserPlaylists from '../../pages-components/UserPlaylists';
import ProtectedRoute from '../../components/ProtectedRoute';
export default function PlaylistsPage() { return <ProtectedRoute><UserPlaylists /></ProtectedRoute>; }
