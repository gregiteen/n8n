/**
 * User Store - Manages user authentication and session state
 * Integrates with AI Orchestrator API service
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';
import { apiService } from '@/lib/api-instance';

interface UserState {
	// State
	currentUser: User | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	error: string | null;

	// Actions
	setCurrentUser: (user: User | null) => void;
	setIsAuthenticated: (isAuthenticated: boolean) => void;
	setIsLoading: (isLoading: boolean) => void;
	setError: (error: string | null) => void;

	// Auth Operations
	login: (email: string, password: string) => Promise<void>;
	logout: () => Promise<void>;
	register: (userData: { email: string; password: string; name: string }) => Promise<void>;
	refreshToken: () => Promise<void>;
	getCurrentUser: () => Promise<void>;

	// User Operations
	updateProfile: (updates: Partial<User>) => Promise<void>;
	changePassword: (currentPassword: string, newPassword: string) => Promise<void>;

	// Utilities
	clearSession: () => void;
	initializeAuth: () => Promise<void>;
}

export const useUserStore = create<UserState>()(
	persist(
		(set, get) => ({
			// Initial state
			currentUser: null,
			isAuthenticated: false,
			isLoading: false,
			error: null,

			// Basic setters
			setCurrentUser: (user) => {
				set({
					currentUser: user,
					isAuthenticated: !!user,
				});
			},
			setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
			setIsLoading: (isLoading) => set({ isLoading }),
			setError: (error) => set({ error }),

			// Auth Operations
			login: async (email: string, password: string) => {
				const { setIsLoading, setError, setCurrentUser } = get();

				try {
					setIsLoading(true);
					setError(null);

					const { user, tokens } = await apiService.login(email, password);

					// Store token for future requests
					apiService.setAuthToken(tokens.accessToken);
					setCurrentUser(user);
				} catch (error) {
					console.error('Login failed:', error);
					setError(error instanceof Error ? error.message : 'Login failed');
					throw error;
				} finally {
					setIsLoading(false);
				}
			},

			logout: async () => {
				const { setIsLoading, setError, clearSession } = get();

				try {
					setIsLoading(true);
					setError(null);

					await apiService.logout();
					clearSession();
				} catch (error) {
					console.error('Logout failed:', error);
					// Still clear session even if API call fails
					clearSession();
				} finally {
					setIsLoading(false);
				}
			},

			register: async (userData: { email: string; password: string; name: string }) => {
				const { setIsLoading, setError, setCurrentUser } = get();

				try {
					setIsLoading(true);
					setError(null);

					const { user, tokens } = await apiService.register(
						userData.email,
						userData.password,
						userData.name,
					);

					// Store token for future requests
					apiService.setAuthToken(tokens.accessToken);
					setCurrentUser(user);
				} catch (error) {
					console.error('Registration failed:', error);
					setError(error instanceof Error ? error.message : 'Registration failed');
					throw error;
				} finally {
					setIsLoading(false);
				}
			},

			refreshToken: async () => {
				const { setError, clearSession } = get();

				try {
					const tokens = await apiService.users.refreshToken();
					apiService.setAuthToken(tokens.accessToken);
				} catch (error) {
					console.error('Token refresh failed:', error);
					setError('Session expired. Please log in again.');
					clearSession();
					throw error;
				}
			},

			getCurrentUser: async () => {
				const { setIsLoading, setError, setCurrentUser } = get();

				try {
					setIsLoading(true);
					setError(null);

					const user = await apiService.getCurrentUser();
					setCurrentUser(user);
				} catch (error) {
					console.error('Failed to get current user:', error);
					setError(error instanceof Error ? error.message : 'Failed to get user information');
					throw error;
				} finally {
					setIsLoading(false);
				}
			},

			// User Operations
			updateProfile: async (updates: Partial<User>) => {
				const { setError, currentUser, setCurrentUser } = get();

				if (!currentUser) {
					throw new Error('No user logged in');
				}

				try {
					setError(null);

					const updatedUser = await apiService.users.updateUser(updates);
					setCurrentUser(updatedUser);
				} catch (error) {
					console.error('Failed to update profile:', error);
					setError(error instanceof Error ? error.message : 'Failed to update profile');
					throw error;
				}
			},

			changePassword: async (currentPassword: string, newPassword: string) => {
				const { setError, currentUser } = get();

				if (!currentUser) {
					throw new Error('No user logged in');
				}

				try {
					setError(null);

					await apiService.users.changePassword(currentPassword, newPassword);
				} catch (error) {
					console.error('Failed to change password:', error);
					setError(error instanceof Error ? error.message : 'Failed to change password');
					throw error;
				}
			},

			// Utilities
			clearSession: () => {
				set({
					currentUser: null,
					isAuthenticated: false,
					error: null,
				});
				apiService.clearAuthToken();
			},

			initializeAuth: async () => {
				const { setIsLoading, getCurrentUser, refreshToken, clearSession } = get();

				try {
					setIsLoading(true);

					// Check if we have a stored token
					const hasToken = apiService.hasAuthToken();

					if (hasToken) {
						try {
							// Try to get current user with existing token
							await getCurrentUser();
						} catch (error) {
							// If getting user fails, try to refresh token
							try {
								await refreshToken();
								await getCurrentUser();
							} catch (refreshError) {
								// If refresh also fails, clear session
								console.warn('Auth initialization failed, clearing session');
								clearSession();
							}
						}
					}
				} catch (error) {
					console.error('Auth initialization error:', error);
				} finally {
					setIsLoading(false);
				}
			},
		}),
		{
			name: 'user-auth-storage', // unique name for localStorage key
			partialize: (state) => ({
				// Only persist certain parts of the state
				currentUser: state.currentUser,
				isAuthenticated: state.isAuthenticated,
			}),
		},
	),
);
