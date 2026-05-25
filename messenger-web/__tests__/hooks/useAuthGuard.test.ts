import { renderHook, act } from '@testing-library/react';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('useAuthGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset auth store before each test
    act(() => {
      useAuthStore.setState({
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
      });
      // Force persist to look unhydrated initially (if possible) or we just rely on the test flow
    });
  });

  it('should redirect to /login if user is not authenticated and hydration finishes', () => {
    // Act
    const { result } = renderHook(() => useAuthGuard());

    // Trigger hydration finish (simulating Zustand persist onFinishHydration)
    act(() => {
      // @ts-ignore - accessing internal persist API for tests
      useAuthStore.persist.rehydrate();
    });

    // Assert
    expect(result.current.isReady).toBe(false);
    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('should return isReady=true and user if authenticated and hydrated', () => {
    // Arrange
    const mockUser = {
      id: 'user-1',
      firstName: 'Alice',
      lastName: 'Smith',
      pseudo: 'alice',
      email: 'alice@test.com',
      publicKey: 'key'
    };

    act(() => {
      useAuthStore.setState({
        user: mockUser,
        token: 'token',
        refreshToken: 'refresh',
        isAuthenticated: true,
      });
      // Force hydrated state
      // @ts-ignore
      useAuthStore.persist.rehydrate();
    });

    // Act
    const { result } = renderHook(() => useAuthGuard());

    // Assert
    expect(result.current.isReady).toBe(true);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);
    expect(mockPush).not.toHaveBeenCalled();
  });
});
