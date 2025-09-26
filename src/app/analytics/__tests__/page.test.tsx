/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import Analytics from "../page";
import { mockSupabase } from "@/test/mocks/supabaseMock";

// Mock the useAuth hook
const mockUser = { id: "user-1", email: "test@example.com" };
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: mockUser,
    loading: false,
  }),
}));

// Mock @supabase/supabase-js
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => mockSupabase,
}));

// Mock posthog
vi.mock("posthog-js", () => ({
  default: {
    capture: vi.fn(),
  },
}));

// Mock recharts
vi.mock("recharts", () => ({
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
}));

describe("Analytics Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches and displays analytics data", async () => {
    const mockInvites = [
      { id: "invite-1", code: "abc123", email_sent: true },
      { id: "invite-2", code: "def456", email_sent: false },
    ];

    (mockSupabase.from as any).mockImplementation((table: string) => {
      if (table === "invites") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: mockInvites, error: null }),
          }),
        };
      }
      if (table === "referrals") {
        return {
          select: vi.fn().mockImplementation((columns: string) => {
            if (columns === "session_id") {
              return {
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    not: vi.fn().mockReturnValue({
                      is: vi.fn().mockReturnValue({
                        head: vi
                          .fn()
                          .mockResolvedValue({ count: 2, error: null }),
                      }),
                    }),
                  }),
                }),
              };
            }
            return {
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ count: 1, error: null }),
              }),
            };
          }),
        };
      }
    });

    render(<Analytics />);

    await waitFor(() => {
      expect(screen.getByText("Analytics Dashboard")).toBeInTheDocument();
    });

    expect(screen.getByText("Total Invites Sent")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument(); // totalInvitesSent
    expect(screen.getByText("Total Unique Clicks")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument(); // totalClicks
    expect(screen.getByText("Total Signups")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument(); // totalSignups
    expect(screen.getByText("Total RSVPs")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument(); // totalRsvps
  });

  it("displays invite code performance table", async () => {
    const mockInvites = [{ id: "invite-1", code: "abc123", email_sent: true }];

    (mockSupabase.from as any).mockImplementation((table: string) => {
      if (table === "invites") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: mockInvites, error: null }),
          }),
        };
      }
      if (table === "referrals") {
        return {
          select: vi.fn().mockImplementation((columns: string) => {
            if (columns === "session_id") {
              return {
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    not: vi.fn().mockReturnValue({
                      is: vi.fn().mockReturnValue({
                        head: vi
                          .fn()
                          .mockResolvedValue({ count: 1, error: null }),
                      }),
                    }),
                  }),
                }),
              };
            }
            return {
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ count: 1, error: null }),
              }),
            };
          }),
        };
      }
    });

    render(<Analytics />);

    await waitFor(() => {
      expect(screen.getByText("abc123")).toBeInTheDocument();
      expect(screen.getByText("1")).toBeInTheDocument(); // clicks
      expect(screen.getByText("1")).toBeInTheDocument(); // signups
      expect(screen.getByText("1")).toBeInTheDocument(); // rsvps
    });
  });

  it("renders chart component", async () => {
    const mockInvites = [{ id: "invite-1", code: "abc123", email_sent: true }];

    (mockSupabase.from as any).mockImplementation((table: string) => {
      if (table === "invites") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: mockInvites, error: null }),
          }),
        };
      }
      if (table === "referrals") {
        return {
          select: vi.fn().mockResolvedValue({ count: 0, error: null }),
        };
      }
    });

    render(<Analytics />);

    await waitFor(() => {
      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
      expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
    });
  });
});
