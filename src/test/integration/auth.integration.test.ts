/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { mockSupabase } from "@/test/mocks/supabaseMock";
import { mockPosthog } from "@/test/mocks/posthogMock";

// Mock @supabase/supabase-js
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => mockSupabase,
}));

// Mock posthog
vi.mock("posthog-js", () => ({
  default: mockPosthog,
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("Auth Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("signs up a user successfully", async () => {
    const mockUser = { id: "user-123", email: "test@example.com" };
    const mockSession = { user: mockUser };

    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: mockUser, session: mockSession },
      error: null,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await result.current.signUp("test@example.com", "password123");

    await waitFor(() => {
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });
  });

  it("signs in a user successfully", async () => {
    const mockUser = { id: "user-123", email: "test@example.com" };
    const mockSession = { user: mockUser };

    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: mockUser, session: mockSession },
      error: null,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await result.current.signIn("test@example.com", "password123");

    await waitFor(() => {
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });
  });

  it("tracks referral on sign in", async () => {
    const mockUser = { id: "user-123", email: "test@example.com" };
    const mockSession = { user: mockUser };

    localStorageMock.getItem.mockReturnValue("ref123");

    (mockSupabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: "invite-1" },
            error: null,
          }),
        }),
      }),
      insert: vi.fn().mockResolvedValue({ error: null }),
    });

    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: mockUser, session: mockSession },
      error: null,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await result.current.signIn("test@example.com", "password123");

    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalledWith("invites");
      expect(mockSupabase.from().select).toHaveBeenCalled();
      expect(mockSupabase.from().insert).toHaveBeenCalledWith({
        invite_id: "invite-1",
        action_type: "signup",
        user_id: "user-123",
        session_id: expect.any(String),
      });
    });
  });
});
