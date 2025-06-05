import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface User {
	id: string;
	name: string;
	email: string;
	role: string;
	status: 'active' | 'inactive' | 'pending';
	lastLogin?: string;
	createdAt: string;
	permissions: string[];
}

export interface UserFilters {
	search?: string;
	role?: string;
	status?: string;
}

export interface UserStats {
	total: number;
	active: number;
	inactive: number;
	pending: number;
	byRole: {
		admin: number;
		user: number;
		viewer: number;
	};
	recentSignups: number;
}

// Mock API functions
const fetchUsers = async (filters?: UserFilters): Promise<User[]> => {
	// Simulate API delay
	await new Promise((resolve) => setTimeout(resolve, 500));

	// Mock data
	const mockUsers: User[] = [
		{
			id: '1',
			name: 'Admin User',
			email: 'admin@example.com',
			role: 'admin',
			status: 'active',
			lastLogin: '2024-01-15T10:30:00Z',
			createdAt: '2024-01-01T00:00:00Z',
			permissions: ['users:read', 'users:write', 'system:admin'],
		},
		{
			id: '2',
			name: 'John Doe',
			email: 'john@example.com',
			role: 'user',
			status: 'active',
			lastLogin: '2024-01-15T09:15:00Z',
			createdAt: '2024-01-05T00:00:00Z',
			permissions: ['workflows:read', 'workflows:write'],
		},
		{
			id: '3',
			name: 'Jane Smith',
			email: 'jane@example.com',
			role: 'user',
			status: 'active',
			lastLogin: '2024-01-14T16:45:00Z',
			createdAt: '2024-01-10T00:00:00Z',
			permissions: ['workflows:read', 'workflows:write'],
		},
		{
			id: '4',
			name: 'Bob Wilson',
			email: 'bob@example.com',
			role: 'viewer',
			status: 'inactive',
			lastLogin: '2024-01-10T14:20:00Z',
			createdAt: '2024-01-12T00:00:00Z',
			permissions: ['workflows:read'],
		},
		{
			id: '5',
			name: 'Alice Johnson',
			email: 'alice@example.com',
			role: 'user',
			status: 'pending',
			createdAt: '2024-01-14T00:00:00Z',
			permissions: ['workflows:read', 'workflows:write'],
		},
	];

	// Apply filters
	let filteredUsers = mockUsers;

	if (filters?.search) {
		const search = filters.search.toLowerCase();
		filteredUsers = filteredUsers.filter(
			(user) =>
				user.name.toLowerCase().includes(search) || user.email.toLowerCase().includes(search),
		);
	}

	if (filters?.role) {
		filteredUsers = filteredUsers.filter((user) => user.role === filters.role);
	}

	if (filters?.status) {
		filteredUsers = filteredUsers.filter((user) => user.status === filters.status);
	}

	return filteredUsers;
};

const fetchUserStats = async (): Promise<UserStats> => {
	// Simulate API delay
	await new Promise((resolve) => setTimeout(resolve, 300));

	return {
		total: 25,
		active: 18,
		inactive: 5,
		pending: 2,
		byRole: {
			admin: 3,
			user: 20,
			viewer: 2,
		},
		recentSignups: 4,
	};
};

const updateUserStatus = async (userId: string, status: string): Promise<void> => {
	// Simulate API delay
	await new Promise((resolve) => setTimeout(resolve, 1000));
	console.log(`Updated user ${userId} status to ${status}`);
};

const deleteUser = async (userId: string): Promise<void> => {
	// Simulate API delay
	await new Promise((resolve) => setTimeout(resolve, 1000));
	console.log(`Deleted user ${userId}`);
};

const inviteUser = async (email: string, role: string): Promise<void> => {
	// Simulate API delay
	await new Promise((resolve) => setTimeout(resolve, 1000));
	console.log(`Invited user ${email} with role ${role}`);
};

// React Query hooks
export const useUsers = (filters?: UserFilters) => {
	return useQuery({
		queryKey: ['users', filters],
		queryFn: async () => await fetchUsers(filters),
		staleTime: 1000 * 60 * 5, // 5 minutes
	});
};

export const useUserStats = () => {
	return useQuery({
		queryKey: ['user-stats'],
		queryFn: fetchUserStats,
		staleTime: 1000 * 60 * 5, // 5 minutes
	});
};

export const useUpdateUserStatus = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ userId, status }: { userId: string; status: string }) =>
			await updateUserStatus(userId, status),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['users'] });
			queryClient.invalidateQueries({ queryKey: ['user-stats'] });
		},
	});
};

export const useDeleteUser = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: deleteUser,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['users'] });
			queryClient.invalidateQueries({ queryKey: ['user-stats'] });
		},
	});
};

export const useInviteUser = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ email, role }: { email: string; role: string }) =>
			await inviteUser(email, role),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['users'] });
			queryClient.invalidateQueries({ queryKey: ['user-stats'] });
		},
	});
};
