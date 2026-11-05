import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import DashboardView from '../src/views/DashboardView.vue';
import LoginView from '../src/views/LoginView.vue';
import RegisterView from '../src/views/RegisterView.vue';
import { useAuthStore } from '../src/stores/auth';
import { router } from '../src/router/index';

describe('Auth Views & Dashboard Feature', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders regular Gamer dashboard with personal stats and without admin controls', () => {
    const authStore = useAuthStore();
    authStore.setAuth(
      {
        id: 42,
        username: 'RetroPlayer',
        email: 'retro@example.com',
        role: 'user',
        is_admin: false,
        created_at: '2026-01-15T00:00:00.000Z'
      },
      'fake_user_token'
    );

    const wrapper = mount(DashboardView);

    expect(wrapper.text()).toContain('Welcome, RetroPlayer!');
    expect(wrapper.text()).toContain('🎮 Gamer');
    expect(wrapper.find('[data-testid="user-dashboard"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="admin-dashboard"]').exists()).toBe(false);
    expect(wrapper.text()).not.toContain('Administrator Control Center');
  });

  it('renders Admin dashboard with platform metrics and official collections management', () => {
    const authStore = useAuthStore();
    authStore.setAuth(
      {
        id: 1,
        username: 'MasterAdmin',
        email: 'master@metagaming.com',
        role: 'admin',
        is_admin: true,
        created_at: '2026-01-01T00:00:00.000Z'
      },
      'fake_admin_token'
    );

    const wrapper = mount(DashboardView);

    expect(wrapper.text()).toContain('Welcome, MasterAdmin!');
    expect(wrapper.text()).toContain('🛡️ Administrator');
    expect(wrapper.find('[data-testid="admin-dashboard"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="user-dashboard"]').exists()).toBe(false);

    // Verify acceptance criterion: different dashboard with more info & ability to create public collections
    expect(wrapper.text()).toContain('Administrator Control Center');
    expect(wrapper.text()).toContain('Official & Public Thematic Collections');
    expect(wrapper.text()).toContain('Curate and publish official game collections visible to all users');
    expect(wrapper.find('.btn-admin-action').text()).toContain('Create Official Thematic Collection');
  });

  it('renders LoginView with credentials form', () => {
    const wrapper = mount(LoginView, {
      global: {
        plugins: [router]
      }
    });

    expect(wrapper.find('input#usernameOrEmail').exists()).toBe(true);
    expect(wrapper.find('input#password').exists()).toBe(true);
    expect(wrapper.find('button[type="submit"]').text()).toContain('Log In');
  });

  it('renders RegisterView with registration fields and account type selector', () => {
    const wrapper = mount(RegisterView, {
      global: {
        plugins: [router]
      }
    });

    expect(wrapper.find('input#reg-username').exists()).toBe(true);
    expect(wrapper.find('input#reg-email').exists()).toBe(true);
    expect(wrapper.find('input#reg-password').exists()).toBe(true);
    expect(wrapper.find('input#reg-confirm').exists()).toBe(true);
    expect(wrapper.find('select#reg-role').exists()).toBe(true);
  });
});
