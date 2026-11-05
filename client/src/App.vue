<script setup lang="ts">
import { ref } from 'vue';

const appName = ref('MetaGaming');
const tagLine = ref('Connect, play, chat, and share your gaming journey');

const features = ref([
  { id: 1, title: 'Gamer Profiles', description: 'Showcase played titles and playtime statistics' },
  { id: 2, title: 'Direct & Group Chat', description: 'Chat with friends and coordinate gaming sessions' },
  { id: 3, title: 'Game Communities', description: 'Reddit-style hubs with guides, screenshots, and comments' },
  { id: 4, title: 'Game Collections', description: 'Curate and discover custom & official game lists' }
]);
</script>

<template>
  <main class="app-container">
    <header class="hero">
      <h1 class="title">🎮 {{ appName }}</h1>
      <p class="tagline">{{ tagLine }}</p>
    </header>

    <section class="features">
      <h2>Core Features</h2>
      <div class="cards-grid">
        <article v-for="item in features" :key="item.id" class="card">
          <h3>{{ item.title }}</h3>
          <p>{{ item.description }}</p>
        </article>
      </div>
    </section>
  </main>
</template>

<style scoped>
.app-container {
  max-width: 960px;
  margin: 0 auto;
  padding: 2rem;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  color: #2c3e50;
}

.hero {
  text-align: center;
  margin-bottom: 3rem;
}

.title {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  color: #4f46e5;
}

.tagline {
  font-size: 1.2rem;
  color: #64748b;
}

.features h2 {
  font-size: 1.75rem;
  margin-bottom: 1.5rem;
  text-align: center;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
}

.card {
  padding: 1.5rem;
  border-radius: 8px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.card h3 {
  margin-top: 0;
  margin-bottom: 0.5rem;
  font-size: 1.15rem;
  color: #1e293b;
}

.card p {
  margin: 0;
  color: #64748b;
  font-size: 0.95rem;
}
</style>
