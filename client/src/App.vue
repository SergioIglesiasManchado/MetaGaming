<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from './stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const isAuthenticated = computed(() => authStore.isAuthenticated);
const isAdmin = computed(() => authStore.isAdmin);
const username = computed(() => authStore.user?.username);

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};
</script>

<template>
  <div class="app-shell">
    <nav class="navbar">
      <div class="nav-brand">
        <router-link to="/" class="brand-link">
          🎮 <span class="brand-name">MetaGaming</span>
        </router-link>
      </div>

      <div class="nav-links">
        <template v-if="isAuthenticated">
          <router-link to="/dashboard" class="nav-link">Dashboard</router-link>
          <span class="user-greeting">
            👤 {{ username }}
            <span v-if="isAdmin" class="admin-tag">Admin</span>
          </span>
          <button @click="handleLogout" class="btn-logout">Log Out</button>
        </template>
        <template v-else>
          <router-link to="/login" class="nav-link">Log In</router-link>
          <router-link to="/register" class="btn-signup">Sign Up</router-link>
        </template>
      </div>
    </nav>

    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f1f5f9;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background-color: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.brand-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  font-size: 1.4rem;
  font-weight: 700;
  color: #4f46e5;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.nav-link {
  text-decoration: none;
  color: #475569;
  font-weight: 600;
  font-size: 0.95rem;
  transition: color 0.2s;
}

.nav-link:hover {
  color: #4f46e5;
}

.user-greeting {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: 600;
  color: #1e293b;
  font-size: 0.95rem;
  background: #f8fafc;
  padding: 0.35rem 0.75rem;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
}

.admin-tag {
  background: #dcfce7;
  color: #15803d;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.15rem 0.45rem;
  border-radius: 10px;
  text-transform: uppercase;
}

.btn-signup {
  text-decoration: none;
  background-color: #4f46e5;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.btn-signup:hover {
  background-color: #4338ca;
}

.btn-logout {
  background: transparent;
  border: 1px solid #cbd5e1;
  color: #64748b;
  padding: 0.45rem 0.9rem;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-logout:hover {
  background-color: #fee2e2;
  border-color: #fca5a5;
  color: #b91c1c;
}

.main-content {
  flex: 1;
  padding: 1.5rem;
}
</style>
