import MyArticles from '../../../../pages-components/MyArticles';
import ProtectedRoute from '../../../../components/ProtectedRoute';
export default function MyArticlesPage() { return <ProtectedRoute><MyArticles /></ProtectedRoute>; }
