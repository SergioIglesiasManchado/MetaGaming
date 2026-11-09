<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useCommunityStore } from '../stores/community';
import { useAuthStore } from '../stores/auth';
import CommentItem from '../components/CommentItem.vue';

const route = useRoute();
const router = useRouter();
const communityStore = useCommunityStore();
const authStore = useAuthStore();

const gameId = computed(() => parseInt(route.params.id as string, 10));

const selectedPostId = ref<number | null>(null);
const showNewQuestionForm = ref(false);

// New question form state
const newQuestion = ref({
  title: '',
  content: ''
});
const isSubmittingQuestion = ref(false);
const questionError = ref<string | null>(null);

// Top-level answer form state
const topLevelAnswer = ref('');
const isSubmittingAnswer = ref(false);
const answerError = ref<string | null>(null);

onMounted(async () => {
  if (isNaN(gameId.value)) {
    router.push('/games');
    return;
  }

  const community = await communityStore.fetchCommunityByGameId(gameId.value);
  if (community) {
    await communityStore.fetchCommunityPosts(community.id);
  }
});

const formatDate = (isoString: string) => {
  const date = new Date(isoString);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const handleCreateQuestion = async () => {
  if (!communityStore.currentCommunity) return;

  questionError.value = null;
  if (!newQuestion.value.title.trim()) {
    questionError.value = 'Title is required';
    return;
  }
  if (!newQuestion.value.content.trim()) {
    questionError.value = 'Question details are required';
    return;
  }

  isSubmittingQuestion.value = true;
  try {
    const post = await communityStore.createPost(
      communityStore.currentCommunity.id,
      newQuestion.value.title.trim(),
      newQuestion.value.content.trim()
    );

    newQuestion.value.title = '';
    newQuestion.value.content = '';
    showNewQuestionForm.value = false;

    // Open newly created question
    await openPost(post.id);
  } catch (err: unknown) {
    questionError.value = err instanceof Error ? err.message : 'Error posting question';
  } finally {
    isSubmittingQuestion.value = false;
  }
};

const openPost = async (postId: number) => {
  selectedPostId.value = postId;
  topLevelAnswer.value = '';
  answerError.value = null;
  await communityStore.fetchPostWithComments(postId);
};

const closePost = async () => {
  selectedPostId.value = null;
  if (communityStore.currentCommunity) {
    await communityStore.fetchCommunityPosts(communityStore.currentCommunity.id);
  }
};

const submitTopLevelAnswer = async () => {
  if (!selectedPostId.value) return;

  answerError.value = null;
  if (!topLevelAnswer.value.trim()) {
    answerError.value = 'Answer cannot be empty';
    return;
  }

  isSubmittingAnswer.value = true;
  try {
    await communityStore.createComment(selectedPostId.value, topLevelAnswer.value.trim());
    topLevelAnswer.value = '';
  } catch (err: unknown) {
    answerError.value = err instanceof Error ? err.message : 'Error submitting answer';
  } finally {
    isSubmittingAnswer.value = false;
  }
};
</script>

<template>
  <div class="community-container">
    <!-- Back Navigation -->
    <div class="nav-breadcrumbs">
      <button class="btn-text-link" @click="router.push(`/games/${gameId}`)">
        ← Back to Game Details
      </button>
      <span class="breadcrumb-separator">/</span>
      <button class="btn-text-link" @click="router.push('/games')">
        Catalog
      </button>
    </div>

    <!-- Community Header Banner -->
    <div v-if="communityStore.currentCommunity" class="community-header card">
      <div class="header-left">
        <div class="game-thumb">
          <img
            v-if="communityStore.currentCommunity.game_photos && communityStore.currentCommunity.game_photos.length > 0"
            :src="communityStore.currentCommunity.game_photos[0]"
            :alt="communityStore.currentCommunity.name"
            @error="(e: Event) => ((e.target as HTMLImageElement).style.display = 'none')"
          />
          <span v-else class="thumb-placeholder">🎮</span>
        </div>
        <div class="header-details">
          <div class="badge-tag">GAME COMMUNITY</div>
          <h1>{{ communityStore.currentCommunity.name }} Hub</h1>
          <p class="community-desc">
            {{ communityStore.currentCommunity.description || 'Welcome to the dedicated community! Ask questions, share tips, and discuss with players.' }}
          </p>
        </div>
      </div>

      <div class="header-actions">
        <button
          v-if="!selectedPostId && authStore.isAuthenticated"
          class="btn btn-accent"
          @click="showNewQuestionForm = !showNewQuestionForm"
        >
          {{ showNewQuestionForm ? '✕ Close Form' : '✏️ Ask a Question' }}
        </button>
        <button
          v-else-if="!selectedPostId && !authStore.isAuthenticated"
          class="btn btn-secondary"
          @click="router.push('/login')"
        >
          Log in to Post
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="communityStore.loading && !communityStore.currentCommunity" class="loading-state card">
      Loading community...
    </div>

    <!-- Error State -->
    <div v-else-if="communityStore.error && !communityStore.currentCommunity" class="alert alert-danger">
      {{ communityStore.error }}
    </div>

    <!-- Main Content Area -->
    <div v-else class="community-content">
      <!-- 1. Threaded Discussion View (When a question/post is selected) -->
      <div v-if="selectedPostId && communityStore.currentPost" class="discussion-view">
        <div class="discussion-header-nav">
          <button class="btn-back-link" @click="closePost">
            ← Back to Questions
          </button>
        </div>

        <!-- Question Original Post -->
        <div class="question-main card">
          <div class="question-meta">
            <span class="author-badge">👤 {{ communityStore.currentPost.username }}</span>
            <span class="meta-date">{{ formatDate(communityStore.currentPost.created_at) }}</span>
          </div>

          <h2 class="question-title">{{ communityStore.currentPost.title }}</h2>
          <div class="question-body">{{ communityStore.currentPost.content }}</div>

          <div class="question-footer">
            <span class="answers-count">
              💬 {{ communityStore.currentComments.length }} {{ communityStore.currentComments.length === 1 ? 'answer / reply' : 'answers / replies' }}
            </span>
          </div>
        </div>

        <!-- Top-level Answer Form -->
        <div class="answer-box card">
          <h3>Post an Answer</h3>
          <div v-if="authStore.isAuthenticated">
            <div v-if="answerError" class="alert alert-danger">{{ answerError }}</div>
            <textarea
              v-model="topLevelAnswer"
              rows="3"
              placeholder="Write your answer or thoughts about this question..."
              class="answer-textarea"
            ></textarea>
            <div class="answer-actions">
              <button
                class="btn btn-accent"
                :disabled="isSubmittingAnswer || !topLevelAnswer.trim()"
                @click="submitTopLevelAnswer"
              >
                {{ isSubmittingAnswer ? 'Posting...' : 'Post Answer' }}
              </button>
            </div>
          </div>
          <div v-else class="login-prompt">
            <p>Please log in to answer this question or participate in the discussion.</p>
            <button class="btn btn-primary" @click="router.push('/login')">Log In to Answer</button>
          </div>
        </div>

        <!-- Threaded Comments Tree -->
        <div class="comments-section">
          <h3>Community Answers &amp; Discussion</h3>

          <div v-if="communityStore.currentComments.length === 0" class="empty-state card">
            <p>No answers yet. Be the first to answer this question!</p>
          </div>

          <div v-else class="comments-list">
            <CommentItem
              v-for="comment in communityStore.currentComments"
              :key="comment.id"
              :comment="comment"
              :post-id="selectedPostId"
            />
          </div>
        </div>
      </div>

      <!-- 2. Community Posts List View -->
      <div v-else class="posts-view">
        <!-- New Question Form -->
        <div v-if="showNewQuestionForm" class="new-question-box card">
          <div class="box-header">
            <h3>Ask a Question in {{ communityStore.currentCommunity?.name }}</h3>
            <p>Post your questions, guides, or topics to interact with fellow players.</p>
          </div>

          <div v-if="questionError" class="alert alert-danger">{{ questionError }}</div>

          <form class="question-form" @submit.prevent="handleCreateQuestion">
            <div class="form-group">
              <label for="q-title">Question / Topic Title</label>
              <input
                id="q-title"
                v-model="newQuestion.title"
                type="text"
                placeholder="e.g. How do I beat the boss in Area 3?"
                required
              />
            </div>

            <div class="form-group">
              <label for="q-content">Details / Explanation</label>
              <textarea
                id="q-content"
                v-model="newQuestion.content"
                rows="4"
                placeholder="Provide details about your question or context..."
                required
              ></textarea>
            </div>

            <div class="form-actions">
              <button
                type="button"
                class="btn btn-secondary"
                @click="showNewQuestionForm = false"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="btn btn-accent"
                :disabled="isSubmittingQuestion"
              >
                {{ isSubmittingQuestion ? 'Posting...' : 'Post Question' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Posts List -->
        <div class="posts-list-section">
          <div class="section-top">
            <h2>Community Questions &amp; Discussions</h2>
            <span class="count-tag">{{ communityStore.posts.length }} discussions</span>
          </div>

          <div v-if="communityStore.loading" class="loading-state card">
            Loading discussions...
          </div>

          <div v-else-if="communityStore.posts.length === 0" class="empty-state card">
            <h3>No questions yet</h3>
            <p>Nobody has asked a question in this community yet.</p>
            <button
              v-if="authStore.isAuthenticated"
              class="btn btn-accent btn-mt"
              @click="showNewQuestionForm = true"
            >
              Be the first to ask!
            </button>
          </div>

          <div v-else class="posts-grid">
            <div
              v-for="post in communityStore.posts"
              :key="post.id"
              class="post-card card"
              @click="openPost(post.id)"
            >
              <div class="post-card-header">
                <span class="post-author">👤 {{ post.username }}</span>
                <span class="post-date">{{ formatDate(post.created_at) }}</span>
              </div>

              <h3 class="post-title">{{ post.title }}</h3>
              <p class="post-preview">{{ post.content }}</p>

              <div class="post-card-footer">
                <span class="comments-badge">
                  💬 {{ post.comments_count }} {{ post.comments_count === 1 ? 'answer' : 'answers' }}
                </span>
                <span class="view-discussion-link">View Discussion &amp; Answers →</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.community-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 1.5rem 1rem 3rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

.nav-breadcrumbs {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.breadcrumb-separator {
  color: #64748b;
}

.btn-text-link {
  background: none;
  border: none;
  color: #c084fc;
  font-weight: 600;
  cursor: pointer;
  padding: 0.2rem 0;
  font-size: inherit;
  transition: color 0.2s;
}

.btn-text-link:hover {
  color: #a855f7;
  text-decoration: underline;
}

.card {
  background: rgba(15, 23, 42, 0.75);
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 12px;
  padding: 1.5rem;
  backdrop-filter: blur(12px);
}

/* Header */
.community-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1.5rem;
  border-left: 4px solid #8b5cf6;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.game-thumb {
  width: 72px;
  height: 72px;
  border-radius: 10px;
  overflow: hidden;
  background: #1e293b;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.game-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumb-placeholder {
  font-size: 2rem;
}

.badge-tag {
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  padding: 0.15rem 0.5rem;
  background: rgba(139, 92, 246, 0.2);
  color: #c084fc;
  border-radius: 4px;
  display: inline-block;
  margin-bottom: 0.3rem;
}

.header-details h1 {
  font-size: 1.75rem;
  font-weight: 800;
  color: #f8fafc;
  margin: 0 0 0.4rem 0;
}

.community-desc {
  color: #94a3b8;
  font-size: 0.95rem;
  margin: 0;
  line-height: 1.4;
}

.header-actions {
  flex-shrink: 0;
}

/* Discussion View */
.discussion-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.discussion-header-nav {
  display: flex;
}

.btn-back-link {
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(148, 163, 184, 0.2);
  color: #e2e8f0;
  padding: 0.6rem 1rem;
  min-height: 44px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-back-link:hover {
  background: rgba(139, 92, 246, 0.2);
  border-color: #8b5cf6;
  color: #c084fc;
}

.question-main {
  border-left: 4px solid #3b82f6;
}

.question-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.author-badge {
  font-weight: 700;
  color: #60a5fa;
  font-size: 0.9rem;
}

.meta-date {
  font-size: 0.8rem;
  color: #94a3b8;
}

.question-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #f8fafc;
  margin: 0 0 1rem 0;
}

.question-body {
  color: #e2e8f0;
  font-size: 1rem;
  line-height: 1.6;
  white-space: pre-wrap;
  margin-bottom: 1.25rem;
}

.question-footer {
  border-top: 1px solid rgba(148, 163, 184, 0.1);
  padding-top: 0.75rem;
}

.answers-count {
  font-size: 0.9rem;
  color: #94a3b8;
  font-weight: 600;
}

/* Answer box */
.answer-box h3 {
  margin: 0 0 0.75rem 0;
  color: #f8fafc;
  font-size: 1.15rem;
}

.answer-textarea {
  width: 100%;
  padding: 0.85rem 1rem;
  background: rgba(30, 41, 59, 0.7);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 8px;
  color: #fff;
  font-size: 0.95rem;
  font-family: inherit;
  resize: vertical;
  margin-bottom: 0.75rem;
}

.answer-textarea:focus {
  outline: none;
  border-color: #8b5cf6;
}

.answer-actions {
  display: flex;
  justify-content: flex-end;
}

.login-prompt {
  text-align: center;
  padding: 1rem;
  color: #94a3b8;
}

.login-prompt p {
  margin-bottom: 0.75rem;
}

/* Comments Section */
.comments-section h3 {
  color: #f8fafc;
  font-size: 1.25rem;
  margin: 0 0 1rem 0;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Posts View */
.posts-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.new-question-box {
  border-left: 4px solid #8b5cf6;
}

.box-header h3 {
  margin: 0 0 0.25rem 0;
  color: #f8fafc;
  font-size: 1.25rem;
}

.box-header p {
  margin: 0 0 1rem 0;
  color: #94a3b8;
  font-size: 0.9rem;
}

.question-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-group label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #cbd5e1;
}

.form-group input,
.form-group textarea {
  padding: 0.75rem 1rem;
  background: rgba(30, 41, 59, 0.7);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 8px;
  color: #fff;
  font-size: 0.95rem;
  font-family: inherit;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #8b5cf6;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.section-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
}

.section-top h2 {
  font-size: 1.35rem;
  color: #f8fafc;
  margin: 0;
}

.count-tag {
  background: rgba(139, 92, 246, 0.15);
  color: #c084fc;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 0.2rem 0.6rem;
  border-radius: 20px;
}

.posts-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.post-card {
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.post-card:hover {
  transform: translateY(-2px);
  border-color: rgba(139, 92, 246, 0.4);
}

.post-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.post-author {
  font-weight: 700;
  color: #60a5fa;
  font-size: 0.85rem;
}

.post-date {
  font-size: 0.8rem;
  color: #94a3b8;
}

.post-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: #f8fafc;
  margin: 0 0 0.5rem 0;
}

.post-preview {
  color: #94a3b8;
  font-size: 0.9rem;
  line-height: 1.4;
  margin: 0 0 1rem 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid rgba(148, 163, 184, 0.1);
  padding-top: 0.75rem;
}

.comments-badge {
  font-size: 0.85rem;
  color: #c084fc;
  font-weight: 600;
}

.view-discussion-link {
  font-size: 0.85rem;
  color: #38bdf8;
  font-weight: 600;
}

/* Common button styles */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.4rem;
  min-height: 44px;
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

.btn-accent:hover:not(:disabled) {
  background: #7c3aed;
}

.btn-secondary {
  background: transparent;
  border: 1px solid rgba(148, 163, 184, 0.3);
  color: #cbd5e1;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.05);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-mt {
  margin-top: 1rem;
}

.alert {
  padding: 0.85rem 1rem;
  border-radius: 8px;
  font-size: 0.95rem;
  margin-bottom: 1rem;
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

.loading-state {
  text-align: center;
  padding: 3rem;
  color: #94a3b8;
}

/* Mobile responsive */
@media (max-width: 640px) {
  .community-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;
  }

  .header-actions .btn {
    width: 100%;
  }

  .header-left {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .form-actions {
    flex-direction: column;
  }

  .form-actions .btn {
    width: 100%;
  }
}
</style>
