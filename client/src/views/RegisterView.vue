<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const username = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const role = ref<'user' | 'admin'>('user');
const localError = ref<string | null>(null);

const handleRegister = async () => {
  localError.value = null;

  if (password.value !== confirmPassword.value) {
    localError.value = 'Passwords do not match';
    return;
  }

  if (password.value.length < 8) {
    localError.value = 'Password must be at least 8 characters long';
    return;
  }

  const success = await authStore.register(
    username.value,
    email.value,
    password.value,
    role.value
  );

  if (success) {
    router.push('/dashboard');
  }
};
</script>

<template>
  <div class="auth-card">
    <h2>Create Your Account</h2>
    <p class="subtitle">Join the MetaGaming network and share your achievements</p>

    <div v-if="localError || authStore.error" class="alert-error" role="alert">
      {{ localError || authStore.error }}
    </div>

    <form @submit.prevent="handleRegister" class="auth-form">
      <div class="form-group">
        <label for="reg-username">Username</label>
        <input
          id="reg-username"
          v-model="username"
          type="text"
          placeholder="e.g. PixelWarrior"
          required
          minlength="3"
        />
      </div>

      <div class="form-group">
        <label for="reg-email">Email</label>
        <input
          id="reg-email"
          v-model="email"
          type="email"
          placeholder="pixel@example.com"
          required
        />
      </div>

      <div class="form-group">
        <label for="reg-password">Password (min 8 chars)</label>
        <input
          id="reg-password"
          v-model="password"
          type="password"
          placeholder="••••••••"
          required
          minlength="8"
        />
      </div>

      <div class="form-group">
        <label for="reg-confirm">Confirm Password</label>
        <input
          id="reg-confirm"
          v-model="confirmPassword"
          type="password"
          placeholder="••••••••"
          required
          minlength="8"
        />
      </div>

      <div class="form-group role-selector">
        <label for="reg-role">Account Type</label>
        <select id="reg-role" v-model="role">
          <option value="user">Gamer (Standard)</option>
          <option value="admin">Platform Administrator</option>
        </select>
        <span class="role-hint" v-if="role === 'admin'">
          🛡️ Admin account will gain access to administrative dashboards and official collections.
        </span>
      </div>

      <button type="submit" class="btn-primary" :disabled="authStore.loading">
        <span v-if="authStore.loading">Creating Account...</span>
        <span v-else>Register</span>
      </button>
    </form>

    <div class="auth-footer">
      <p>Already have an account? <router-link to="/login">Log in here</router-link></p>
    </div>
  </div>
</template>

<style scoped>
.auth-card {
  max-width: 480px;
  margin: 2rem auto;
  padding: 2.5rem;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  border: 1px solid #e2e8f0;
}

h2 {
  margin: 0 0 0.5rem 0;
  color: #1e293b;
  font-size: 1.6rem;
  text-align: center;
}

.subtitle {
  color: #64748b;
  text-align: center;
  margin-bottom: 1.8rem;
  font-size: 0.95rem;
}

.alert-error {
  background: #fee2e2;
  color: #b91c1c;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  margin-bottom: 1.25rem;
  font-size: 0.9rem;
  border: 1px solid #fca5a5;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #334155;
}

input, select {
  padding: 0.75rem 1rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

input:focus, select:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

.role-hint {
  font-size: 0.8rem;
  color: #4338ca;
  margin-top: 0.25rem;
}

.btn-primary {
  margin-top: 0.5rem;
  padding: 0.85rem;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
}

.btn-primary:hover:not(:disabled) {
  background: #4338ca;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.auth-footer {
  margin-top: 1.5rem;
  text-align: center;
  font-size: 0.9rem;
  color: #64748b;
}

.auth-footer a {
  color: #4f46e5;
  text-decoration: none;
  font-weight: 600;
}

.auth-footer a:hover {
  text-decoration: underline;
}
</style>
