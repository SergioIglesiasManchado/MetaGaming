import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import App from '../src/App.vue';
import { useAuthStore } from '../src/stores/auth';
import { router } from '../src/router/index';

describe('App.vue Shell & Navigation', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders brand title and login/signup navigation links for guests', () => {
    const authStore = useAuthStore();
    authStore.clearAuth();

    const wrapper = mount(App, {
      global: {
        plugins: [router],
        stubs: {
          'router-view': true
        }
      }
    });

    expect(wrapper.find('.brand-name').text()).toBe('MetaGaming');
    expect(wrapper.text()).toContain('Log In');
    expect(wrapper.text()).toContain('Sign Up');
  });

  it('renders user details, admin badge and logout button when authenticated as admin', () => {
    const authStore = useAuthStore();
    authStore.setAuth(
      {
        id: 1,
        username: 'AdminCommander',
        email: 'admin@metagaming.com',
        role: 'admin',
        is_admin: true,
        created_at: new Date().toISOString()
      },
      'fake_admin_token'
    );

    const wrapper = mount(App, {
      global: {
        plugins: [router],
        stubs: {
          'router-view': true
        }
      }
    });

    expect(wrapper.text()).toContain('AdminCommander');
    expect(wrapper.text()).toContain('Admin');
    expect(wrapper.text()).toContain('Log Out');
    expect(wrapper.find('.btn-logout').exists()).toBe(true);
  });
});
