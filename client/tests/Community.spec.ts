import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import CommunityView from '../src/views/CommunityView.vue';
import CommentItem from '../src/components/CommentItem.vue';
import { useAuthStore } from '../src/stores/auth';
import { useCommunityStore } from '../src/stores/community';
import type { CommunityComment } from '../src/types/community';

describe('Community Components Battery', () => {
  let router: any;

  beforeEach(() => {
    setActivePinia(createPinia());
    router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/games/:id/community', component: CommunityView },
        { path: '/games/:id', component: { template: '<div>Game</div>' } },
        { path: '/games', component: { template: '<div>Games</div>' } },
        { path: '/login', component: { template: '<div>Login</div>' } }
      ]
    });
  });

  describe('CommentItem Recursive Component', () => {
    it('renders comment content, author, and nested replies recursively', () => {
      const authStore = useAuthStore();
      authStore.setAuth(
        { id: 1, username: 'tester', email: 'tester@test.com', role: 'user', created_at: '2026-01-01' },
        'dummy_token'
      );

      const mockComment: CommunityComment = {
        id: 10,
        post_id: 1,
        user_id: 2,
        username: 'expert_gamer',
        parent_comment_id: null,
        content: 'You should explore the dungeon first.',
        created_at: '2026-01-01T12:00:00Z',
        updated_at: '2026-01-01T12:00:00Z',
        replies: [
          {
            id: 11,
            post_id: 1,
            user_id: 1,
            username: 'tester',
            parent_comment_id: 10,
            content: 'Which key unlocks the dungeon door?',
            created_at: '2026-01-01T12:30:00Z',
            updated_at: '2026-01-01T12:30:00Z',
            replies: []
          }
        ]
      };

      const wrapper = mount(CommentItem, {
        props: {
          comment: mockComment,
          postId: 1,
          depth: 0
        }
      });

      expect(wrapper.text()).toContain('expert_gamer');
      expect(wrapper.text()).toContain('You should explore the dungeon first.');
      expect(wrapper.text()).toContain('tester');
      expect(wrapper.text()).toContain('Which key unlocks the dungeon door?');
      expect(wrapper.find('.nested-thread').exists()).toBe(true);
    });

    it('toggles reply form on button click for authenticated user', async () => {
      const authStore = useAuthStore();
      authStore.setAuth(
        { id: 1, username: 'tester', email: 'tester@test.com', role: 'user', created_at: '2026-01-01' },
        'dummy_token'
      );

      const mockComment: CommunityComment = {
        id: 10,
        post_id: 1,
        user_id: 2,
        username: 'expert_gamer',
        parent_comment_id: null,
        content: 'Top comment',
        created_at: '2026-01-01T12:00:00Z',
        updated_at: '2026-01-01T12:00:00Z',
        replies: []
      };

      const wrapper = mount(CommentItem, {
        props: {
          comment: mockComment,
          postId: 1,
          depth: 0
        }
      });

      expect(wrapper.find('.reply-form').exists()).toBe(false);
      await wrapper.find('.btn-reply').trigger('click');
      expect(wrapper.find('.reply-form').exists()).toBe(true);
    });
  });

  describe('CommunityView Hub', () => {
    it('renders community banner, description, and list of questions', async () => {
      const communityStore = useCommunityStore();
      communityStore.currentCommunity = {
        id: 1,
        game_id: 42,
        name: 'Elden Ring',
        description: 'The official Elden Ring community hub',
        created_at: '2026-01-01',
        updated_at: '2026-01-01'
      };

      communityStore.posts = [
        {
          id: 101,
          community_id: 1,
          user_id: 5,
          username: 'tarnished_99',
          title: 'How to defeat Margit?',
          content: 'He keeps delaying his attacks!',
          created_at: '2026-01-01',
          updated_at: '2026-01-01',
          comments_count: 3
        }
      ];

      router.push('/games/42/community');
      await router.isReady();

      const wrapper = mount(CommunityView, {
        global: {
          plugins: [router]
        }
      });

      expect(wrapper.text()).toContain('Elden Ring Hub');
      expect(wrapper.text()).toContain('The official Elden Ring community hub');
      expect(wrapper.text()).toContain('How to defeat Margit?');
      expect(wrapper.text()).toContain('tarnished_99');
      expect(wrapper.text()).toContain('3 answers');
    });
  });
});
