import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import type { SupabaseClient, User } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const adminEmails = (Deno.env.get('ADMIN_EMAILS') ?? '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

type AdminAction =
  | 'getOverview'
  | 'listUsers'
  | 'getUser'
  | 'listScans'
  | 'getScan'
  | 'listFeedback'
  | 'listAbuseBlocks'
  | 'suspendUser'
  | 'unsuspendUser'
  | 'softDeleteUser'
  | 'deleteSite'
  | 'deleteScan'
  | 'hideReport'
  | 'createAbuseBlock'
  | 'deactivateAbuseBlock'
  | 'listAuditLogs'
  | 'listBlogPosts'
  | 'saveBlogPost'
  | 'toggleBlogPost'
  | 'deleteBlogPost';

interface AdminRequest {
  action?: AdminAction;
  payload?: Record<string, unknown>;
}

interface Pagination {
  page: number;
  perPage: number;
  from: number;
  to: number;
}

interface ModerationRow {
  user_id: string;
  status: 'active' | 'suspended';
  reason: string | null;
  suspended_by: string | null;
  suspended_at: string | null;
  expires_at: string | null;
  updated_at: string;
}

interface SiteRow {
  id: string;
  user_id: string | null;
  name: string;
  url: string;
  created_at: string;
  last_scanned_at: string | null;
}

interface ScanRow {
  id: string;
  site_id: string;
  user_id: string | null;
  status: string;
  overall_score: number | null;
  analysis_json?: Record<string, unknown> | null;
  public_token: string | null;
  visibility: string | null;
  request_ip_hash: string | null;
  user_agent_hash: string | null;
  request_domain: string | null;
  source: string | null;
  created_at: string;
  completed_at: string | null;
  sites?: SiteRow | SiteRow[] | null;
}

interface FeedbackRow {
  id: string;
  public_token: string | null;
  usefulness: string | null;
  role: string | null;
  free_text: string | null;
  email: string | null;
  created_at: string;
}

interface AdminActor {
  id: string;
  email: string;
}

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

function requireEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

function getPayload(payload: Record<string, unknown> | undefined): Record<string, unknown> {
  return payload ?? {};
}

function getString(payload: Record<string, unknown>, key: string): string {
  const value = payload[key];
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${key} is required`);
  }
  return value.trim();
}

function getOptionalString(payload: Record<string, unknown>, key: string): string | null {
  const value = payload[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function requireReason(payload: Record<string, unknown>): string {
  const reason = getString(payload, 'reason');
  if (reason.length < 3) {
    throw new Error('A reason is required');
  }
  return reason.slice(0, 2000);
}

function getPagination(payload: Record<string, unknown>): Pagination {
  const pageValue = Number(payload.page ?? 1);
  const perPageValue = Number(payload.perPage ?? 50);
  const page = Number.isFinite(pageValue) && pageValue > 0 ? Math.floor(pageValue) : 1;
  const perPage = Number.isFinite(perPageValue) && perPageValue > 0
    ? Math.min(Math.floor(perPageValue), 100)
    : 50;
  const from = (page - 1) * perPage;
  return { page, perPage, from, to: from + perPage - 1 };
}

function normalizeDomain(value: string): string {
  return value.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
}

function dedupeById<T extends { id: string }>(rows: T[]): T[] {
  return Array.from(new Map(rows.map((row) => [row.id, row])).values());
}

async function authenticate(req: Request, supabase: SupabaseClient): Promise<AdminActor | Response> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return jsonResponse({ error: 'Authentication required' }, 401);
  }

  const token = authHeader.replace('Bearer ', '').trim();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return jsonResponse({ error: 'Authentication required' }, 401);
  }

  if (adminEmails.length === 0) {
    return jsonResponse({ error: 'Admin access is not configured' }, 403);
  }

  const email = user.email?.toLowerCase();
  if (!email || !adminEmails.includes(email)) {
    return jsonResponse({ error: 'Administrator access required' }, 403);
  }

  return { id: user.id, email };
}

async function audit(
  supabase: SupabaseClient,
  actor: AdminActor,
  action: string,
  targetType: string,
  targetId: string,
  details: Record<string, unknown>,
) {
  const { error } = await supabase
    .from('admin_audit_logs')
    .insert({
      actor_user_id: actor.id,
      actor_email: actor.email,
      action,
      target_type: targetType,
      target_id: targetId,
      details,
    });

  if (error) throw error;
}

async function getModerationMap(supabase: SupabaseClient, userIds: string[]) {
  const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
  const map = new Map<string, ModerationRow>();
  if (uniqueIds.length === 0) return map;

  const { data, error } = await supabase
    .from('user_moderation')
    .select('*')
    .in('user_id', uniqueIds);

  if (error) throw error;
  (data as ModerationRow[] | null)?.forEach((row) => map.set(row.user_id, row));
  return map;
}

async function listUsers(supabase: SupabaseClient, payload: Record<string, unknown>) {
  const { page, perPage } = getPagination(payload);
  const search = getOptionalString(payload, 'search')?.toLowerCase();
  const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
  if (error) throw error;

  let users = data.users as User[];
  if (search) {
    users = users.filter((user) => user.email?.toLowerCase().includes(search) || user.id === search);
  }

  const userIds = users.map((user) => user.id);
  const moderationMap = await getModerationMap(supabase, userIds);

  const { data: sites, error: siteError } = userIds.length
    ? await supabase.from('sites').select('id, user_id, name, url, created_at, last_scanned_at').in('user_id', userIds)
    : { data: [], error: null };
  if (siteError) throw siteError;

  const siteRows = (sites ?? []) as SiteRow[];
  const siteOwnerById = new Map(siteRows.map((site) => [site.id, site.user_id]));
  const siteIds = siteRows.map((site) => site.id);

  const { data: directScans, error: directScanError } = userIds.length
    ? await supabase.from('scans').select('id, user_id, site_id, created_at').in('user_id', userIds)
    : { data: [], error: null };
  if (directScanError) throw directScanError;

  const { data: siteScans, error: siteScanError } = siteIds.length
    ? await supabase.from('scans').select('id, user_id, site_id, created_at').in('site_id', siteIds)
    : { data: [], error: null };
  if (siteScanError) throw siteScanError;

  const siteCounts = new Map<string, number>();
  const scanIdsByUser = new Map<string, Set<string>>();
  const lastScanByUser = new Map<string, string>();

  for (const userId of userIds) {
    siteCounts.set(userId, 0);
    scanIdsByUser.set(userId, new Set());
  }

  for (const site of siteRows) {
    if (site.user_id) {
      siteCounts.set(site.user_id, (siteCounts.get(site.user_id) ?? 0) + 1);
    }
  }

  const recordScan = (userId: string | null | undefined, scan: { id: string; created_at: string }) => {
    if (!userId || !scanIdsByUser.has(userId)) return;
    scanIdsByUser.get(userId)?.add(scan.id);
    const current = lastScanByUser.get(userId);
    if (!current || scan.created_at > current) {
      lastScanByUser.set(userId, scan.created_at);
    }
  };

  for (const scan of (directScans ?? []) as Array<{ id: string; user_id: string | null; created_at: string }>) {
    recordScan(scan.user_id, scan);
  }

  for (const scan of (siteScans ?? []) as Array<{ id: string; site_id: string; created_at: string }>) {
    recordScan(siteOwnerById.get(scan.site_id), scan);
  }

  return {
    users: users.map((user) => ({
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      confirmed_at: user.confirmed_at,
      banned_until: (user as User & { banned_until?: string | null }).banned_until,
      app_metadata: user.app_metadata,
      user_metadata: user.user_metadata,
      moderation: moderationMap.get(user.id) ?? null,
      site_count: siteCounts.get(user.id) ?? 0,
      scan_count: scanIdsByUser.get(user.id)?.size ?? 0,
      last_scan_at: lastScanByUser.get(user.id) ?? null,
    })),
    page,
    perPage,
    total: data.total ?? users.length,
  };
}

async function getUserDetails(supabase: SupabaseClient, payload: Record<string, unknown>) {
  const userId = getString(payload, 'userId');
  const { data: authData, error: authError } = await supabase.auth.admin.getUserById(userId);
  if (authError || !authData.user) throw authError ?? new Error('User not found');

  const { data: moderation, error: moderationError } = await supabase
    .from('user_moderation')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (moderationError) throw moderationError;

  const { data: sites, error: sitesError } = await supabase
    .from('sites')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (sitesError) throw sitesError;

  const siteRows = (sites ?? []) as SiteRow[];
  const siteIds = siteRows.map((site) => site.id);

  const { data: directScans, error: directScansError } = await supabase
    .from('scans')
    .select('*, sites(id, user_id, name, url, created_at, last_scanned_at)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (directScansError) throw directScansError;

  const { data: ownedSiteScans, error: ownedSiteScansError } = siteIds.length
    ? await supabase
      .from('scans')
      .select('*, sites(id, user_id, name, url, created_at, last_scanned_at)')
      .in('site_id', siteIds)
      .order('created_at', { ascending: false })
    : { data: [], error: null };
  if (ownedSiteScansError) throw ownedSiteScansError;

  const scans = dedupeById([...(directScans ?? []) as ScanRow[], ...(ownedSiteScans ?? []) as ScanRow[]])
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const tokens = scans.map((scan) => scan.public_token).filter((token): token is string => Boolean(token));

  const { data: feedback, error: feedbackError } = tokens.length
    ? await supabase
      .from('scan_feedback')
      .select('*')
      .in('public_token', tokens)
      .order('created_at', { ascending: false })
      .limit(25)
    : { data: [], error: null };
  if (feedbackError) throw feedbackError;

  return {
    user: authData.user,
    moderation: moderation ?? null,
    sites: siteRows,
    scans,
    feedback: feedback ?? [],
  };
}

async function listScans(supabase: SupabaseClient, payload: Record<string, unknown>) {
  const { page, perPage, from, to } = getPagination(payload);
  const status = getOptionalString(payload, 'status');
  const source = getOptionalString(payload, 'source');
  const domain = getOptionalString(payload, 'domain');

  let query = supabase
    .from('scans')
    .select('*, sites(id, user_id, name, url, created_at, last_scanned_at)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (status) query = query.eq('status', status);
  if (source) query = query.eq('source', source);
  if (domain) query = query.eq('request_domain', normalizeDomain(domain));

  const { data, error, count } = await query;
  if (error) throw error;
  return { scans: data ?? [], page, perPage, total: count ?? 0 };
}

async function getScan(supabase: SupabaseClient, payload: Record<string, unknown>) {
  const scanId = getString(payload, 'scanId');
  const { data, error } = await supabase
    .from('scans')
    .select('*, sites(id, user_id, name, url, created_at, last_scanned_at)')
    .eq('id', scanId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Scan not found');

  const scan = data as ScanRow;
  const { data: feedback, error: feedbackError } = scan.public_token
    ? await supabase
      .from('scan_feedback')
      .select('*')
      .eq('public_token', scan.public_token)
      .order('created_at', { ascending: false })
    : { data: [], error: null };
  if (feedbackError) throw feedbackError;

  return { scan, feedback: feedback ?? [] };
}

async function listFeedback(supabase: SupabaseClient, payload: Record<string, unknown>) {
  const { page, perPage, from, to } = getPagination(payload);
  const { data, error, count } = await supabase
    .from('scan_feedback')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);
  if (error) throw error;

  const feedbackRows = (data ?? []) as FeedbackRow[];
  const tokens = feedbackRows.map((row) => row.public_token).filter((token): token is string => Boolean(token));
  const { data: scans, error: scansError } = tokens.length
    ? await supabase
      .from('scans')
      .select('id, public_token, site_id, user_id, status, overall_score, visibility, request_ip_hash, user_agent_hash, request_domain, source, created_at, completed_at, sites(id, user_id, name, url, created_at, last_scanned_at)')
      .in('public_token', tokens)
    : { data: [], error: null };
  if (scansError) throw scansError;

  const scanByToken = new Map(((scans ?? []) as ScanRow[]).map((scan) => [scan.public_token, scan]));
  return {
    feedback: feedbackRows.map((row) => ({
      ...row,
      scan: row.public_token ? scanByToken.get(row.public_token) ?? null : null,
    })),
    page,
    perPage,
    total: count ?? 0,
  };
}

async function listAbuseBlocks(supabase: SupabaseClient, payload: Record<string, unknown>) {
  const { page, perPage, from, to } = getPagination(payload);
  const { data, error, count } = await supabase
    .from('admin_abuse_blocks')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);
  if (error) throw error;
  return { blocks: data ?? [], page, perPage, total: count ?? 0 };
}

async function suspendUser(supabase: SupabaseClient, actor: AdminActor, payload: Record<string, unknown>) {
  const userId = getString(payload, 'userId');
  if (userId === actor.id) throw new Error('Admins cannot suspend their own account');
  const reason = requireReason(payload);
  const expiresAt = getOptionalString(payload, 'expiresAt');
  const banDuration = expiresAt
    ? `${Math.max(1, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000))}s`
    : '87600h';

  const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
    ban_duration: banDuration,
  });
  if (authError) throw authError;

  const { data, error } = await supabase
    .from('user_moderation')
    .upsert({
      user_id: userId,
      status: 'suspended',
      reason,
      suspended_by: actor.id,
      suspended_at: new Date().toISOString(),
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    .select()
    .single();
  if (error) throw error;

  await audit(supabase, actor, 'suspend_user', 'user', userId, { reason, expires_at: expiresAt });
  return { moderation: data };
}

async function unsuspendUser(supabase: SupabaseClient, actor: AdminActor, payload: Record<string, unknown>) {
  const userId = getString(payload, 'userId');
  const reason = requireReason(payload);
  const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
    ban_duration: 'none',
  });
  if (authError) throw authError;

  const { data, error } = await supabase
    .from('user_moderation')
    .upsert({
      user_id: userId,
      status: 'active',
      reason,
      suspended_by: null,
      suspended_at: null,
      expires_at: null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    .select()
    .single();
  if (error) throw error;

  await audit(supabase, actor, 'unsuspend_user', 'user', userId, { reason });
  return { moderation: data };
}

async function softDeleteUser(supabase: SupabaseClient, actor: AdminActor, payload: Record<string, unknown>) {
  const userId = getString(payload, 'userId');
  if (userId === actor.id) throw new Error('Admins cannot delete their own account');
  const reason = requireReason(payload);
  const { error } = await supabase.auth.admin.deleteUser(userId, true);
  if (error) throw error;
  await audit(supabase, actor, 'soft_delete_user', 'user', userId, { reason });
  return { success: true };
}

async function deleteSite(supabase: SupabaseClient, actor: AdminActor, payload: Record<string, unknown>) {
  const siteId = getString(payload, 'siteId');
  const reason = requireReason(payload);
  const { error } = await supabase.from('sites').delete().eq('id', siteId);
  if (error) throw error;
  await audit(supabase, actor, 'delete_site', 'site', siteId, { reason });
  return { success: true };
}

async function deleteScan(supabase: SupabaseClient, actor: AdminActor, payload: Record<string, unknown>) {
  const scanId = getString(payload, 'scanId');
  const reason = requireReason(payload);
  const { error } = await supabase.from('scans').delete().eq('id', scanId);
  if (error) throw error;
  await audit(supabase, actor, 'delete_scan', 'scan', scanId, { reason });
  return { success: true };
}

async function hideReport(supabase: SupabaseClient, actor: AdminActor, payload: Record<string, unknown>) {
  const scanId = getString(payload, 'scanId');
  const reason = requireReason(payload);
  const { data, error } = await supabase
    .from('scans')
    .update({ visibility: 'private' })
    .eq('id', scanId)
    .select('id, visibility')
    .single();
  if (error) throw error;
  await audit(supabase, actor, 'hide_report', 'scan', scanId, { reason });
  return { scan: data };
}

async function createAbuseBlock(supabase: SupabaseClient, actor: AdminActor, payload: Record<string, unknown>) {
  const blockType = getString(payload, 'blockType');
  const reason = requireReason(payload);
  const expiresAt = getOptionalString(payload, 'expiresAt');
  const row: Record<string, unknown> = {
    block_type: blockType,
    reason,
    expires_at: expiresAt,
    created_by: actor.id,
    active: true,
  };

  if (blockType === 'user') {
    row.user_id = getString(payload, 'userId');
  } else if (blockType === 'domain') {
    row.domain = normalizeDomain(getString(payload, 'value'));
  } else if (blockType === 'request_ip_hash') {
    row.request_ip_hash = getString(payload, 'value');
  } else if (blockType === 'user_agent_hash') {
    row.user_agent_hash = getString(payload, 'value');
  } else {
    throw new Error('Unsupported block type');
  }

  const { data, error } = await supabase
    .from('admin_abuse_blocks')
    .insert(row)
    .select()
    .single();
  if (error) throw error;

  await audit(supabase, actor, 'create_abuse_block', 'abuse_block', data.id, { reason, block_type: blockType });
  return { block: data };
}

async function deactivateAbuseBlock(supabase: SupabaseClient, actor: AdminActor, payload: Record<string, unknown>) {
  const blockId = getString(payload, 'blockId');
  const reason = requireReason(payload);
  const { data, error } = await supabase
    .from('admin_abuse_blocks')
    .update({
      active: false,
      deactivated_by: actor.id,
      deactivated_at: new Date().toISOString(),
    })
    .eq('id', blockId)
    .select()
    .single();
  if (error) throw error;
  await audit(supabase, actor, 'deactivate_abuse_block', 'abuse_block', blockId, { reason });
  return { block: data };
}

async function listAuditLogs(supabase: SupabaseClient, payload: Record<string, unknown>) {
  const { page, perPage, from, to } = getPagination(payload);
  const { data, error, count } = await supabase
    .from('admin_audit_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);
  if (error) throw error;
  return { logs: data ?? [], page, perPage, total: count ?? 0 };
}

async function getOverview(supabase: SupabaseClient) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const [
    usersResult,
    scansResult,
    recentScansResult,
    feedbackResult,
    suspendedResult,
    blockResult,
  ] = await Promise.all([
    supabase.auth.admin.listUsers({ page: 1, perPage: 1 }),
    supabase.from('scans').select('id', { count: 'exact', head: true }),
    supabase.from('scans').select('id', { count: 'exact', head: true }).gte('created_at', since),
    supabase.from('scan_feedback').select('id', { count: 'exact', head: true }),
    supabase.from('user_moderation').select('user_id', { count: 'exact', head: true }).eq('status', 'suspended'),
    supabase.from('admin_abuse_blocks').select('id', { count: 'exact', head: true }).eq('active', true),
  ]);

  for (const result of [usersResult, scansResult, recentScansResult, feedbackResult, suspendedResult, blockResult]) {
    if (result.error) throw result.error;
  }

  return {
    total_users: (usersResult.data as { total?: number }).total ?? 0,
    total_scans: scansResult.count ?? 0,
    scans_last_24h: recentScansResult.count ?? 0,
    feedback_count: feedbackResult.count ?? 0,
    suspended_users: suspendedResult.count ?? 0,
    active_blocks: blockResult.count ?? 0,
  };
}

const blogFields = [
  'title',
  'slug',
  'excerpt',
  'content',
  'content_format',
  'author_name',
  'author_email',
  'cover_image_url',
  'image_author',
  'image_author_url',
  'image_source',
  'tags',
  'published',
  'published_at',
  'meta_description',
  'reading_time_minutes',
] as const;

function getBlogPayload(payload: Record<string, unknown>) {
  const post = payload.post;
  if (!post || typeof post !== 'object' || Array.isArray(post)) {
    throw new Error('post is required');
  }

  const source = post as Record<string, unknown>;
  const output: Record<string, unknown> = {};
  for (const field of blogFields) {
    if (field in source) output[field] = source[field];
  }
  return output;
}

async function listBlogPosts(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return { posts: data ?? [] };
}

async function saveBlogPost(supabase: SupabaseClient, actor: AdminActor, payload: Record<string, unknown>) {
  const postId = getOptionalString(payload, 'postId');
  const post = getBlogPayload(payload);
  post.updated_at = new Date().toISOString();

  if (!post.title || !post.slug || !post.content) {
    throw new Error('Title, slug, and content are required');
  }

  if (postId) {
    const { data, error } = await supabase
      .from('blog_posts')
      .update(post)
      .eq('id', postId)
      .select()
      .single();
    if (error) throw error;
    await audit(supabase, actor, 'update_blog_post', 'blog_post', postId, { title: data.title });
    return { post: data };
  }

  const { data, error } = await supabase
    .from('blog_posts')
    .insert(post)
    .select()
    .single();
  if (error) throw error;
  await audit(supabase, actor, 'create_blog_post', 'blog_post', data.id, { title: data.title });
  return { post: data };
}

async function toggleBlogPost(supabase: SupabaseClient, actor: AdminActor, payload: Record<string, unknown>) {
  const postId = getString(payload, 'postId');
  const published = Boolean(payload.published);
  const { data, error } = await supabase
    .from('blog_posts')
    .update({
      published,
      published_at: published ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', postId)
    .select()
    .single();
  if (error) throw error;
  await audit(supabase, actor, published ? 'publish_blog_post' : 'unpublish_blog_post', 'blog_post', postId, { title: data.title });
  return { post: data };
}

async function deleteBlogPost(supabase: SupabaseClient, actor: AdminActor, payload: Record<string, unknown>) {
  const postId = getString(payload, 'postId');
  const reason = requireReason(payload);
  const { error } = await supabase.from('blog_posts').delete().eq('id', postId);
  if (error) throw error;
  await audit(supabase, actor, 'delete_blog_post', 'blog_post', postId, { reason });
  return { success: true };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const supabase = createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'));
    const actor = await authenticate(req, supabase);
    if (actor instanceof Response) return actor;

    const body = await req.json().catch(() => null) as AdminRequest | null;
    if (!body?.action) {
      return jsonResponse({ error: 'action is required' }, 400);
    }

    const payload = getPayload(body.payload);
    let result: Record<string, unknown>;

    switch (body.action) {
      case 'getOverview':
        result = await getOverview(supabase);
        break;
      case 'listUsers':
        result = await listUsers(supabase, payload);
        break;
      case 'getUser':
        result = await getUserDetails(supabase, payload);
        break;
      case 'listScans':
        result = await listScans(supabase, payload);
        break;
      case 'getScan':
        result = await getScan(supabase, payload);
        break;
      case 'listFeedback':
        result = await listFeedback(supabase, payload);
        break;
      case 'listAbuseBlocks':
        result = await listAbuseBlocks(supabase, payload);
        break;
      case 'suspendUser':
        result = await suspendUser(supabase, actor, payload);
        break;
      case 'unsuspendUser':
        result = await unsuspendUser(supabase, actor, payload);
        break;
      case 'softDeleteUser':
        result = await softDeleteUser(supabase, actor, payload);
        break;
      case 'deleteSite':
        result = await deleteSite(supabase, actor, payload);
        break;
      case 'deleteScan':
        result = await deleteScan(supabase, actor, payload);
        break;
      case 'hideReport':
        result = await hideReport(supabase, actor, payload);
        break;
      case 'createAbuseBlock':
        result = await createAbuseBlock(supabase, actor, payload);
        break;
      case 'deactivateAbuseBlock':
        result = await deactivateAbuseBlock(supabase, actor, payload);
        break;
      case 'listAuditLogs':
        result = await listAuditLogs(supabase, payload);
        break;
      case 'listBlogPosts':
        result = await listBlogPosts(supabase);
        break;
      case 'saveBlogPost':
        result = await saveBlogPost(supabase, actor, payload);
        break;
      case 'toggleBlogPost':
        result = await toggleBlogPost(supabase, actor, payload);
        break;
      case 'deleteBlogPost':
        result = await deleteBlogPost(supabase, actor, payload);
        break;
      default:
        return jsonResponse({ error: 'Unsupported action' }, 400);
    }

    return jsonResponse({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Admin action failed';
    const status = message.includes('required') || message.includes('Unsupported') ? 400 : 500;
    return jsonResponse({ error: message }, status);
  }
});
