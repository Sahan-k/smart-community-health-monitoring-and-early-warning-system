import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Shield, CheckCircle2, UserCheck, AlertCircle, Search } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function UserManagement() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [search, setSearch] = useState('');

  const fetchUsers = () => {
    setLoading(true);
    api.get('/api/users')
      .then((res) => {
        setUsers(res.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        showToast('Failed to load user accounts.', 'error');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    setUpdatingId(userId);

    try {
      await api.put(`/api/users/${userId}/role`, { role: newRole });
      showToast(`User #${userId} role updated to '${newRole}'.`, 'success');
      fetchUsers();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.detail || 'Failed to update user role.', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      (u.full_name || '').toLowerCase().includes(q) ||
      (u.username || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.phone_number || '').includes(q) ||
      (u.role || '').toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div
        className="saas-card"
        style={{
          padding: '1.75rem 2rem',
          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(15, 26, 54, 0.8) 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          borderLeft: '4px solid #a855f7',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(168, 85, 247, 0.4)',
            }}
          >
            <Users size={24} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#f8fafc', lineHeight: 1.2 }}>
              {t('users.title')}
            </h1>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.2rem' }}>
              {t('users.subtitle')}
            </p>
          </div>
        </div>

        <span className="badge badge-purple" style={{ fontSize: '0.74rem' }}>
          {users.length} {t('users.registeredAccounts')}
        </span>
      </div>

      {/* Search Bar */}
      <div className="saas-card" style={{ padding: '0.9rem 1.4rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} color="#64748b" style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('common.search')}
            className="input-control"
            style={{ paddingLeft: '2.6rem', paddingBottom: '0.55rem', paddingTop: '0.55rem', fontSize: '0.85rem' }}
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="saas-card" style={{ padding: '1.5rem' }}>
        {loading ? (
          <div style={{ color: '#94a3b8', padding: '2rem', textAlign: 'center' }}>{t('common.loading')}</div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>{t('users.noUsers')}</div>
        ) : (
          <div className="table-responsive">
            <table className="table-modern">
              <thead>
                <tr>
                  <th>{t('users.colId')}</th>
                  <th>{t('users.colUserDetails')}</th>
                  <th>{t('users.colEmailPhone')}</th>
                  <th>{t('users.colRole')}</th>
                  <th>{t('users.colChangeRole')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id}>
                    <td style={{ color: '#38bdf8', fontWeight: 700 }}>#{u.id}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#f8fafc' }}>{u.full_name}</div>
                      <div style={{ fontSize: '0.74rem', color: '#64748b' }}>@{u.username || 'user'}</div>
                    </td>
                    <td>
                      <div style={{ color: '#cbd5e1' }}>{u.email || '—'}</div>
                      <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>{u.phone_number ? `+91 ${u.phone_number}` : '—'}</div>
                    </td>
                    <td>
                      <span className="badge badge-low" style={{ fontSize: '0.68rem', textTransform: 'capitalize' }}>
                        {u.role?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      <select
                        value={u.role}
                        disabled={updatingId === u.id}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="input-control"
                        style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem', width: 'auto' }}
                      >
                        <option value="community_member">{t('roles.community_member')}</option>
                        <option value="health_worker">{t('roles.health_worker')}</option>
                        <option value="healthcare_professional">{t('roles.healthcare_professional')}</option>
                        <option value="administrator">{t('roles.administrator')}</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
