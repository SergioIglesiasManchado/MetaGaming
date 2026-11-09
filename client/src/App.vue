<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from './stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const isAuthenticated = computed(() => authStore.isAuthenticated);
const isAdmin = computed(() => authStore.isAdmin);
const username = computed(() => authStore.user?.username);

const isMobileMenuOpen = ref(false);

const handleLogout = () => {
  authStore.logout();
  isMobileMenuOpen.value = false;
  router.push('/login');
};

const closeMenu = () => {
  isMobileMenuOpen.value = false;
};
</script>

<template>
  <div class="app-shell">
    <nav class="navbar">
      <div class="nav-inner">
        <div class="nav-brand">
          <router-link to="/" class="brand-link" @click="closeMenu">
            🎮 <span class="brand-name">MetaGaming</span>
          </router-link>
        </div>

        <!-- Desktop nav -->
        <div class="nav-links desktop-nav">
          <router-link to="/games" class="nav-link">Videogames</router-link>
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

        <!-- Hamburger button (mobile only) -->
        <button
          class="hamburger"
          @click="isMobileMenuOpen = !isMobileMenuOpen"
          :aria-expanded="isMobileMenuOpen"
          aria-label="Toggle navigation menu"
        >
          <span :class="['hamburger-icon', { open: isMobileMenuOpen }]">
            <span></span><span></span><span></span>
          </span>
        </button>
      </div>

      <!-- Mobile dropdown -->
      <div v-if="isMobileMenuOpen" class="mobile-menu">
        <router-link to="/games" class="mobile-link" @click="closeMenu">🎮 Videogames</router-link>
        <template v-if="isAuthenticated">
          <router-link to="/dashboard" class="mobile-link" @click="closeMenu">📊 Dashboard</router-link>
          <div class="mobile-user-info">
            👤 {{ username }}
            <span v-if="isAdmin" class="admin-tag">Admin</span>
          </div>
          <button @click="handleLogout" class="mobile-link mobile-logout">🚪 Log Out</button>
        </template>
        <template v-else>
          <router-link to="/login" class="mobile-link" @click="closeMenu">🔑 Log In</router-link>
          <router-link to="/register" class="mobile-link mobile-signup" @click="closeMenu">✨ Sign Up</router-link>
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
  background-color: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
  height: 60px;
  display: flex;
  justify-content: space-between;
  align-items: center;
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
  min-height: 44px;
  display: inline-flex;
  align-items: center;
}

.nav-link:hover { color: #4f46e5; }

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
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.btn-signup:hover { background-color: #4338ca; }

.btn-logout {
  background: transparent;
  border: 1px solid #cbd5e1;
  color: #64748b;
  padding: 0.45rem 0.9rem;
  min-height: 44px;
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

/* Hamburger */
.hamburger {
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  min-width: 44px;
  min-height: 44px;
  align-items: center;
  justify-content: center;
}

.hamburger-icon {
  display: flex;
  flex-direction: column;
  gap: 5px;
  width: 22px;
}

.hamburger-icon span {
  display: block;
  height: 2px;
  background: #475569;
  border-radius: 2px;
  transition: all 0.25s ease;
}

.hamburger-icon.open span:nth-child(1) {
  transform: translateY(7px) rotate(45deg);
}
.hamburger-icon.open span:nth-child(2) {
  opacity: 0;
}
.hamburger-icon.open span:nth-child(3) {
  transform: translateY(-7px) rotate(-45deg);
}

/* Mobile menu */
.mobile-menu {
  display: flex;
  flex-direction: column;
  border-top: 1px solid #e2e8f0;
  background: #fff;
}

.mobile-link {
  text-decoration: none;
  color: #334155;
  font-weight: 600;
  font-size: 1rem;
  padding: 0.9rem 1.5rem;
  min-height: 52px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #f1f5f9;
  transition: background 0.15s;
  background: none;
  border-left: none;
  border-right: none;
  cursor: pointer;
  text-align: left;
}

.mobile-link:hover { background: #f8fafc; }

.mobile-user-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.9rem 1.5rem;
  color: #64748b;
  font-weight: 600;
  font-size: 0.95rem;
  border-bottom: 1px solid #f1f5f9;
}

.mobile-logout { color: #b91c1c; }
.mobile-logout:hover { background: #fff5f5; }

.mobile-signup {
  color: #4f46e5;
  margin-bottom: 0.5rem;
}

/* Main */
.main-content {
  flex: 1;
  padding: 1.5rem;
}

/* Responsive */
.desktop-nav {
  display: flex;
}

@media (max-width: 768px) {
  .desktop-nav { display: none; }
  .hamburger { display: flex; }
}
</style>
