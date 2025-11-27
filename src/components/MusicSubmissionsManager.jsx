// src/components/MusicSubmissionsManager.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserMusicSubmissions, updateMusicSubmission, deleteMusicSubmission } from '../lib/supabase';

export default function MusicSubmissionsManager() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [message, setMessage] = useState(null);

  // Load submissions
  useEffect(() => {
    if (user) {
      loadSubmissions();
    }
  }, [user]);

  const loadSubmissions = async () => {
    try {
      console.log('Loading music submissions for user:', user?.id);
      const data = await getUserMusicSubmissions(user.id);
      console.log('Music submissions loaded:', data);
      setSubmissions(data);
    } catch (error) {
      console.error('Error loading submissions:', error);
      setMessage({ type: 'error', text: 'Erreur lors du chargement' });
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (submission) => {
    setEditingId(submission.id);
    setEditForm({
      submission_title: submission.submission_title,
      description: submission.description || '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async (id) => {
    try {
      await updateMusicSubmission(id, {
        submission_title: editForm.submission_title,
        description: editForm.description,
      });

      setMessage({ type: 'success', text: 'Mise à jour réussie' });
      setEditingId(null);
      await loadSubmissions();

      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error updating submission:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la mise à jour' });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette soumission ?')) return;

    try {
      await deleteMusicSubmission(id);
      setMessage({ type: 'success', text: 'Soumission supprimée' });
      await loadSubmissions();

      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error deleting submission:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la suppression' });
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200',
      approved: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
      rejected: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
    };

    const labels = {
      pending: 'En attente',
      approved: 'Approuvée',
      rejected: 'Refusée'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mb-4">
          <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400 mb-2 font-medium">Aucune soumission musicale</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
            Soumettez votre musique pour qu'elle apparaisse ici
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success'
            ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
            : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {submissions.map((submission) => {
        const isEditing = editingId === submission.id;
        const canEdit = submission.status === 'pending';

        return (
          <div
            key={submission.id}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.submission_title}
                    onChange={(e) => setEditForm({ ...editForm, submission_title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-2"
                  />
                ) : (
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {submission.submission_title}
                  </h3>
                )}

                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <span>{submission.artist_name}</span>
                  <span>•</span>
                  <span>{submission.file_count} fichier(s)</span>
                  <span>•</span>
                  {getStatusBadge(submission.status)}
                </div>
              </div>

              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => saveEdit(submission.id)}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                    >
                      Enregistrer
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
                    >
                      Annuler
                    </button>
                  </>
                ) : (
                  <>
                    {canEdit && (
                      <button
                        onClick={() => startEdit(submission)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                      >
                        Modifier
                      </button>
                    )}
                    {canEdit && (
                      <button
                        onClick={() => handleDelete(submission.id)}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                      >
                        Supprimer
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {isEditing ? (
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                placeholder="Description (optionnel)"
              />
            ) : (
              submission.description && (
                <p className="text-gray-700 dark:text-gray-300 text-sm mb-4">
                  {submission.description}
                </p>
              )
            )}

            {submission.genres && (
              <div className="mt-3 flex flex-wrap gap-2">
                {submission.genres.split(', ').map((genre, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}

            {submission.admin_notes && (
              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm font-medium text-yellow-900 dark:text-yellow-200 mb-1">
                  Note de l'administrateur:
                </p>
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  {submission.admin_notes}
                </p>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
              Soumis le {new Date(submission.created_at).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
