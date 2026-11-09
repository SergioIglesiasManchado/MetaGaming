import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import CommunityView from '../src/views/CommunityView.vue';
import CommentItem from '../src/components/CommentItem.vue';
import { useAuthStore } from '../src/stores/auth';
import { useCommunityStore } from '../src/stores/community';
import type { CommunityComment } from '../src/types/community';

describe('Community Frontend Component Battery (Normal, Edge & Error Cases)', () => {
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

  describe('1. CommentItem Component', () => {
    it('normal case: renders author, date, comment content and multi-level nested replies', () => {
      const authStore = useAuthStore();
      authStore.setAuth(
        { id: 1, username: 'tester', email: 'tester@test.com', role: 'user', is_admin: false, created_at: '2026-01-01' },
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
            replies: [
              {
                id: 12,
                post_id: 1,
                user_id: 3,
                username: 'third_player',
                parent_comment_id: 11,
                content: 'The copper key from the merchant!',
                created_at: '2026-01-01T12:45:00Z',
                updated_at: '2026-01-01T12:45:00Z',
                replies: []
              }
            ]
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
      expect(wrapper.text()).toContain('third_player');
      expect(wrapper.text()).toContain('The copper key from the merchant!');
      expect(wrapper.findAll('.nested-thread').length).toBe(2);
    });

    it('normal case: opens inline reply box when clicking Reply', async () => {
      const authStore = useAuthStore();
      authStore.setAuth(
        { id: 1, username: 'tester', email: 'tester@test.com', role: 'user', is_admin: false, created_at: '2026-01-01' },
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
      expect(wrapper.find('.reply-textarea').exists()).toBe(true);
    });

    it('error case: shows error message when trying to submit empty reply', async () => {
      const authStore = useAuthStore();
      authStore.setAuth(
        { id: 1, username: 'tester', email: 'tester@test.com', role: 'user', is_admin: false, created_at: '2026-01-01' },
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

      await wrapper.find('.btn-reply').trigger('click');
      // Click submit with empty textarea
      await wrapper.find('.reply-buttons .btn-primary').trigger('click');
      expect(wrapper.find('.reply-error').exists()).toBe(true);
      expect(wrapper.find('.reply-error').text()).toContain('Reply cannot be empty');
    });

    it('edge case: unauthenticated user does not see Reply button', () => {
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

      expect(wrapper.find('.btn-reply').exists()).toBe(false);
    });
  });

  describe('2. CommunityView Hub View', () => {
    it('normal case: displays community header, metadata, and questions list', async () => {
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

    it('normal case: clicking on a question card navigates into the discussion view', async () => {
      const communityStore = useCommunityStore();
      communityStore.currentCommunity = {
        id: 1,
        game_id: 42,
        name: 'Elden Ring',
        description: 'Hub',
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
          comments_count: 1
        }
      ];

      communityStore.currentPost = communityStore.posts[0];
      communityStore.currentComments = [
        {
          id: 50,
          post_id: 101,
          user_id: 8,
          username: 'veteran_player',
          parent_comment_id: null,
          content: 'Use the shack shackle item on him.',
          created_at: '2026-01-01',
          updated_at: '2026-01-01',
          replies: []
        }
      ];

      router.push('/games/42/community');
      await router.isReady();

      const wrapper = mount(CommunityView, {
        global: {
          plugins: [router]
        }
      });

      // Click on question card to open discussion
      await wrapper.find('.post-card').trigger('click');

      expect(wrapper.find('.discussion-view').exists()).toBe(true);
      expect(wrapper.find('.question-title').text()).toBe('How to defeat Margit?');
      expect(wrapper.text()).toContain('veteran_player');
      expect(wrapper.text()).toContain('Use the shack shackle item on him.');
    });

    it('edge case: shows login prompt in discussion view for unauthenticated visitors', async () => {
      const communityStore = useCommunityStore();
      communityStore.currentCommunity = {
        id: 1,
        game_id: 42,
        name: 'Elden Ring',
        description: 'Hub',
        created_at: '2026-01-01',
        updated_at: '2026-01-01'
      };

      communityStore.currentPost = {
        id: 101,
        community_id: 1,
        user_id: 5,
        username: 'tarnished_99',
        title: 'Question for all',
        content: 'Test content',
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
        comments_count: 0
      };
      communityStore.posts = [communityStore.currentPost];
      communityStore.currentComments = [];

      router.push('/games/42/community');
      await router.isReady();

      const wrapper = mount(CommunityView, {
        global: {
          plugins: [router]
        }
      });

      // Force discussion view active
      await wrapper.find('.post-card').trigger('click');

      expect(wrapper.find('.login-prompt').exists()).toBe(true);
      expect(wrapper.text()).toContain('Please log in to answer this question');
    });

    it('edge case: empty questions state displays call to action', async () => {
      const authStore = useAuthStore();
      authStore.setAuth(
        { id: 1, username: 'tester', email: 'tester@test.com', role: 'user', is_admin: false, created_at: '2026-01-01' },
        'dummy_token'
      );

      const communityStore = useCommunityStore();
      communityStore.currentCommunity = {
        id: 1,
        game_id: 42,
        name: 'Empty Game',
        description: 'No questions yet',
        created_at: '2026-01-01',
        updated_at: '2026-01-01'
      };
      communityStore.posts = [];

      router.push('/games/42/community');
      await router.isReady();

      const wrapper = mount(CommunityView, {
        global: {
          plugins: [router]
        }
      });

      expect(wrapper.text()).toContain('No questions yet');
      expect(wrapper.text()).toContain('Be the first to ask!');
    });
  });
});
