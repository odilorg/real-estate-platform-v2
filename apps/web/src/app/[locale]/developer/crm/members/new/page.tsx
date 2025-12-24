'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Save, Loader2, User, UserPlus, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { api } from '@/lib/api';

type UserMode = 'new' | 'existing';

export default function NewMemberPage() {
  const t = useTranslations('crm.members');
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [userMode, setUserMode] = useState<UserMode>('new');
  const [showPassword, setShowPassword] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const [formData, setFormData] = useState({
    // New user fields
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    userPhone: '',
    
    // Existing user
    userId: '',
    
    // Member fields
    role: 'AGENT',
    agentType: '',
    phone: '',
    telegram: '',
    whatsapp: '',
    specializations: '',
    districts: '',
    languages: '',
    licenseNumber: '',
    licenseExpiry: '',
    isActive: true,
  });

  // Search users (debounced)
  useEffect(() => {
    if (userMode === 'existing' && searchQuery.length >= 2) {
      const timer = setTimeout(async () => {
        setSearching(true);
        try {
          const results = await api.get<any[]>(`/developer-crm/members/search-users?q=${searchQuery}`);
          setSearchResults(results);
        } catch (err) {
          console.error('Search failed:', err);
        } finally {
          setSearching(false);
        }
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, userMode]);

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    const password = Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    setFormData({ ...formData, password });
  };

  const handleUserSelect = (user: any) => {
    setSelectedUser(user);
    setFormData({ ...formData, userId: user.id });
    setSearchQuery(`${user.firstName} ${user.lastName} (${user.email})`);
    setSearchResults([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const payload: any = {
        role: formData.role,
        phone: formData.phone || undefined,
        telegram: formData.telegram || undefined,
        whatsapp: formData.whatsapp || undefined,
        licenseNumber: formData.licenseNumber || undefined,
        licenseExpiry: formData.licenseExpiry || undefined,
        isActive: formData.isActive,
      };

      if (formData.agentType) {
        payload.agentType = formData.agentType;
      }

      if (formData.specializations) {
        payload.specializations = formData.specializations.split(',').map(s => s.trim()).filter(Boolean);
      }

      if (formData.districts) {
        payload.districts = formData.districts.split(',').map(d => d.trim()).filter(Boolean);
      }

      if (formData.languages) {
        payload.languages = formData.languages.split(',').map(l => l.trim()).filter(Boolean);
      }

      if (userMode === 'new') {
        payload.newUser = {
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          password: formData.password,
          phone: formData.userPhone || undefined,
        };
      } else {
        payload.userId = formData.userId;
      }

      const result = await api.post<any>('/developer-crm/members', payload);
      router.push(`/developer/crm/members/${result.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to add member');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 md:pb-6">
      <div className="flex items-center gap-4">
        <Link href="/developer/crm/members">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('new.title')}</h1>
          <p className="mt-1 text-sm text-gray-500">{t('new.subtitle')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">{error}</div>
        )}

        {/* User Selection Mode */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('sections.user')}</h2>

          <div className="flex gap-4 mb-6">
            <button
              type="button"
              onClick={() => setUserMode('new')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                userMode === 'new'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <UserPlus className="h-5 w-5" />
              <span className="font-medium">{t('form.newUser')}</span>
            </button>
            <button
              type="button"
              onClick={() => setUserMode('existing')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                userMode === 'existing'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <User className="h-5 w-5" />
              <span className="font-medium">{t('form.existingUser')}</span>
            </button>
          </div>

          {userMode === 'new' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.firstName')} *</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.lastName')} *</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.email')} *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.password')} *</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder={t('form.passwordPlaceholder')}
                      minLength={6}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                    title={t('actions.generate')}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.phone')}</label>
                <input
                  type="tel"
                  value={formData.userPhone}
                  onChange={(e) => setFormData({ ...formData, userPhone: e.target.value })}
                  placeholder="+998 90 123 45 67"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.selectUser')} *</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setSelectedUser(null);
                      setFormData({ ...formData, userId: '' });
                    }}
                    placeholder={t('form.selectUserPlaceholder')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {searching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    </div>
                  )}
                </div>
                {searchResults.length > 0 && (
                  <div className="mt-2 border border-gray-200 rounded-lg shadow-lg bg-white max-h-60 overflow-auto">
                    {searchResults.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => handleUserSelect(user)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b last:border-b-0"
                      >
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
                  <p className="mt-2 text-sm text-gray-500">
                    {t('form.noUsersFound')}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Role and Type */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('sections.roleAndType')}</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.role')} *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="OWNER">{t('roles.OWNER')}</option>
                  <option value="ADMIN">{t('roles.ADMIN')}</option>
                  <option value="SENIOR_AGENT">{t('roles.SENIOR_AGENT')}</option>
                  <option value="AGENT">{t('roles.AGENT')}</option>
                  <option value="COORDINATOR">{t('roles.COORDINATOR')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.agentType')}</label>
                <select
                  value={formData.agentType}
                  onChange={(e) => setFormData({ ...formData, agentType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">—</option>
                  <option value="GENERAL">{t('agentTypes.GENERAL')}</option>
                  <option value="RESIDENTIAL">{t('agentTypes.RESIDENTIAL')}</option>
                  <option value="COMMERCIAL">{t('agentTypes.COMMERCIAL')}</option>
                  <option value="RENTAL">{t('agentTypes.RENTAL')}</option>
                  <option value="LUXURY">{t('agentTypes.LUXURY')}</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('sections.contactInfo')}</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.phone')}</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telegram</label>
                <input
                  type="text"
                  value={formData.telegram}
                  onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                  placeholder="@username"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                <input
                  type="text"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  placeholder="+998 90 123 45 67"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Professional Information - Collapsible */}
        <details className="bg-white p-6 rounded-lg shadow" open>
          <summary className="text-xl font-semibold text-gray-900 cursor-pointer">
            {t('sections.professionalInfo')} <span className="text-sm font-normal text-gray-500">({t('sections.optionalNote')})</span>
          </summary>
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.specializations')}</label>
              <input
                type="text"
                value={formData.specializations}
                onChange={(e) => setFormData({ ...formData, specializations: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.licenseNumber')}</label>
                <input
                  type="text"
                  value={formData.licenseNumber}
                  onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.licenseNumber')}</label>
                <input
                  type="date"
                  value={formData.licenseExpiry}
                  onChange={(e) => setFormData({ ...formData, licenseExpiry: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </details>

        {/* Status */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('detail.status')}</h2>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              {t('status.active')}
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link href="/developer/crm/members">
            <button type="button" className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50" disabled={saving}>
              {t('actions.cancel')}
            </button>
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('actions.adding')}
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {t('actions.add')}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
