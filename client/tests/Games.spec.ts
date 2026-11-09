import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import GamesView from '../src/views/GamesView.vue';
import GameDetailView from '../src/views/GameDetailView.vue';
import { useAuthStore } from '../src/stores/auth';
import { useGamesStore } from '../src/stores/games';
import { router } from '../src/router/index';

describe('Videogames & Reviews Frontend Components', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.restoreAllMocks();
  });

  describe('GamesView', () => {
    it('renders games catalog header and search input', () => {
      const wrapper = mount(GamesView, {
        global: {
          plugins: [router]
        }
      });

      expect(wrapper.text()).toContain('Videogames & Reviews');
      expect(wrapper.find('input.search-input').exists()).toBe(true);
      expect(wrapper.find('button.btn-primary').text()).toContain('Search');
    });

    it('does not display the admin "Add New Videogame" section for regular users', () => {
      const authStore = useAuthStore();
      authStore.setAuth(
        {
          id: 10,
          username: 'StandardGamer',
          email: 'standard@example.com',
          role: 'user',
          is_admin: false,
          created_at: '2026-01-01'
        },
        'token_user'
      );

      const wrapper = mount(GamesView, {
        global: {
          plugins: [router]
        }
      });

      expect(wrapper.text()).not.toContain('Add New Videogame');
      expect(wrapper.find('.admin-game-box').exists()).toBe(false);
    });

    it('displays the admin "Add New Videogame" section with required inputs for administrators', () => {
      const authStore = useAuthStore();
      authStore.setAuth(
        {
          id: 1,
          username: 'AdminLeader',
          email: 'admin@metagaming.com',
          role: 'admin',
          is_admin: true,
          created_at: '2026-01-01'
        },
        'token_admin'
      );

      const wrapper = mount(GamesView, {
        global: {
          plugins: [router]
        }
      });

      expect(wrapper.text()).toContain('Add New Videogame');
      expect(wrapper.find('.admin-game-box').exists()).toBe(true);
      expect(wrapper.find('input#game-title').exists()).toBe(true);
      expect(wrapper.find('input#game-platforms').exists()).toBe(true);
      expect(wrapper.find('textarea#game-desc').exists()).toBe(true);
      expect(wrapper.find('.upload-drop-zone').exists()).toBe(true);
    });

    it('renders list of games with overall note badges and platform tags', () => {
      const gamesStore = useGamesStore();
      gamesStore.games = [
        {
          id: 101,
          title: 'Cyber Odyssey 2077',
          description: 'A futuristic cybernetic RPG adventure.',
          platforms: ['PC', 'PlayStation 5'],
          photos: ['https://images.unsplash.com/cyber.jpg'],
          average_rating: 8.8,
          reviews_count: 5,
          created_at: '2026-01-01',
          updated_at: '2026-01-01'
        }
      ];

      const wrapper = mount(GamesView, {
        global: {
          plugins: [router]
        }
      });

      expect(wrapper.text()).toContain('Cyber Odyssey 2077');
      expect(wrapper.text()).toContain('PC');
      expect(wrapper.text()).toContain('PlayStation 5');
      expect(wrapper.text()).toContain('8.8');
      expect(wrapper.text()).toContain('5 reviews');
    });
  });

  describe('GameDetailView', () => {
    const mockGame = {
      id: 202,
      title: 'Galactic Horizon',
      description: 'An open-galaxy space exploration simulation.',
      platforms: ['PC', 'Xbox Series X'],
      photos: ['https://images.unsplash.com/galaxy1.jpg', 'https://images.unsplash.com/galaxy2.jpg'],
      average_rating: 9.3,
      reviews_count: 3,
      created_at: '2026-01-01',
      updated_at: '2026-01-01'
    };

    const mockReviews = [
      {
        id: 1,
        game_id: 202,
        user_id: 10,
        username: 'CommanderShepard',
        rating: 9.5,
        comment: 'Unbelievable scale and stellar visual presentation.',
        created_at: '2026-01-02T12:00:00Z',
        updated_at: '2026-01-02T12:00:00Z'
      }
    ];

    it('renders game details, screenshots, overall note, and prompt for unauthenticated users', async () => {
      const gamesStore = useGamesStore();
      gamesStore.currentGame = mockGame;
      gamesStore.currentReviews = mockReviews;

      // Unauthenticated state
      const wrapper = mount(GameDetailView, {
        global: {
          plugins: [router]
        }
      });

      expect(wrapper.text()).toContain('Galactic Horizon');
      expect(wrapper.text()).toContain('An open-galaxy space exploration simulation.');
      expect(wrapper.text()).toContain('9.3');
      expect(wrapper.text()).toContain('Based on 3 player reviews');
      expect(wrapper.text()).toContain('Sign In to Review');
      expect(wrapper.find('form.review-form').exists()).toBe(false);

      // Verify review rendered
      expect(wrapper.text()).toContain('CommanderShepard');
      expect(wrapper.text()).toContain('9.5');
      expect(wrapper.text()).toContain('Unbelievable scale and stellar visual presentation.');
    });

    it('displays review submission form with 0-10 rating slider and comment box for logged-in users', async () => {
      const authStore = useAuthStore();
      authStore.setAuth(
        {
          id: 5,
          username: 'StarPilot',
          email: 'star@pilot.com',
          role: 'user',
          is_admin: false,
          created_at: '2026-01-01'
        },
        'user_token'
      );

      const gamesStore = useGamesStore();
      gamesStore.currentGame = mockGame;
      gamesStore.currentReviews = mockReviews;

      const wrapper = mount(GameDetailView, {
        global: {
          plugins: [router]
        }
      });

      expect(wrapper.find('form.review-form').exists()).toBe(true);
      expect(wrapper.find('input#rating-input').exists()).toBe(true);
      expect(wrapper.find('textarea#review-comment').exists()).toBe(true);
      expect(wrapper.find('button.btn-accent').text()).toContain('Post Public Review');
    });
  });
});
