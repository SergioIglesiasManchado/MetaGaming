<script setup lang="ts">
import { ref } from 'vue';
import type { CommunityComment } from '../types/community';
import { useAuthStore } from '../stores/auth';
import { useCommunityStore } from '../stores/community';

interface Props {
  comment: CommunityComment;
  postId: number;
  depth?: number;
}

const props = withDefaults(defineProps<Props>(), {
  depth: 0
});

const authStore = useAuthStore();
const communityStore = useCommunityStore();

const isReplying = ref(false);
const replyContent = ref('');
const isSubmitting = ref(false);
const replyError = ref<string | null>(null);

const formatDate = (isoString: string) => {
  const date = new Date(isoString);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const handleToggleReply = () => {
  isReplying.value = !isReplying.value;
  replyContent.value = '';
  replyError.value = null;
};

const submitReply = async () => {
  if (!replyContent.value.trim()) {
    replyError.value = 'Reply cannot be empty';
    return;
  }

  isSubmitting.value = true;
  replyError.value = null;

  try {
    await communityStore.createComment(props.postId, replyContent.value.trim(), props.comment.id);
    replyContent.value = '';
    isReplying.value = false;
  } catch (err: unknown) {
    replyError.value = err instanceof Error ? err.message : 'Error posting reply';
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div class="comment-thread" :class="{ 'nested-thread': depth > 0 }">
    <div class="comment-card">
      <div class="comment-header">
        <span class="comment-author">👤 {{ comment.username }}</span>
        <span class="comment-date">{{ formatDate(comment.created_at) }}</span>
      </div>

      <p class="comment-content">{{ comment.content }}</p>

      <div class="comment-actions">
        <button
          v-if="authStore.isAuthenticated"
          class="btn-reply"
          @click="handleToggleReply"
        >
          💬 {{ isReplying ? 'Cancel' : 'Reply' }}
        </button>
      </div>

      <!-- Inline reply form -->
      <div v-if="isReplying" class="reply-form">
        <textarea
          v-model="replyContent"
          rows="2"
          placeholder="Write your reply to this answer..."
          class="reply-textarea"
        ></textarea>
        <div v-if="replyError" class="reply-error">{{ replyError }}</div>
        <div class="reply-buttons">
          <button
            class="btn btn-secondary"
            :disabled="isSubmitting"
            @click="handleToggleReply"
          >
            Cancel
          </button>
          <button
            class="btn btn-primary"
            :disabled="isSubmitting || !replyContent.trim()"
            @click="submitReply"
          >
            {{ isSubmitting ? 'Replying...' : 'Submit Reply' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Recursive nested replies -->
    <div v-if="comment.replies && comment.replies.length > 0" class="replies-container">
      <CommentItem
        v-for="reply in comment.replies"
        :key="reply.id"
        :comment="reply"
        :post-id="postId"
        :depth="depth + 1"
      />
    </div>
  </div>
</template>

<style scoped>
.comment-thread {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 0.75rem;
}

.nested-thread {
  margin-left: 1.5rem;
  padding-left: 1rem;
  border-left: 2px solid rgba(139, 92, 246, 0.3);
}

.comment-card {
  background: rgba(30, 41, 59, 0.65);
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 8px;
  padding: 1rem 1.25rem;
}

.comment-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.comment-author {
  font-weight: 700;
  color: #c084fc;
  font-size: 0.95rem;
}

.comment-date {
  font-size: 0.8rem;
  color: #94a3b8;
}

.comment-content {
  color: #e2e8f0;
  font-size: 0.95rem;
  line-height: 1.5;
  margin: 0 0 0.75rem 0;
  white-space: pre-wrap;
}

.comment-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-reply {
  background: transparent;
  border: 1px solid rgba(148, 163, 184, 0.25);
  color: #94a3b8;
  padding: 0.3rem 0.75rem;
  min-height: 36px;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-reply:hover {
  background: rgba(139, 92, 246, 0.15);
  border-color: #8b5cf6;
  color: #c084fc;
}

.reply-form {
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background: rgba(15, 23, 42, 0.6);
  padding: 0.75rem;
  border-radius: 6px;
  border: 1px solid rgba(139, 92, 246, 0.2);
}

.reply-textarea {
  width: 100%;
  padding: 0.6rem 0.8rem;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 6px;
  color: #fff;
  font-size: 0.9rem;
  font-family: inherit;
  resize: vertical;
}

.reply-textarea:focus {
  outline: none;
  border-color: #8b5cf6;
}

.reply-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.reply-error {
  color: #f87171;
  font-size: 0.85rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.4rem 0.9rem;
  min-height: 38px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn-primary {
  background: #8b5cf6;
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  background: #7c3aed;
}

.btn-secondary {
  background: transparent;
  border: 1px solid rgba(148, 163, 184, 0.2);
  color: #94a3b8;
}

.btn-secondary:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.05);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.replies-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

@media (max-width: 640px) {
  .nested-thread {
    margin-left: 0.75rem;
    padding-left: 0.5rem;
  }
}
</style>
