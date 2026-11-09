<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useGamesStore } from '../stores/games';
import { useAuthStore } from '../stores/auth';

const route = useRoute();
const router = useRouter();
const gamesStore = useGamesStore();
const authStore = useAuthStore();

const gameId = computed(() => parseInt(route.params.id as string, 10));

const reviewRating = ref<number>(8.0);
const reviewComment = ref<string>('');
const isSubmittingReview = ref(false);
const isTogglingFollow = ref(false);
const reviewSuccess = ref<string | null>(null);
const reviewError = ref<string | null>(null);

const userExistingReview = computed(() => {
  if (!authStore.user) return null;
  return gamesStore.currentReviews.find((r) => r.user_id === authStore.user?.id) || null;
});

// Watch for existing review to prefill form
watch(
  userExistingReview,
  (existing) => {
    if (existing) {
      reviewRating.value = existing.rating;
      reviewComment.value = existing.comment;
    }
  },
  { immediate: true }
);

onMounted(async () => {
  if (isNaN(gameId.value)) {
    router.push('/games');
    return;
  }
  await gamesStore.fetchGameById(gameId.value);
  await gamesStore.fetchReviews(gameId.value);
  if (authStore.isAuthenticated) {
    await gamesStore.checkFollowStatus(gameId.value);
  }
});

const handleToggleFollow = async () => {
  if (!authStore.isAuthenticated) {
    router.push('/login');
    return;
  }

  isTogglingFollow.value = true;
  try {
    if (gamesStore.isFollowingCurrentGame) {
      await gamesStore.unfollowGame(gameId.value);
    } else {
      await gamesStore.followGame(gameId.value);
    }
  } finally {
    isTogglingFollow.value = false;
  }
};

const handleSubmitReview = async () => {
  reviewSuccess.value = null;
  reviewError.value = null;

  if (reviewRating.value < 0 || reviewRating.value > 10) {
    reviewError.value = 'Rating must be between 0 and 10';
    return;
  }

  if (!reviewComment.value.trim()) {
    reviewError.value = 'Please provide a comment for your review';
    return;
  }

  isSubmittingReview.value = true;
  try {
    await gamesStore.submitReview(gameId.value, {
      rating: Number(reviewRating.value),
      comment: reviewComment.value.trim()
    });

    reviewSuccess.value = userExistingReview.value
      ? 'Your review has been updated and the overall score recalculated!'
      : 'Your review has been posted and the overall score has been updated!';
  } catch (err: any) {
    reviewError.value = err.message || 'Error submitting review';
  } finally {
    isSubmittingReview.value = false;
  }
};

const formatDate = (isoStr: string) => {
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return isoStr;
  }
};
</script>

<template>
  <div class="detail-container">
    <div class="back-nav">
      <router-link to="/games" class="back-link">← Back to Videogames</router-link>
    </div>

    <div v-if="gamesStore.loading && !gamesStore.currentGame" class="loading-state">
      Loading videogame details...
    </div>

    <div v-else-if="!gamesStore.currentGame" class="alert alert-danger">
      Videogame not found or failed to load.
    </div>

    <div v-else class="content-wrapper">
      <!-- Game Header & Overview -->
      <div class="game-header-card card">
        <div class="game-meta">
          <div class="title-follow-bar">
            <h1 class="game-title">{{ gamesStore.currentGame.title }}</h1>
            <div class="header-btns">
              <button
                class="btn-community-nav"
                @click="router.push(`/games/${gameId}/community`)"
              >
                👥 Community Hub
              </button>
              <button
                class="btn-follow"
                :class="{ following: gamesStore.isFollowingCurrentGame }"
                :disabled="isTogglingFollow"
                @click="handleToggleFollow"
              >
                <span class="icon">{{ gamesStore.isFollowingCurrentGame ? '★' : '☆' }}</span>
                <span>{{ gamesStore.isFollowingCurrentGame ? 'Following' : 'Follow Game' }}</span>
              </button>
            </div>
          </div>

          <div class="platforms-list">
            <span v-for="plat in gamesStore.currentGame.platforms" :key="plat" class="platform-chip">
              {{ plat }}
            </span>
          </div>

          <p class="game-description">{{ gamesStore.currentGame.description }}</p>
        </div>

        <!-- Overall Score Card -->
        <div class="score-card">
          <span class="score-title">Overall Score</span>
          <div class="score-display">
            <span class="score-number">
              {{
                gamesStore.currentGame.reviews_count > 0
                  ? gamesStore.currentGame.average_rating.toFixed(1)
                  : 'N/A'
              }}
            </span>
            <span class="score-total">/10</span>
          </div>
          <div class="score-stars">
            <span class="stars-icon">★</span>
            <span class="reviews-count-badge">
              Based on {{ gamesStore.currentGame.reviews_count }}
              {{ gamesStore.currentGame.reviews_count === 1 ? 'player review' : 'player reviews' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Screenshots Gallery -->
      <div v-if="gamesStore.currentGame.photos && gamesStore.currentGame.photos.length > 0" class="gallery-section card">
        <h2>Screenshots & Media</h2>
        <div class="photos-grid">
          <div v-for="(photo, index) in gamesStore.currentGame.photos" :key="index" class="photo-item">
            <img :src="photo" :alt="`${gamesStore.currentGame.title} screenshot ${index + 1}`" loading="lazy" />
          </div>
        </div>
      </div>

      <!-- Reviews Section -->
      <div class="reviews-layout">
        <!-- Post / Update Review Form -->
        <div class="post-review-box card">
          <div class="review-box-header">
            <h3>{{ userExistingReview ? 'Update Your Review' : 'Leave a Review' }}</h3>
            <span v-if="userExistingReview" class="existing-pill">Review Already Submitted</span>
          </div>
          <p class="section-subtext">
            {{
              userExistingReview
                ? 'Modify your rating or feedback. The overall game score will instantly recalculate.'
                : 'Share your rating and thoughts. Every review directly updates the overall game score.'
            }}
          </p>

          <div v-if="!authStore.isAuthenticated" class="auth-prompt">
            <p>You must be signed in to post or update a review.</p>
            <router-link to="/login" class="btn btn-primary">Sign In to Review</router-link>
          </div>

          <form v-else class="review-form" @submit.prevent="handleSubmitReview">
            <div v-if="reviewSuccess" class="alert alert-success">{{ reviewSuccess }}</div>
            <div v-if="reviewError" class="alert alert-danger">{{ reviewError }}</div>

            <div class="form-group">
              <label for="rating-input">
                Rating (0 to 10 scale):
                <span class="rating-badge-preview">{{ reviewRating }} / 10</span>
              </label>
              <div class="rating-controls">
                <input
                  id="rating-input"
                  v-model.number="reviewRating"
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  class="rating-slider"
                />
                <input
                  v-model.number="reviewRating"
                  type="number"
                  min="0"
                  max="10"
                  step="0.5"
                  class="rating-num-input"
                />
              </div>
            </div>

            <div class="form-group">
              <label for="review-comment">Your Review / Thoughts</label>
              <textarea
                id="review-comment"
                v-model="reviewComment"
                rows="4"
                placeholder="What did you think of the gameplay, story, performance, or graphics?"
                required
              ></textarea>
            </div>

            <button type="submit" class="btn btn-accent" :disabled="isSubmittingReview">
              {{ isSubmittingReview ? 'Saving...' : userExistingReview ? 'Update Review' : 'Post Public Review' }}
            </button>
          </form>
        </div>

        <!-- Community Reviews List -->
        <div class="community-reviews-box card">
          <div class="reviews-header">
            <h3>Player Reviews</h3>
            <span class="badge">{{ gamesStore.currentReviews.length }}</span>
          </div>

          <div v-if="gamesStore.currentReviews.length === 0" class="no-reviews">
            <p>No reviews yet for this videogame.</p>
            <p class="callout">Be the first player to review and score this title!</p>
          </div>

          <div v-else class="reviews-feed">
            <div
              v-for="rev in gamesStore.currentReviews"
              :key="rev.id"
              class="review-card"
              :class="{ 'user-own-review': authStore.user && rev.user_id === authStore.user.id }"
            >
              <div class="review-top">
                <div class="user-meta">
                  <span class="user-avatar">{{ rev.username.charAt(0).toUpperCase() }}</span>
                  <div class="user-info">
                    <span class="reviewer-name">
                      {{ rev.username }}
                      <span v-if="authStore.user && rev.user_id === authStore.user.id" class="you-tag">You</span>
                    </span>
                    <span class="review-date">{{ formatDate(rev.created_at) }}</span>
                  </div>
                </div>

                <div class="user-rating-badge">
                  <span class="star">★</span>
                  <span class="val">{{ rev.rating.toFixed(1) }}</span>
                  <span class="max">/10</span>
                </div>
              </div>

              <p class="review-body">{{ rev.comment }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.detail-container {
  max-width: 1100px;
  width: 100%;
  margin: 0 auto;
  padding: 2rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
  box-sizing: border-box;
}

.back-link {
  color: #94a3b8;
  text-decoration: none;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  transition: color 0.2s;
  font-size: 0.95rem;
}

.back-link:hover {
  color: #c084fc;
}

.content-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

.card {
  background: rgba(15, 23, 42, 0.75);
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 12px;
  padding: 1.75rem;
  backdrop-filter: blur(12px);
}

.game-header-card {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
  flex-wrap: wrap;
}

.game-meta {
  flex: 2;
  min-width: 280px;
}

.title-follow-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.game-title {
  font-size: 2.2rem;
  font-weight: 800;
  color: #f8fafc;
  line-height: 1.2;
}

.header-btns {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.btn-community-nav {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid rgba(59, 130, 246, 0.4);
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
  transition: all 0.2s ease;
  min-height: 40px;
}

.btn-community-nav:hover {
  background: rgba(59, 130, 246, 0.3);
  border-color: #3b82f6;
  color: #93c5fd;
  transform: translateY(-1px);
}

.btn-follow {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid rgba(139, 92, 246, 0.4);
  background: rgba(139, 92, 246, 0.15);
  color: #c084fc;
  transition: all 0.2s ease;
  min-height: 40px;
}

.btn-follow:hover {
  background: rgba(139, 92, 246, 0.3);
  transform: translateY(-1px);
}

.btn-follow.following {
  background: rgba(251, 191, 36, 0.2);
  border-color: rgba(251, 191, 36, 0.5);
  color: #fbbf24;
}

.btn-follow .icon {
  font-size: 1.1rem;
}

.platforms-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
}

.platform-chip {
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.25rem 0.75rem;
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
  border-radius: 6px;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.game-description {
  color: #cbd5e1;
  font-size: 1.05rem;
  line-height: 1.6;
}

.score-card {
  flex: 1;
  min-width: 220px;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.score-title {
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #94a3b8;
  margin-bottom: 0.5rem;
}

.score-display {
  display: flex;
  align-items: baseline;
  gap: 0.2rem;
  margin-bottom: 0.25rem;
}

.score-number {
  font-size: 3.5rem;
  font-weight: 900;
  color: #fbbf24;
  line-height: 1;
}

.score-total {
  font-size: 1.25rem;
  font-weight: 700;
  color: #94a3b8;
}

.score-stars {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.stars-icon {
  color: #fbbf24;
  font-size: 1.1rem;
}

.reviews-count-badge {
  font-size: 0.85rem;
  color: #cbd5e1;
}

.gallery-section h2 {
  font-size: 1.3rem;
  font-weight: 700;
  color: #f8fafc;
  margin-bottom: 1rem;
}

.photos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
}

.photo-item {
  height: 180px;
  border-radius: 8px;
  overflow: hidden;
  background: #1e293b;
}

.photo-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.reviews-layout {
  display: grid;
  grid-template-columns: 1fr 1.3fr;
  gap: 1.75rem;
}

@media (max-width: 860px) {
  .reviews-layout {
    grid-template-columns: 1fr;
  }
}

.review-box-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.existing-pill {
  font-size: 0.75rem;
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-weight: 700;
}

.section-subtext {
  color: #94a3b8;
  font-size: 0.9rem;
  margin-top: 0.25rem;
  margin-bottom: 1.25rem;
}

.auth-prompt {
  background: rgba(30, 41, 59, 0.5);
  border: 1px dashed rgba(148, 163, 184, 0.2);
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
}

.auth-prompt p {
  color: #cbd5e1;
  margin-bottom: 1rem;
}

.review-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
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
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.rating-badge-preview {
  font-size: 0.95rem;
  font-weight: 700;
  color: #fbbf24;
}

.rating-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.rating-slider {
  flex: 1;
  accent-color: #8b5cf6;
  cursor: pointer;
}

.rating-num-input {
  width: 70px;
  padding: 0.5rem;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 6px;
  color: #fff;
  font-size: 1rem;
  text-align: center;
}

.form-group textarea {
  padding: 0.85rem 1rem;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 8px;
  color: #fff;
  font-family: inherit;
  font-size: 0.95rem;
}

.form-group textarea:focus {
  outline: none;
  border-color: #8b5cf6;
}

.reviews-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.reviews-header h3 {
  font-size: 1.3rem;
  color: #f8fafc;
}

.badge {
  background: rgba(139, 92, 246, 0.2);
  color: #c084fc;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 700;
}

.no-reviews {
  text-align: center;
  padding: 2.5rem 1rem;
  color: #94a3b8;
}

.no-reviews .callout {
  color: #c084fc;
  margin-top: 0.5rem;
  font-weight: 600;
}

.reviews-feed {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.review-card {
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 8px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.review-card.user-own-review {
  border-left: 3px solid #8b5cf6;
  background: rgba(139, 92, 246, 0.08);
}

.review-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: #fff;
  font-size: 0.95rem;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.reviewer-name {
  font-weight: 600;
  color: #f1f5f9;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.you-tag {
  font-size: 0.7rem;
  background: rgba(139, 92, 246, 0.25);
  color: #c084fc;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
}

.review-date {
  font-size: 0.75rem;
  color: #94a3b8;
}

.user-rating-badge {
  background: rgba(251, 191, 36, 0.15);
  border: 1px solid rgba(251, 191, 36, 0.3);
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 0.2rem;
  font-weight: 700;
}

.user-rating-badge .star {
  color: #fbbf24;
}

.user-rating-badge .val {
  color: #fef08a;
  font-size: 1rem;
}

.user-rating-badge .max {
  font-size: 0.75rem;
  color: #94a3b8;
}

.review-body {
  color: #cbd5e1;
  font-size: 0.95rem;
  line-height: 1.5;
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
  text-decoration: none;
  min-height: 44px;
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

@media (max-width: 640px) {
  .game-title {
    font-size: 1.75rem;
  }
  .score-card {
    width: 100%;
  }
}
</style>
