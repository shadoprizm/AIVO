import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Ban,
  BookOpen,
  EyeOff,
  Loader2,
  RefreshCw,
  Trash2,
  Undo2,
} from 'lucide-react';
import DashboardLayout from '../components/layouts/DashboardLayout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import {
  AbuseBlockType,
  AdminAbuseBlock,
  AdminAuditLog,
  AdminFeedback,
  AdminOverview,
  AdminScan,
  AdminUserDetails,
  AdminUserSummary,
  adminApi,
} from '../lib/admin';

type AdminTab = 'overview' | 'users' | 'scans' | 'feedback' | 'blocks' | 'audit';

const tabs: Array<{ id: AdminTab; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'users', label: 'Users' },
  { id: 'scans', label: 'Scans' },
  { id: 'feedback', label: 'Feedback' },
  { id: 'blocks', label: 'Abuse Blocks' },
  { id: 'audit', label: 'Audit' },
];

function formatDate(value?: string | null) {
  if (!value) return 'Never';
  return new Date(value).toLocaleString();
}

function scanSite(scan: AdminScan) {
  const site = Array.isArray(scan.sites) ? scan.sites[0] : scan.sites;
  return site ?? null;
}

function blockValue(block: AdminAbuseBlock) {
  return block.user_id ?? block.domain ?? block.request_ip_hash ?? block.user_agent_hash ?? '';
}

function statusClass(status?: string | null) {
  if (status === 'suspended' || status === 'failed') return 'bg-red-50 text-red-700 border-red-200';
  if (status === 'active' || status === 'completed') return 'bg-green-50 text-green-700 border-green-200';
  if (status === 'processing') return 'bg-blue-50 text-blue-700 border-blue-200';
  return 'bg-gray-50 text-gray-700 border-gray-200';
}

function StatusPill({ value }: { value?: string | null }) {
  return (
    <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold capitalize ${statusClass(value)}`}>
      {value || 'unknown'}
    </span>
  );
}

function getReason(action: string) {
  const reason = window.prompt(`Reason for ${action}?`);
  return reason?.trim() || null;
}

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [scans, setScans] = useState<AdminScan[]>([]);
  const [feedback, setFeedback] = useState<AdminFeedback[]>([]);
  const [blocks, setBlocks] = useState<AdminAbuseBlock[]>([]);
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminUserDetails | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [blockType, setBlockType] = useState<AbuseBlockType>('domain');
  const [blockValueInput, setBlockValueInput] = useState('');
  const [blockReason, setBlockReason] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'overview') {
        const [overviewData, scanData, blockData, auditData] = await Promise.all([
          adminApi.getOverview(),
          adminApi.listScans({ perPage: 8 }),
          adminApi.listAbuseBlocks({ perPage: 8 }),
          adminApi.listAuditLogs({ perPage: 8 }),
        ]);
        setOverview(overviewData);
        setScans(scanData.scans);
        setBlocks(blockData.blocks);
        setLogs(auditData.logs);
      }
      if (activeTab === 'users') {
        const data = await adminApi.listUsers({ perPage: 50, search: userSearch || undefined });
        setUsers(data.users);
      }
      if (activeTab === 'scans') {
        const data = await adminApi.listScans({ perPage: 50 });
        setScans(data.scans);
      }
      if (activeTab === 'feedback') {
        const data = await adminApi.listFeedback({ perPage: 50 });
        setFeedback(data.feedback);
      }
      if (activeTab === 'blocks') {
        const data = await adminApi.listAbuseBlocks({ perPage: 50 });
        setBlocks(data.blocks);
      }
      if (activeTab === 'audit') {
        const data = await adminApi.listAuditLogs({ perPage: 50 });
        setLogs(data.logs);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }, [activeTab, userSearch]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const reloadSelectedUser = async (userId: string) => {
    const data = await adminApi.getUser(userId);
    setSelectedUser(data);
  };

  const runAction = async (callback: () => Promise<void>, success: string) => {
    setError('');
    setMessage('');
    try {
      await callback();
      setMessage(success);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Admin action failed');
    }
  };

  const handleSuspend = (user: AdminUserSummary | AdminUserDetails['user']) => {
    const reason = getReason(`suspending ${user.email ?? user.id}`);
    if (!reason) return;
    runAction(async () => {
      await adminApi.suspendUser(user.id, reason);
      if (selectedUser?.user.id === user.id) await reloadSelectedUser(user.id);
    }, `Suspended ${user.email ?? user.id}`);
  };

  const handleUnsuspend = (user: AdminUserSummary | AdminUserDetails['user']) => {
    const reason = getReason(`unsuspending ${user.email ?? user.id}`);
    if (!reason) return;
    runAction(async () => {
      await adminApi.unsuspendUser(user.id, reason);
      if (selectedUser?.user.id === user.id) await reloadSelectedUser(user.id);
    }, `Unsuspended ${user.email ?? user.id}`);
  };

  const handleSoftDelete = (user: AdminUserSummary | AdminUserDetails['user']) => {
    if (!window.confirm(`Soft delete ${user.email ?? user.id}? This cannot be undone from the app.`)) return;
    const reason = getReason(`soft deleting ${user.email ?? user.id}`);
    if (!reason) return;
    runAction(async () => {
      await adminApi.softDeleteUser(user.id, reason);
      if (selectedUser?.user.id === user.id) setSelectedUser(null);
    }, `Soft deleted ${user.email ?? user.id}`);
  };

  const handleHideReport = (scan: AdminScan) => {
    const reason = getReason(`hiding report ${scan.id}`);
    if (!reason) return;
    runAction(() => adminApi.hideReport(scan.id, reason).then(() => undefined), 'Report hidden');
  };

  const handleDeleteScan = (scan: AdminScan) => {
    if (!window.confirm(`Delete scan ${scan.id}?`)) return;
    const reason = getReason(`deleting scan ${scan.id}`);
    if (!reason) return;
    runAction(() => adminApi.deleteScan(scan.id, reason).then(() => undefined), 'Scan deleted');
  };

  const handleDeleteSite = (siteId: string) => {
    if (!window.confirm(`Delete site ${siteId} and its scans?`)) return;
    const reason = getReason(`deleting site ${siteId}`);
    if (!reason) return;
    runAction(async () => {
      await adminApi.deleteSite(siteId, reason);
      if (selectedUser) await reloadSelectedUser(selectedUser.user.id);
    }, 'Site deleted');
  };

  const handleCreateBlock = (type: AbuseBlockType, value: string, reason?: string) => {
    const trimmedValue = value.trim();
    const blockReasonText = reason?.trim() || getReason(`blocking ${trimmedValue}`);
    if (!trimmedValue || !blockReasonText) return;
    runAction(
      () => adminApi.createAbuseBlock({
        blockType: type,
        reason: blockReasonText,
        ...(type === 'user' ? { userId: trimmedValue } : { value: trimmedValue }),
      }).then(() => undefined),
      'Abuse block created',
    );
  };

  const handleDeactivateBlock = (block: AdminAbuseBlock) => {
    const reason = getReason(`deactivating block ${blockValue(block)}`);
    if (!reason) return;
    runAction(() => adminApi.deactivateAbuseBlock(block.id, reason).then(() => undefined), 'Abuse block deactivated');
  };

  const handleManualBlockSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!blockReason.trim()) {
      setError('A reason is required to create a block');
      return;
    }
    handleCreateBlock(blockType, blockValueInput, blockReason);
    setBlockValueInput('');
    setBlockReason('');
  };

  const renderUserActions = (user: AdminUserSummary | AdminUserDetails['user']) => {
    const suspended = user.moderation?.status === 'suspended';
    return (
      <div className="flex flex-wrap gap-2">
        {suspended ? (
          <button onClick={() => handleUnsuspend(user)} className="inline-flex items-center gap-1 text-sm font-medium text-green-700">
            <Undo2 className="h-4 w-4" /> Unsuspend
          </button>
        ) : (
          <button onClick={() => handleSuspend(user)} className="inline-flex items-center gap-1 text-sm font-medium text-red-700">
            <Ban className="h-4 w-4" /> Suspend
          </button>
        )}
        <button onClick={() => handleCreateBlock('user', user.id)} className="text-sm font-medium text-gray-700">
          Block user
        </button>
        <button onClick={() => handleSoftDelete(user)} className="inline-flex items-center gap-1 text-sm font-medium text-red-700">
          <Trash2 className="h-4 w-4" /> Soft delete
        </button>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Administration</h1>
            <p className="text-gray-600">Moderate users, scans, public feedback, and abuse controls.</p>
          </div>
          <div className="flex gap-3">
            <Link to="/admin/blog">
              <Button variant="outline" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" /> Blog Admin
              </Button>
            </Link>
            <Button onClick={refresh} disabled={loading} className="flex items-center gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Refresh
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSelectedUser(null);
              }}
              className={`px-4 py-3 text-sm font-semibold border-b-2 ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {message && <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-700">{message}</div>}
        {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}

        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              {[
                ['Users', overview?.total_users ?? 0],
                ['Total scans', overview?.total_scans ?? 0],
                ['Scans last 24h', overview?.scans_last_24h ?? 0],
                ['Feedback', overview?.feedback_count ?? 0],
                ['Suspended users', overview?.suspended_users ?? 0],
                ['Active blocks', overview?.active_blocks ?? 0],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-gray-200 bg-white p-5">
                  <p className="text-sm font-medium text-gray-600">{label}</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
                </div>
              ))}
            </div>
            <AdminScansTable scans={scans} onHide={handleHideReport} onDelete={handleDeleteScan} onBlock={handleCreateBlock} compact />
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            <form onSubmit={(event) => { event.preventDefault(); refresh(); }} className="flex max-w-xl gap-3">
              <Input
                value={userSearch}
                onChange={(event) => setUserSearch(event.target.value)}
                placeholder="Search current auth page by email or exact user id"
              />
              <Button type="submit" variant="outline">Search</Button>
            </form>
            <section className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-600">
                  <tr>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Sites</th>
                    <th className="px-4 py-3">Scans</th>
                    <th className="px-4 py-3">Last sign-in</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-t border-gray-100 align-top">
                      <td className="px-4 py-3">
                        <button
                          onClick={() => reloadSelectedUser(user.id)}
                          className="font-semibold text-blue-700 hover:text-blue-800"
                        >
                          {user.email ?? user.id}
                        </button>
                        <p className="mt-1 text-xs text-gray-500">{user.id}</p>
                      </td>
                      <td className="px-4 py-3"><StatusPill value={user.moderation?.status ?? 'active'} /></td>
                      <td className="px-4 py-3">{user.site_count}</td>
                      <td className="px-4 py-3">{user.scan_count}</td>
                      <td className="px-4 py-3">{formatDate(user.last_sign_in_at)}</td>
                      <td className="px-4 py-3">{renderUserActions(user)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {selectedUser && (
              <section className="space-y-5 rounded-lg border border-gray-200 bg-white p-5">
                <div className="flex flex-wrap justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{selectedUser.user.email ?? selectedUser.user.id}</h2>
                    <p className="text-sm text-gray-500">{selectedUser.user.id}</p>
                    <p className="mt-2 text-sm text-gray-600">Created {formatDate(selectedUser.user.created_at as string | undefined)}</p>
                  </div>
                  {renderUserActions({ ...selectedUser.user, moderation: selectedUser.moderation })}
                </div>
                {selectedUser.moderation?.reason && (
                  <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-800">
                    Moderation reason: {selectedUser.moderation.reason}
                  </div>
                )}

                <div>
                  <h3 className="mb-3 font-semibold text-gray-900">Sites</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <tbody>
                        {selectedUser.sites.map((site) => (
                          <tr key={site.id} className="border-t border-gray-100">
                            <td className="py-3 pr-4">
                              <p className="font-medium text-gray-900">{site.name}</p>
                              <p className="text-gray-500">{site.url}</p>
                            </td>
                            <td className="py-3 text-gray-500">Last scanned {formatDate(site.last_scanned_at)}</td>
                            <td className="py-3 text-right">
                              <button onClick={() => handleDeleteSite(site.id)} className="text-sm font-medium text-red-700">
                                Delete site
                              </button>
                            </td>
                          </tr>
                        ))}
                        {selectedUser.sites.length === 0 && (
                          <tr><td className="py-3 text-gray-500">No owned sites.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 font-semibold text-gray-900">Scans</h3>
                  <AdminScansTable scans={selectedUser.scans} onHide={handleHideReport} onDelete={handleDeleteScan} onBlock={handleCreateBlock} compact />
                </div>

                <div>
                  <h3 className="mb-3 font-semibold text-gray-900">Recent Feedback</h3>
                  <FeedbackList feedback={selectedUser.feedback} />
                </div>
              </section>
            )}
          </div>
        )}

        {activeTab === 'scans' && (
          <AdminScansTable scans={scans} onHide={handleHideReport} onDelete={handleDeleteScan} onBlock={handleCreateBlock} />
        )}

        {activeTab === 'feedback' && <FeedbackList feedback={feedback} />}

        {activeTab === 'blocks' && (
          <div className="space-y-6">
            <form onSubmit={handleManualBlockSubmit} className="rounded-lg border border-gray-200 bg-white p-5">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Create Abuse Block</h2>
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Type</label>
                  <select
                    value={blockType}
                    onChange={(event) => setBlockType(event.target.value as AbuseBlockType)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="domain">Domain</option>
                    <option value="request_ip_hash">IP hash</option>
                    <option value="user_agent_hash">User-agent hash</option>
                    <option value="user">User ID</option>
                  </select>
                </div>
                <Input label="Value" value={blockValueInput} onChange={(event) => setBlockValueInput(event.target.value)} required />
                <Input label="Reason" value={blockReason} onChange={(event) => setBlockReason(event.target.value)} required />
                <div className="flex items-end">
                  <Button type="submit" className="w-full">Create block</Button>
                </div>
              </div>
            </form>
            <BlocksTable blocks={blocks} onDeactivate={handleDeactivateBlock} />
          </div>
        )}

        {activeTab === 'audit' && <AuditTable logs={logs} />}

        {loading && (
          <div className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white p-6 text-gray-600">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading admin data...
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function AdminScansTable({
  scans,
  onHide,
  onDelete,
  onBlock,
  compact = false,
}: {
  scans: AdminScan[];
  onHide: (scan: AdminScan) => void;
  onDelete: (scan: AdminScan) => void;
  onBlock: (type: AbuseBlockType, value: string, reason?: string) => void;
  compact?: boolean;
}) {
  return (
    <section className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-600">
          <tr>
            <th className="px-4 py-3">Scan</th>
            <th className="px-4 py-3">Site</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Source</th>
            <th className="px-4 py-3">Domain</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {scans.map((scan) => {
            const site = scanSite(scan);
            return (
              <tr key={scan.id} className="border-t border-gray-100 align-top">
                <td className="px-4 py-3">
                  <p className="font-mono text-xs text-gray-700">{scan.id}</p>
                  <p className="mt-1 text-gray-500">{formatDate(scan.created_at)}</p>
                  {!compact && <p className="text-gray-500">User: {scan.user_id ?? site?.user_id ?? 'anonymous'}</p>}
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{site?.name ?? 'Unknown site'}</p>
                  <p className="max-w-xs break-all text-gray-500">{site?.url ?? scan.site_id}</p>
                </td>
                <td className="px-4 py-3">
                  <StatusPill value={scan.status} />
                  <p className="mt-2 text-gray-500">Score {scan.overall_score ?? '-'}</p>
                  <p className="text-gray-500">Visibility {scan.visibility ?? 'private'}</p>
                </td>
                <td className="px-4 py-3">{scan.source ?? 'dashboard'}</td>
                <td className="px-4 py-3">
                  <p>{scan.request_domain ?? '-'}</p>
                  {scan.request_ip_hash && <p className="mt-1 font-mono text-xs text-gray-500">IP {scan.request_ip_hash.slice(0, 12)}...</p>}
                  {scan.user_agent_hash && <p className="font-mono text-xs text-gray-500">UA {scan.user_agent_hash.slice(0, 12)}...</p>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => onHide(scan)} className="inline-flex items-center gap-1 text-sm font-medium text-gray-700">
                      <EyeOff className="h-4 w-4" /> Hide
                    </button>
                    <button onClick={() => onDelete(scan)} className="inline-flex items-center gap-1 text-sm font-medium text-red-700">
                      <Trash2 className="h-4 w-4" /> Delete
                    </button>
                    {scan.request_domain && (
                      <button onClick={() => onBlock('domain', scan.request_domain || '')} className="text-sm font-medium text-red-700">
                        Block domain
                      </button>
                    )}
                    {scan.request_ip_hash && (
                      <button onClick={() => onBlock('request_ip_hash', scan.request_ip_hash || '')} className="text-sm font-medium text-red-700">
                        Block IP hash
                      </button>
                    )}
                    {scan.user_agent_hash && (
                      <button onClick={() => onBlock('user_agent_hash', scan.user_agent_hash || '')} className="text-sm font-medium text-red-700">
                        Block UA hash
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
          {scans.length === 0 && (
            <tr><td className="px-4 py-6 text-gray-500" colSpan={6}>No scans found.</td></tr>
          )}
        </tbody>
      </table>
    </section>
  );
}

function FeedbackList({ feedback }: { feedback: AdminFeedback[] }) {
  return (
    <section className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-600">
          <tr>
            <th className="px-4 py-3">Feedback</th>
            <th className="px-4 py-3">Contact</th>
            <th className="px-4 py-3">Scan</th>
            <th className="px-4 py-3">Created</th>
          </tr>
        </thead>
        <tbody>
          {feedback.map((item) => {
            const site = item.scan ? scanSite(item.scan) : null;
            return (
              <tr key={item.id} className="border-t border-gray-100 align-top">
                <td className="px-4 py-3">
                  <p className="font-medium capitalize text-gray-900">{item.usefulness ?? 'unknown'}</p>
                  <p className="mt-1 max-w-xl whitespace-pre-wrap text-gray-600">{item.free_text || 'No note'}</p>
                  {item.role && <p className="mt-1 text-gray-500">Role: {item.role}</p>}
                </td>
                <td className="px-4 py-3">{item.email || '-'}</td>
                <td className="px-4 py-3">
                  <p className="font-mono text-xs">{item.public_token ? `${item.public_token.slice(0, 12)}...` : 'Deleted scan'}</p>
                  <p className="mt-1 text-gray-500">{site?.name ?? item.scan?.request_domain ?? '-'}</p>
                </td>
                <td className="px-4 py-3">{formatDate(item.created_at)}</td>
              </tr>
            );
          })}
          {feedback.length === 0 && (
            <tr><td className="px-4 py-6 text-gray-500" colSpan={4}>No feedback found.</td></tr>
          )}
        </tbody>
      </table>
    </section>
  );
}

function BlocksTable({ blocks, onDeactivate }: { blocks: AdminAbuseBlock[]; onDeactivate: (block: AdminAbuseBlock) => void }) {
  return (
    <section className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-600">
          <tr>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Value</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Reason</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {blocks.map((block) => (
            <tr key={block.id} className="border-t border-gray-100 align-top">
              <td className="px-4 py-3">{block.block_type}</td>
              <td className="px-4 py-3 font-mono text-xs">{blockValue(block)}</td>
              <td className="px-4 py-3"><StatusPill value={block.active ? 'active' : 'inactive'} /></td>
              <td className="px-4 py-3">
                <p>{block.reason}</p>
                <p className="mt-1 text-gray-500">Created {formatDate(block.created_at)}</p>
              </td>
              <td className="px-4 py-3">
                {block.active && (
                  <button onClick={() => onDeactivate(block)} className="text-sm font-medium text-green-700">
                    Deactivate
                  </button>
                )}
              </td>
            </tr>
          ))}
          {blocks.length === 0 && (
            <tr><td className="px-4 py-6 text-gray-500" colSpan={5}>No abuse blocks found.</td></tr>
          )}
        </tbody>
      </table>
    </section>
  );
}

function AuditTable({ logs }: { logs: AdminAuditLog[] }) {
  return (
    <section className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-600">
          <tr>
            <th className="px-4 py-3">Action</th>
            <th className="px-4 py-3">Actor</th>
            <th className="px-4 py-3">Target</th>
            <th className="px-4 py-3">Details</th>
            <th className="px-4 py-3">Created</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} className="border-t border-gray-100 align-top">
              <td className="px-4 py-3 font-medium text-gray-900">{log.action}</td>
              <td className="px-4 py-3">{log.actor_email ?? log.actor_user_id ?? '-'}</td>
              <td className="px-4 py-3">
                <p>{log.target_type}</p>
                <p className="font-mono text-xs text-gray-500">{log.target_id}</p>
              </td>
              <td className="px-4 py-3">
                <pre className="max-w-md whitespace-pre-wrap rounded bg-gray-50 p-2 text-xs text-gray-700">
                  {JSON.stringify(log.details, null, 2)}
                </pre>
              </td>
              <td className="px-4 py-3">{formatDate(log.created_at)}</td>
            </tr>
          ))}
          {logs.length === 0 && (
            <tr><td className="px-4 py-6 text-gray-500" colSpan={5}>No audit logs found.</td></tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
