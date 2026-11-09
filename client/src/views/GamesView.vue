<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useGamesStore } from '../stores/games';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const gamesStore = useGamesStore();
const authStore = useAuthStore();

const searchQuery = ref('');
const isSubmittingGame = ref(false);
const gameFormSuccess = ref<string | null>(null);
const gameFormError = ref<string | null>(null);

// Admin new game form state
const newGame = ref({
  title: '',
  description: '',
  platformsInput: 'PC, PlayStation 5, Xbox Series X',
  photosInput: ''
});

onMounted(async () => {
  await gamesStore.fetchGames();
});

const handleSearch = async () => {
  await gamesStore.fetchGames(searchQuery.value);
};

const handleCreateGame = async () => {
  gameFormSuccess.value = null;
  gameFormError.value = null;

  const platforms = newGame.value.platformsInput
    .split(',')
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const photos = newGame.value.photosInput
    .split(/[\n,]/)
    .map((url) => url.trim())
    .filter((url) => url.length > 0);

  if (!newGame.value.title.trim()) {
    gameFormError.value = 'Title is required';
    return;
  }

  if (!newGame.value.description.trim()) {
    gameFormError.value = 'Description is required';
    return;
  }

  if (platforms.length === 0) {
    gameFormError.value = 'At least one platform is required';
    return;
  }

  isSubmittingGame.value = true;
  try {
    const created = await gamesStore.createGame({
      title: newGame.value.title.trim(),
      description: newGame.value.description.trim(),
      platforms,
      photos
    });

    gameFormSuccess.value = `"${created.title}" successfully added to the catalog!`;
    newGame.value.title = '';
    newGame.value.description = '';
    newGame.value.photosInput = '';
    await gamesStore.fetchGames();
  } catch (err: any) {
    gameFormError.value = err.message || 'Error creating game';
  } finally {
    isSubmittingGame.value = false;
  }
};

const navigateToDetail = (gameId: number) => {
  router.push(`/games/${gameId}`);
};
</script>

<template>
  <div class="games-container">
    <div class="header-section">
      <div class="header-content">
        <h1>Videogames & Reviews</h1>
        <p>Explore community-rated videogames, discover platforms, and read player reviews.</p>
      </div>

      <div class="search-bar">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search videogames by name..."
          class="search-input"
          @keyup.enter="handleSearch"
        />
        <button class="btn btn-primary" @click="handleSearch">Search</button>
      </div>
    </div>

    <!-- Admin Section: Add Game -->
    <div v-if="authStore.isAdmin" class="admin-game-box card">
      <div class="admin-header">
        <span class="admin-tag">ADMIN ACCESS</span>
        <h2>Add New Videogame</h2>
      </div>
      <p class="admin-desc">
        Introduce a new title into the platform with description, supported platforms, and screenshots.
      </p>

      <div v-if="gameFormSuccess" class="alert alert-success">{{ gameFormSuccess }}</div>
      <div v-if="gameFormError" class="alert alert-danger">{{ gameFormError }}</div>

      <form class="game-form" @submit.prevent="handleCreateGame">
        <div class="form-row">
          <div class="form-group flex-2">
            <label for="game-title">Game Title</label>
            <input
              id="game-title"
              v-model="newGame.title"
              type="text"
              placeholder="e.g. Elden Ring: Shadow of the Erdtree"
              required
            />
          </div>

          <div class="form-group flex-2">
            <label for="game-platforms">Platforms (comma separated)</label>
            <input
              id="game-platforms"
              v-model="newGame.platformsInput"
              type="text"
              placeholder="e.g. PC, PS5, Xbox Series X, Switch"
              required
            />
          </div>
        </div>

        <div class="form-group">
          <label for="game-desc">Description</label>
          <textarea
            id="game-desc"
            v-model="newGame.description"
            rows="3"
            placeholder="Detailed synopsis and overview of the game..."
            required
          ></textarea>
        </div>

        <div class="form-group">
          <label for="game-photos">Screenshots / Photos URLs (comma or newline separated)</label>
          <textarea
            id="game-photos"
            v-model="newGame.photosInput"
            rows="2"
            placeholder="https://example.com/screenshot1.jpg, https://example.com/screenshot2.jpg"
          ></textarea>
        </div>

        <button type="submit" class="btn btn-accent" :disabled="isSubmittingGame">
          {{ isSubmittingGame ? 'Adding Game...' : 'Add Videogame to Catalog' }}
        </button>
      </form>
    </div>

    <!-- Games Catalog Grid -->
    <div class="catalog-section">
      <div v-if="gamesStore.loading" class="loading-state">Loading videogames catalog...</div>
      <div v-else-if="gamesStore.error" class="alert alert-danger">{{ gamesStore.error }}</div>
      <div v-else-if="gamesStore.games.length === 0" class="empty-state card">
        <h3>No videogames found</h3>
        <p>No games matched your search criteria. Try a different search term.</p>
      </div>

      <div v-else class="games-grid">
        <div
          v-for="game in gamesStore.games"
          :key="game.id"
          class="game-card card"
          @click="navigateToDetail(game.id)"
        >
          <div class="game-thumbnail">
            <img
              v-if="game.photos && game.photos.length > 0"
              :src="game.photos[0]"
              :alt="game.title"
              class="thumbnail-img"
              loading="lazy"
              @error="(e: any) => e.target.style.display = 'none'"
            />
            <div class="thumbnail-placeholder">🎮</div>
            <div class="score-badge" :class="{ 'has-score': game.reviews_count > 0 }">
              <span class="star">★</span>
              <span class="note">{{ game.reviews_count > 0 ? game.average_rating.toFixed(1) : 'N/A' }}</span>
              <span class="scale">/10</span>
            </div>
          </div>

          <div class="game-info">
            <h3 class="game-title">{{ game.title }}</h3>
            <p class="game-desc-snippet">{{ game.description }}</p>

            <div class="platforms-wrap">
              <span v-for="plat in game.platforms" :key="plat" class="platform-chip">
                {{ plat }}
              </span>
            </div>

            <div class="card-footer">
              <span class="reviews-count">
                💬 {{ game.reviews_count }} {{ game.reviews_count === 1 ? 'review' : 'reviews' }}
              </span>
              <span class="view-link">View Reviews & Score →</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.games-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.header-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.header-content h1 {
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, #a855f7 0%, #3b82f6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.header-content p {
  color: #94a3b8;
  font-size: 1.1rem;
}

.search-bar {
  display: flex;
  gap: 0.75rem;
  max-width: 600px;
}

.search-input {
  flex: 1;
  padding: 0.85rem 1.2rem;
  background: rgba(30, 41, 59, 0.7);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 8px;
  color: #fff;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.25);
}

.card {
  background: rgba(15, 23, 42, 0.75);
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 12px;
  padding: 1.5rem;
  backdrop-filter: blur(12px);
}

.admin-game-box {
  border-left: 4px solid #8b5cf6;
}

.admin-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.25rem;
}

.admin-tag {
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  padding: 0.2rem 0.5rem;
  background: rgba(139, 92, 246, 0.2);
  color: #c084fc;
  border-radius: 4px;
}

.admin-desc {
  color: #94a3b8;
  font-size: 0.95rem;
  margin-bottom: 1.25rem;
}

.game-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-row {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.flex-2 {
  flex: 1;
  min-width: 280px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #cbd5e1;
}

.form-group input,
.form-group textarea {
  padding: 0.75rem 1rem;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 8px;
  color: #fff;
  font-size: 0.95rem;
  font-family: inherit;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #8b5cf6;
}

.games-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.game-card {
  cursor: pointer;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.game-card:hover {
  transform: translateY(-4px);
  border-color: rgba(139, 92, 246, 0.4);
  box-shadow: 0 12px 24px -10px rgba(139, 92, 246, 0.3);
}

.game-thumbnail {
  position: relative;
  height: 180px;
  background: #1e293b;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.thumbnail-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  position: absolute;
  top: 0;
  left: 0;
}

.thumbnail-placeholder {
  font-size: 3.5rem;
  opacity: 0.4;
}

.score-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  padding: 0.3rem 0.65rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-weight: 700;
  z-index: 2;
}

.score-badge.has-score .star {
  color: #fbbf24;
}

.score-badge.has-score .note {
  color: #f8fafc;
  font-size: 1.1rem;
}

.score-badge .scale {
  font-size: 0.75rem;
  color: #94a3b8;
}

.game-info {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.game-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #f8fafc;
  margin-bottom: 0.5rem;
}

.game-desc-snippet {
  color: #94a3b8;
  font-size: 0.9rem;
  line-height: 1.4;
  margin-bottom: 1rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.platforms-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 1.25rem;
}

.platform-chip {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.2rem 0.6rem;
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
  border-radius: 4px;
}

.card-footer {
  margin-top: auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid rgba(148, 163, 184, 0.1);
  padding-top: 0.75rem;
  font-size: 0.85rem;
}

.reviews-count {
  color: #94a3b8;
}

.view-link {
  color: #c084fc;
  font-weight: 600;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.4rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
}

.btn-primary {
  background: #3b82f6;
  color: #fff;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-accent {
  background: #8b5cf6;
  color: #fff;
}

.btn-accent:hover {
  background: #7c3aed;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.alert {
  padding: 0.85rem 1rem;
  border-radius: 8px;
  font-size: 0.95rem;
  margin-bottom: 1rem;
}

.alert-success {
  background: rgba(34, 197, 94, 0.15);
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: #4ade80;
}

.alert-danger {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #f87171;
}

.empty-state {
  text-align: center;
  padding: 3rem 1.5rem;
  color: #94a3b8;
}

.empty-state h3 {
  color: #f1f5f9;
  margin-bottom: 0.5rem;
}
</style>
