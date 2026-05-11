import { supabase } from './supabase';
import { BlogPost } from '../types/database';

export interface AdminModeration {
  user_id: string;
  status: 'active' | 'suspended';
  reason: string | null;
  suspended_by: string | null;
  suspended_at: string | null;
  expires_at: string | null;
  updated_at: string;
}

export interface AdminUserSummary {
  id: string;
  email?: string;
  created_at?: string;
  last_sign_in_at?: string;
  confirmed_at?: string;
  banned_until?: string | null;
  moderation: AdminModeration | null;
  site_count: number;
  scan_count: number;
  last_scan_at: string | null;
}

export interface AdminSite {
  id: string;
  user_id: string | null;
  name: string;
  url: string;
  created_at: string;
  last_scanned_at: string | null;
}

export interface AdminScan {
  id: string;
  site_id: string;
  user_id: string | null;
  status: string;
  overall_score: number | null;
  public_token: string | null;
  visibility: string | null;
  request_ip_hash: string | null;
  user_agent_hash: string | null;
  request_domain: string | null;
  source: string | null;
  created_at: string;
  completed_at: string | null;
  sites?: AdminSite | AdminSite[] | null;
}

export interface AdminFeedback {
  id: string;
  public_token: string | null;
  usefulness: string | null;
  role: string | null;
  free_text: string | null;
  email: string | null;
  created_at: string;
  scan?: AdminScan | null;
}

export interface AdminAbuseBlock {
  id: string;
  block_type: 'user' | 'domain' | 'request_ip_hash' | 'user_agent_hash';
  user_id: string | null;
  domain: string | null;
  request_ip_hash: string | null;
  user_agent_hash: string | null;
  reason: string;
  active: boolean;
  expires_at: string | null;
  created_by: string | null;
  created_at: string;
  deactivated_by: string | null;
  deactivated_at: string | null;
}

export interface AdminAuditLog {
  id: string;
  actor_user_id: string | null;
  actor_email: string | null;
  action: string;
  target_type: string;
  target_id: string;
  details: Record<string, unknown>;
  created_at: string;
}

export interface AdminOverview {
  total_users: number;
  total_scans: number;
  scans_last_24h: number;
  feedback_count: number;
  suspended_users: number;
  active_blocks: number;
}

export interface AdminUserDetails {
  user: AdminUserSummary & Record<string, unknown>;
  moderation: AdminModeration | null;
  sites: AdminSite[];
  scans: AdminScan[];
  feedback: AdminFeedback[];
}

export interface PaginatedUsers {
  users: AdminUserSummary[];
  page: number;
  perPage: number;
  total: number;
}

export interface PaginatedScans {
  scans: AdminScan[];
  page: number;
  perPage: number;
  total: number;
}

export interface PaginatedFeedback {
  feedback: AdminFeedback[];
  page: number;
  perPage: number;
  total: number;
}

export interface PaginatedBlocks {
  blocks: AdminAbuseBlock[];
  page: number;
  perPage: number;
  total: number;
}

export interface PaginatedAuditLogs {
  logs: AdminAuditLog[];
  page: number;
  perPage: number;
  total: number;
}

export type AbuseBlockType = AdminAbuseBlock['block_type'];

function getFunctionsBaseUrl(): string {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error('Admin service is not configured.');
  }
  return `${supabaseUrl.replace(/\/$/, '')}/functions/v1`;
}

async function adminRequest<T>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('Sign in with an administrator account.');
  }

  const response = await fetch(`${getFunctionsBaseUrl()}/admin-control`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ action, payload }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok || body?.success === false) {
    throw new Error(typeof body?.error === 'string' ? body.error : 'Admin action failed.');
  }

  return body as T;
}

export const adminApi = {
  getOverview: () => adminRequest<AdminOverview>('getOverview'),
  listUsers: (payload: Record<string, unknown> = {}) => adminRequest<PaginatedUsers>('listUsers', payload),
  getUser: (userId: string) => adminRequest<AdminUserDetails>('getUser', { userId }),
  listScans: (payload: Record<string, unknown> = {}) => adminRequest<PaginatedScans>('listScans', payload),
  getScan: (scanId: string) => adminRequest<{ scan: AdminScan; feedback: AdminFeedback[] }>('getScan', { scanId }),
  listFeedback: (payload: Record<string, unknown> = {}) => adminRequest<PaginatedFeedback>('listFeedback', payload),
  listAbuseBlocks: (payload: Record<string, unknown> = {}) => adminRequest<PaginatedBlocks>('listAbuseBlocks', payload),
  listAuditLogs: (payload: Record<string, unknown> = {}) => adminRequest<PaginatedAuditLogs>('listAuditLogs', payload),
  suspendUser: (userId: string, reason: string, expiresAt?: string) =>
    adminRequest<{ moderation: AdminModeration }>('suspendUser', { userId, reason, ...(expiresAt && { expiresAt }) }),
  unsuspendUser: (userId: string, reason: string) =>
    adminRequest<{ moderation: AdminModeration }>('unsuspendUser', { userId, reason }),
  softDeleteUser: (userId: string, reason: string) =>
    adminRequest<{ success: boolean }>('softDeleteUser', { userId, reason }),
  deleteSite: (siteId: string, reason: string) =>
    adminRequest<{ success: boolean }>('deleteSite', { siteId, reason }),
  deleteScan: (scanId: string, reason: string) =>
    adminRequest<{ success: boolean }>('deleteScan', { scanId, reason }),
  hideReport: (scanId: string, reason: string) =>
    adminRequest<{ scan: AdminScan }>('hideReport', { scanId, reason }),
  createAbuseBlock: (payload: {
    blockType: AbuseBlockType;
    value?: string;
    userId?: string;
    reason: string;
    expiresAt?: string;
  }) => adminRequest<{ block: AdminAbuseBlock }>('createAbuseBlock', payload as Record<string, unknown>),
  deactivateAbuseBlock: (blockId: string, reason: string) =>
    adminRequest<{ block: AdminAbuseBlock }>('deactivateAbuseBlock', { blockId, reason }),
  listBlogPosts: () => adminRequest<{ posts: BlogPost[] }>('listBlogPosts'),
  saveBlogPost: (post: Record<string, unknown>, postId?: string) =>
    adminRequest<{ post: BlogPost }>('saveBlogPost', { post, ...(postId && { postId }) }),
  toggleBlogPost: (postId: string, published: boolean) =>
    adminRequest<{ post: BlogPost }>('toggleBlogPost', { postId, published }),
  deleteBlogPost: (postId: string, reason: string) =>
    adminRequest<{ success: boolean }>('deleteBlogPost', { postId, reason }),
};
