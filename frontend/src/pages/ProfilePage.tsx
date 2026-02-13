import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { Icon } from '../components/shared/Icon';
import { useAuth } from '../contexts/AuthContext';
import { getProfileStats, UserProfile } from '../api/profile';

export function ProfilePage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getProfileStats();
        setProfile(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatRelativeDate = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return diffMins <= 1 ? 'Just now' : `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
  };

  const handleSearchClick = () => {
    navigate('/history');
  };

  if (error) {
    return (
      <DashboardLayout isSidebarOpen={false} sidebar={null} sidebarWidth={400}>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 mb-4">Error: {error}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-white underline"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout isSidebarOpen={false} sidebar={null} sidebarWidth={400}>
      <div className="flex-1 overflow-y-auto py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gs-purple mb-4 mx-auto"></div>
              <p className="text-gs-text-muted">Loading profile...</p>
            </div>
          </div>
        ) : profile ? (
          <div className="max-w-5xl mx-auto px-6 space-y-6">
            {/* User Info Card */}
            <div className="bg-gs-card border border-white/[0.06] rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4 text-gs-text-main">
                Profile Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gs-text-muted mb-1">Name</p>
                  <p className="text-sm text-gs-text-main">
                    {profile.user_info.displayName || currentUser?.email || 'Not set'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gs-text-muted mb-1">Email</p>
                  <p className="text-sm text-gs-text-main">
                    {profile.user_info.email || 'Not available'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gs-text-muted mb-1">Account Created</p>
                  <p className="text-sm text-gs-text-main">
                    {formatDate(profile.user_info.creationTime)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gs-text-muted mb-1">Last Sign In</p>
                  <p className="text-sm text-gs-text-main">
                    {formatDate(profile.user_info.lastSignInTime)}
                  </p>
                </div>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gs-card border border-white/[0.06] rounded-lg p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gs-purple/10 flex items-center justify-center">
                    <Icon icon="lucide:search" className="w-5 h-5 text-gs-purple" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-gs-text-main">
                      {profile.stats.total_searches}
                    </p>
                    <p className="text-xs text-gs-text-muted">Total Searches</p>
                  </div>
                </div>
              </div>

              <div className="bg-gs-card border border-white/[0.06] rounded-lg p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gs-blue/10 flex items-center justify-center">
                    <Icon icon="lucide:users" className="w-5 h-5 text-gs-blue" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-gs-text-main">
                      {profile.stats.total_candidates_found}
                    </p>
                    <p className="text-xs text-gs-text-muted">Candidates Found</p>
                  </div>
                </div>
              </div>

              <div className="bg-gs-card border border-white/[0.06] rounded-lg p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gs-yellow/10 flex items-center justify-center">
                    <Icon icon="lucide:star" className="w-5 h-5 text-gs-yellow" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-gs-text-main">
                      {profile.stats.total_starred}
                    </p>
                    <p className="text-xs text-gs-text-muted">Total Starred</p>
                  </div>
                </div>
              </div>

              <div className="bg-gs-card border border-white/[0.06] rounded-lg p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gs-cyan/10 flex items-center justify-center">
                    <Icon icon="lucide:message-circle" className="w-5 h-5 text-gs-cyan" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-gs-text-main">
                      {profile.stats.total_conversations}
                    </p>
                    <p className="text-xs text-gs-text-muted">Conversations</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Searches */}
            {profile.stats.recent_searches.length > 0 && (
              <div className="bg-gs-card border border-white/[0.06] rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4 text-gs-text-main">
                  Recent Searches
                </h2>
                <div className="space-y-3">
                  {profile.stats.recent_searches.map((search) => (
                    <div
                      key={search.search_id}
                      onClick={handleSearchClick}
                      className="flex items-center justify-between p-4 bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.12] rounded-lg transition-all cursor-pointer"
                    >
                      <div className="flex-1 min-w-0 mr-4">
                        <p className="text-sm text-gs-text-main line-clamp-2 mb-1">
                          {search.job_description}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-gs-text-muted">
                          <span className="flex items-center gap-1">
                            <Icon icon="lucide:users" className="w-3.5 h-3.5" />
                            {search.total_found} candidates
                          </span>
                          <span>{formatRelativeDate(search.created_at)}</span>
                        </div>
                      </div>
                      <Icon
                        icon="lucide:chevron-right"
                        className="w-5 h-5 text-gs-text-muted flex-shrink-0"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
