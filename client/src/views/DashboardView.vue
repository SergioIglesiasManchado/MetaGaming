<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import type { UserProfile } from '../types/auth';

const authStore = useAuthStore();
const user = computed(() => authStore.user);
const isAdmin = computed(() => authStore.isAdmin);

// Admin user search & management state
const searchQuery = ref('');
const usersList = ref<UserProfile[]>([]);
const loadingUsers = ref(false);
const updatingUserId = ref<number | null>(null);
const searchError = ref<string | null>(null);
const searchSuccess = ref<string | null>(null);

const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const formattedDate = computed(() => {
  if (!user.value?.created_at) return 'Recently';
  return new Date(user.value.created_at).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

const fetchUsers = async () => {
  if (!isAdmin.value || !authStore.token) return;
  loadingUsers.value = true;
  searchError.value = null;

  try {
    const url = new URL(`${apiBaseUrl}/api/v1/users`);
    if (searchQuery.value.trim()) {
      url.searchParams.set('q', searchQuery.value.trim());
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${authStore.token}`
      }
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to search users');
    }

    usersList.value = data.data;
  } catch (err) {
    searchError.value = err instanceof Error ? err.message : 'Error fetching users';
  } finally {
    loadingUsers.value = false;
  }
};

const setRole = async (targetUserId: number, newRole: 'user' | 'admin') => {
  if (!authStore.token) return;
  updatingUserId.value = targetUserId;
  searchError.value = null;
  searchSuccess.value = null;

  try {
    const response = await fetch(`${apiBaseUrl}/api/v1/users/${targetUserId}/role`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authStore.token}`
      },
      body: JSON.stringify({ role: newRole })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update user role');
    }

    const updated = data.data as UserProfile;
    const idx = usersList.value.findIndex((u) => u.id === targetUserId);
    if (idx !== -1) {
      usersList.value[idx] = updated;
    }
    searchSuccess.value = `Successfully updated @${updated.username}'s role to ${newRole === 'admin' ? 'Administrator' : 'Gamer'}!`;
  } catch (err) {
    searchError.value = err instanceof Error ? err.message : 'Error updating user role';
  } finally {
    updatingUserId.value = null;
  }
};

onMounted(() => {
  if (isAdmin.value) {
    fetchUsers();
  }
});
</script>

<template>
  <div class="dashboard-container">
    <!-- Header banner -->
    <header class="dashboard-header" :class="{ 'admin-header': isAdmin }">
      <div class="header-content">
        <div class="user-badge-group">
          <h1>Welcome, {{ user?.username }}!</h1>
          <span v-if="isAdmin" class="badge badge-admin">🛡️ Administrator</span>
          <span v-else class="badge badge-user">🎮 Gamer</span>
        </div>
        <p class="header-meta">
          <span><strong>Email:</strong> {{ user?.email }}</span>
          <span>•</span>
          <span><strong>Member since:</strong> {{ formattedDate }}</span>
        </p>
      </div>
    </header>

    <!-- ADMIN EXCLUSIVE DASHBOARD VIEW -->
    <section v-if="isAdmin" class="admin-section" data-testid="admin-dashboard">
      <div class="section-title">
        <h2>🛡️ Administrator Control Center</h2>
        <p>Manage platform health, inspect system metrics, and curate public content</p>
      </div>

      <!-- Platform metrics -->
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-label">Platform Role</span>
          <span class="stat-value admin-accent">Super Admin</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Database Status</span>
          <span class="stat-value text-success">Healthy (PostgreSQL)</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Official Collections Auth</span>
          <span class="stat-value text-primary">Authorized</span>
        </div>
      </div>

      <!-- User Search & Role Assignment Section -->
      <div class="admin-card user-management-card" data-testid="user-management">
        <div class="card-header">
          <div>
            <h3>👥 User Management & Permissions</h3>
            <p>Search registered users and grant or revoke administrator privileges</p>
          </div>
          <span class="pill pill-admin">Access Control</span>
        </div>

        <div class="search-bar">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search users by username or email..."
            @keyup.enter="fetchUsers"
            data-testid="user-search-input"
          />
          <button @click="fetchUsers" class="btn-search" :disabled="loadingUsers">
            {{ loadingUsers ? 'Searching...' : 'Search' }}
          </button>
        </div>

        <div v-if="searchError" class="alert-error" role="alert">{{ searchError }}</div>
        <div v-if="searchSuccess" class="alert-success" role="alert">{{ searchSuccess }}</div>

        <div v-if="loadingUsers" class="loading-state">
          Searching registered users...
        </div>

        <div v-else-if="usersList.length === 0" class="empty-state">
          No users found. Try searching with a different term.
        </div>

        <div v-else class="users-table-container">
          <table class="users-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="u in usersList" :key="u.id" data-testid="user-row">
                <td><strong>{{ u.username }}</strong></td>
                <td>{{ u.email }}</td>
                <td>
                  <span class="badge" :class="u.role === 'admin' ? 'badge-admin' : 'badge-user'">
                    {{ u.role === 'admin' ? 'Admin' : 'Gamer' }}
                  </span>
                </td>
                <td>
                  <button
                    v-if="u.role !== 'admin'"
                    @click="setRole(u.id, 'admin')"
                    class="btn-role-action btn-grant"
                    :disabled="updatingUserId === u.id"
                  >
                    Grant Admin
                  </button>
                  <button
                    v-else-if="u.id !== user?.id"
                    @click="setRole(u.id, 'user')"
                    class="btn-role-action btn-revoke"
                    :disabled="updatingUserId === u.id"
                  >
                    Revoke Admin
                  </button>
                  <span v-else class="self-tag">(You)</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Official Collections Feature for Admin -->
      <div class="admin-card feature-spotlight">
        <div class="card-header">
          <div>
            <h3>📚 Official & Public Thematic Collections</h3>
            <p>Admin privilege: Curate and publish official game collections visible to all users</p>
          </div>
          <span class="pill pill-admin">Admin Capability</span>
        </div>
        <div class="collections-preview">
          <p class="description">
            You are authorized to configure and publish official thematic game collections across the platform
            (e.g., <em>"Best RPGs of the Decade"</em>, <em>"Top Co-op Adventures"</em>, <em>"Indie Highlights"</em>).
          </p>
          <div class="action-bar">
            <button class="btn-admin-action" disabled title="Creation form will be enabled in collections feature">
              ➕ Create Official Thematic Collection (Ready for v1.1)
            </button>
            <span class="action-note">Configured & ready for collections milestone</span>
          </div>
        </div>
      </div>

      <!-- System diagnostics -->
      <div class="admin-card">
        <h3>⚙️ Platform Diagnostics</h3>
        <ul class="diagnostics-list">
          <li><strong>API Route:</strong> <code>/api/v1</code> (Active)</li>
          <li><strong>Authentication Provider:</strong> JWT with Bcrypt Password Security</li>
          <li><strong>Access Permissions:</strong> Elevated (All community and administrative actions enabled)</li>
        </ul>
      </div>
    </section>

    <!-- STANDARD GAMER DASHBOARD VIEW -->
    <section v-else class="user-section" data-testid="user-dashboard">
      <div class="section-title">
        <h2>🎮 Gamer Hub</h2>
        <p>Track your games, playtime, and connect with your friends</p>
      </div>

      <!-- Gamer stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-label">Games Recorded</span>
          <span class="stat-value">0</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Playtime Logged</span>
          <span class="stat-value">0 hrs</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">My Collections</span>
          <span class="stat-value">0</span>
        </div>
      </div>

      <div class="user-card">
        <h3>🕹️ Your Game Library</h3>
        <p class="empty-state">
          You haven't tracked any games yet. Soon you will be able to search for your favorite games,
          track your completion status, and log hours played!
        </p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.dashboard-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 1.5rem;
}

.dashboard-header {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
}

.admin-header {
  background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%);
  border-color: #c7d2fe;
}

.user-badge-group {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.user-badge-group h1 {
  margin: 0;
  font-size: 2rem;
  color: #1e293b;
}

.badge {
  font-size: 0.85rem;
  font-weight: 700;
  padding: 0.35rem 0.8rem;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge-user {
  background: #e0e7ff;
  color: #4338ca;
}

.badge-admin {
  background: #dcfce7;
  color: #15803d;
  border: 1px solid #86efac;
}

.header-meta {
  margin: 0.75rem 0 0 0;
  color: #64748b;
  font-size: 0.95rem;
  display: flex;
  gap: 0.6rem;
  align-items: center;
}

.section-title h2 {
  margin: 0 0 0.3rem 0;
  color: #1e293b;
  font-size: 1.5rem;
}

.section-title p {
  margin: 0 0 1.5rem 0;
  color: #64748b;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.25rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.stat-label {
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
}

.stat-value {
  font-size: 1.6rem;
  font-weight: 800;
  color: #1e293b;
}

.admin-accent {
  color: #4f46e5;
}

.text-success {
  color: #16a34a;
  font-size: 1.2rem;
}

.text-primary {
  color: #2563eb;
  font-size: 1.2rem;
}

.admin-card, .user-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 1.75rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.feature-spotlight {
  border-left: 5px solid #4f46e5;
}

.user-management-card {
  border-left: 5px solid #10b981;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.card-header h3 {
  margin: 0 0 0.25rem 0;
  color: #1e293b;
}

.card-header p {
  margin: 0;
  color: #64748b;
  font-size: 0.95rem;
}

.pill-admin {
  background: #ede9fe;
  color: #6d28d9;
  font-weight: 700;
  font-size: 0.75rem;
  padding: 0.25rem 0.6rem;
  border-radius: 12px;
}

.search-bar {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.search-bar input {
  flex: 1;
  padding: 0.65rem 1rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.95rem;
}

.search-bar input:focus {
  outline: none;
  border-color: #6366f1;
}

.btn-search {
  padding: 0.65rem 1.25rem;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

.btn-search:hover:not(:disabled) {
  background: #4338ca;
}

.btn-search:disabled {
  opacity: 0.6;
}

.alert-error {
  background: #fee2e2;
  color: #b91c1c;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.alert-success {
  background: #dcfce7;
  color: #15803d;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.users-table-container {
  overflow-x: auto;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.95rem;
}

.users-table th, .users-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.users-table th {
  background-color: #f8fafc;
  color: #475569;
  font-weight: 600;
}

.btn-role-action {
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
}

.btn-grant {
  background: #dcfce7;
  color: #15803d;
  border: 1px solid #86efac;
}

.btn-grant:hover:not(:disabled) {
  background: #bbf7d0;
}

.btn-revoke {
  background: #fee2e2;
  color: #b91c1c;
  border: 1px solid #fca5a5;
}

.btn-revoke:hover:not(:disabled) {
  background: #fecaca;
}

.self-tag {
  color: #64748b;
  font-size: 0.85rem;
  font-style: italic;
}

.loading-state, .empty-state {
  padding: 1.5rem;
  text-align: center;
  color: #64748b;
}

.description {
  color: #334155;
  line-height: 1.6;
}

.action-bar {
  margin-top: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn-admin-action {
  background: #4f46e5;
  color: white;
  border: none;
  padding: 0.7rem 1.25rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  opacity: 0.9;
}

.action-note {
  font-size: 0.85rem;
  color: #64748b;
  font-style: italic;
}

.diagnostics-list {
  list-style: none;
  padding: 0;
  margin: 1rem 0 0 0;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.diagnostics-list li {
  color: #334155;
}
</style>
