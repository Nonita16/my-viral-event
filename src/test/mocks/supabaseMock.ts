import { vi } from "vitest";

export const mockSupabase = {
  auth: {
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    })),
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(() => ({
          single: vi.fn(),
        })),
        not: vi.fn(() => ({
          is: vi.fn(() => ({
            head: vi.fn(),
          })),
        })),
      })),
      order: vi.fn(() => ({
        single: vi.fn(),
      })),
    })),
    insert: vi.fn(),
    update: vi.fn(() => ({
      eq: vi.fn(),
    })),
  })),
};

export const createClient = vi.fn(() => mockSupabase);
