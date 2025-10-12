// Types pour le système de communauté Kracradio

// ============================================================================
// PROFILES
// ============================================================================

export interface Profile {
  id: string;
  user_id: string;
  username: string | null;
  email: string;

  // Champs communautaires
  is_public: boolean;
  is_verified: boolean;
  bio: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  location: string | null;
  genres: string[] | null;
  profile_views: number;
  last_active: string;

  created_at: string;
  updated_at: string;
}

// ============================================================================
// MUSIC LINKS
// ============================================================================

export type MusicPlatform =
  | 'spotify'
  | 'bandcamp'
  | 'apple_music'
  | 'soundcloud'
  | 'youtube'
  | 'other';

export interface MusicLink {
  id: string;
  user_id: string;
  platform: MusicPlatform;
  url: string;
  embed_html: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// FOLLOWS & CONNECTIONS
// ============================================================================

export interface Follow {
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface Connection {
  user1_id: string;
  user2_id: string;
  connected_at: string;
}

export type FollowStatus =
  | null // Pas de relation
  | 'following' // Je le/la suis
  | 'follower' // Il/elle me suit
  | 'connected'; // Follow mutuel

export interface FollowStats {
  followers_count: number;
  following_count: number;
  connections_count: number;
}

// ============================================================================
// POSTS
// ============================================================================

export type PostVisibility = 'public' | 'connections' | 'private';
export type MediaType = 'image' | 'video' | 'audio';

export interface Post {
  id: string;
  user_id: string;
  content: string;
  media_url: string | null;
  media_type: MediaType | null;
  link_url: string | null;
  link_preview: LinkPreview | null;

  visibility: PostVisibility;
  is_pinned: boolean;
  is_announcement: boolean;

  reactions_count: number;
  comments_count: number;
  shares_count: number;

  created_at: string;
  updated_at: string;
}

export interface LinkPreview {
  title: string;
  description: string;
  image: string;
  url: string;
}

// Post enrichi avec données de l'auteur
export interface PostWithAuthor extends Post {
  author: {
    id: string;
    username: string;
    avatar_url: string | null;
    is_verified: boolean;
  };
  user_reaction: ReactionType | null;
  is_following: boolean;
}

// ============================================================================
// REACTIONS
// ============================================================================

export type ReactionType = 'like' | 'love' | 'fire' | 'clap' | 'thinking';

export interface PostReaction {
  id: string;
  post_id: string;
  user_id: string;
  reaction_type: ReactionType;
  created_at: string;
}

export const REACTION_EMOJIS: Record<ReactionType, string> = {
  like: '👍',
  love: '❤️',
  fire: '🔥',
  clap: '👏',
  thinking: '🤔'
};

// ============================================================================
// COMMENTS
// ============================================================================

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  parent_comment_id: string | null;
  content: string;

  replies_count: number;
  reactions_count: number;

  created_at: string;
  updated_at: string;
}

// Commentaire enrichi avec auteur
export interface CommentWithAuthor extends PostComment {
  author: {
    id: string;
    username: string;
    avatar_url: string | null;
    is_verified: boolean;
  };
  replies?: CommentWithAuthor[];
}

// ============================================================================
// MENTIONS
// ============================================================================

export interface PostMention {
  post_id: string;
  mentioned_user_id: string;
  created_at: string;
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================

export type NotificationType =
  | 'follow'
  | 'follow_back'
  | 'connection'
  | 'mention'
  | 'comment'
  | 'reply'
  | 'reaction'
  | 'post_share';

export interface Notification {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: NotificationType;

  post_id: string | null;
  comment_id: string | null;

  title: string;
  body: string | null;
  action_url: string | null;

  read: boolean;
  created_at: string;
}

// Notification enrichie avec acteur
export interface NotificationWithActor extends Notification {
  actor: {
    id: string;
    username: string;
    avatar_url: string | null;
    is_verified: boolean;
  } | null;
}

// ============================================================================
// BLOCAGE & MUTE
// ============================================================================

export interface BlockedUser {
  blocker_id: string;
  blocked_id: string;
  reason: string | null;
  created_at: string;
}

export interface MutedUser {
  muter_id: string;
  muted_id: string;
  created_at: string;
}

// ============================================================================
// REPORTS
// ============================================================================

export type ReportReason =
  | 'spam'
  | 'harassment'
  | 'hate_speech'
  | 'violence'
  | 'misinformation'
  | 'copyright'
  | 'inappropriate_content'
  | 'other';

export type ReportStatus = 'pending' | 'reviewing' | 'resolved' | 'dismissed';

export interface Report {
  id: string;
  reporter_id: string;
  reported_user_id: string | null;
  reported_post_id: string | null;
  reported_comment_id: string | null;

  reason: ReportReason;
  description: string | null;

  status: ReportStatus;
  moderator_id: string | null;
  moderator_note: string | null;
  resolved_at: string | null;

  created_at: string;
}

// ============================================================================
// RATE LIMITS
// ============================================================================

export interface PostRateLimit {
  user_id: string;
  date: string;
  post_count: number;
}

// ============================================================================
// API REQUESTS / RESPONSES
// ============================================================================

export interface CreatePostRequest {
  content: string;
  media_url?: string;
  media_type?: MediaType;
  link_url?: string;
  visibility: PostVisibility;
  is_announcement?: boolean;
  mentioned_users?: string[]; // IDs des utilisateurs mentionnés
}

export interface UpdatePostRequest {
  content?: string;
  visibility?: PostVisibility;
  is_pinned?: boolean;
  is_announcement?: boolean;
}

export interface CreateCommentRequest {
  post_id: string;
  content: string;
  parent_comment_id?: string;
}

export interface UpdateProfileRequest {
  username?: string;
  bio?: string;
  avatar_url?: string;
  banner_url?: string;
  location?: string;
  genres?: string[];
  is_public?: boolean;
}

export interface CreateMusicLinkRequest {
  platform: MusicPlatform;
  url: string;
}

export interface FeedParams {
  limit?: number;
  offset?: number;
  visibility?: PostVisibility;
}

export interface SearchParams {
  query: string;
  type?: 'profiles' | 'posts' | 'all';
  limit?: number;
  offset?: number;
}

// ============================================================================
// UI HELPERS
// ============================================================================

export interface PostComposerState {
  content: string;
  mediaFile: File | null;
  mediaPreview: string | null;
  visibility: PostVisibility;
  isAnnouncement: boolean;
  mentionedUsers: Profile[];
}

export interface NotificationGroup {
  type: NotificationType;
  notifications: NotificationWithActor[];
  count: number;
  latest: string;
}
