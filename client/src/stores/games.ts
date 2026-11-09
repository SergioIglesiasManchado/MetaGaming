import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Game, Review, CreateGamePayload, CreateReviewPayload } from '../types/game';
import { useAuthStore } from './auth';
import { apiBaseUrl, getApiUrl } from '../config/api';

export const useGamesStore = defineStore('games', () => {
  const games = ref<Game[]>([]);
  const currentGame = ref<Game | null>(null);
  const currentReviews = ref<Review[]>([]);
  const followedGames = ref<Game[]>([]);
  const isFollowingCurrentGame = ref<boolean>(false);
  const loading = ref<boolean>(false);
  const error = ref<string | null>(null);

  const fetchGames = async (search?: string): Promise<Game[]> => {
    loading.value = true;
    error.value = null;

    try {
      const url = getApiUrl('/api/v1/games');
      if (search && search.trim()) {
        url.searchParams.set('search', search.trim());
      }

      const res = await fetch(url.toString());
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch games');
      }

      games.value = data.data.games;
      return games.value;
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch games';
      return [];
    } finally {
      loading.value = false;
    }
  };

  const fetchGameById = async (id: number): Promise<Game | null> => {
    loading.value = true;
    error.value = null;

    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/games/${id}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch game details');
      }

      currentGame.value = data.data.game;
      return currentGame.value;
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch game details';
      return null;
    } finally {
      loading.value = false;
    }
  };

  const createGame = async (payload: CreateGamePayload): Promise<Game> => {
    const authStore = useAuthStore();
    loading.value = true;
    error.value = null;

    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/games`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authStore.token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to introduce new game');
      }

      const newGame = data.data.game;
      games.value.unshift(newGame);
      return newGame;
    } catch (err: any) {
      error.value = err.message || 'Failed to introduce new game';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const fetchReviews = async (gameId: number): Promise<Review[]> => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/games/${gameId}/reviews`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch reviews');
      }

      currentReviews.value = data.data.reviews;
      return currentReviews.value;
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch reviews';
      return [];
    }
  };

  const submitReview = async (
    gameId: number,
    payload: CreateReviewPayload
  ): Promise<{ review: Review; gameOverall: { average_rating: number; reviews_count: number } }> => {
    const authStore = useAuthStore();
    loading.value = true;
    error.value = null;

    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/games/${gameId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authStore.token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to post review');
      }

      // Update currentGame metrics if viewed
      if (currentGame.value && currentGame.value.id === gameId) {
        currentGame.value.average_rating = data.data.gameOverall.average_rating;
        currentGame.value.reviews_count = data.data.gameOverall.reviews_count;
      }

      // Refresh reviews list
      await fetchReviews(gameId);

      return data.data;
    } catch (err: any) {
      error.value = err.message || 'Failed to post review';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const uploadGameImage = async (file: File): Promise<string> => {
    const authStore = useAuthStore();
    const formData = new FormData();
    formData.append('image', file);

    const res = await fetch(`${apiBaseUrl}/api/v1/games/upload-image`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authStore.token}`
      },
      body: formData
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to upload image');
    }

    // Convert relative URL to full backend URL if necessary
    const url = data.data.url;
    return url.startsWith('http') ? url : `${apiBaseUrl}${url}`;
  };

  const checkFollowStatus = async (gameId: number): Promise<boolean> => {
    const authStore = useAuthStore();
    if (!authStore.isAuthenticated) {
      isFollowingCurrentGame.value = false;
      return false;
    }

    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/games/${gameId}/follow-status`, {
        headers: {
          Authorization: `Bearer ${authStore.token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        isFollowingCurrentGame.value = data.data.is_following;
      }
      return isFollowingCurrentGame.value;
    } catch {
      isFollowingCurrentGame.value = false;
      return false;
    }
  };

  const followGame = async (gameId: number): Promise<boolean> => {
    const authStore = useAuthStore();
    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/games/${gameId}/follow`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authStore.token}`
        }
      });
      if (res.ok) {
        isFollowingCurrentGame.value = true;
        await fetchFollowedGames();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const unfollowGame = async (gameId: number): Promise<boolean> => {
    const authStore = useAuthStore();
    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/games/${gameId}/follow`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authStore.token}`
        }
      });
      if (res.ok) {
        isFollowingCurrentGame.value = false;
        await fetchFollowedGames();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const fetchFollowedGames = async (): Promise<Game[]> => {
    const authStore = useAuthStore();
    if (!authStore.isAuthenticated) return [];

    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/games/followed`, {
        headers: {
          Authorization: `Bearer ${authStore.token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        followedGames.value = data.data.games;
        return followedGames.value;
      }
      return [];
    } catch {
      return [];
    }
  };

  return {
    games,
    currentGame,
    currentReviews,
    followedGames,
    isFollowingCurrentGame,
    loading,
    error,
    fetchGames,
    fetchGameById,
    createGame,
    fetchReviews,
    submitReview,
    uploadGameImage,
    checkFollowStatus,
    followGame,
    unfollowGame,
    fetchFollowedGames
  };
});
