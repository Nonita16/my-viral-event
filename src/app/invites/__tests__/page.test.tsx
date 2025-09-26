/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Invites from "../page";
import { mockSupabase } from "@/test/mocks/supabaseMock";
import { mockResend } from "@/test/mocks/resendMock";

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

// Mock resend
vi.mock("@/lib/resend", () => ({
  default: mockResend,
}));

// Mock posthog
vi.mock("posthog-js", () => ({
  default: {
    capture: vi.fn(),
  },
}));

// Mock crypto
Object.defineProperty(window, "crypto", {
  value: {
    randomUUID: vi.fn(() => "mock-uuid"),
  },
});

// Mock navigator.clipboard
Object.defineProperty(navigator, "clipboard", {
  value: {
    writeText: vi.fn(),
  },
});

// Mock window.location
Object.defineProperty(window, "location", {
  value: {
    origin: "http://localhost:3000",
  },
});

describe("Invites Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders events and allows generating invites", async () => {
    const mockEvents = [
      {
        id: "event-1",
        name: "Test Event",
        date: "2023-12-01T10:00",
        description: "Desc",
        location: "Loc",
        user_id: "user-1",
        created_at: "2023-11-01",
      },
    ];
    const mockInvites = [
      {
        id: "invite-1",
        event_id: "event-1",
        referrer_id: "user-1",
        code: "abc123",
        email_sent: false,
        created_at: "2023-11-01",
      },
    ];

    (mockSupabase.from as any).mockImplementation((table: string) => {
      if (table === "events") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi
                .fn()
                .mockResolvedValue({ data: mockEvents, error: null }),
            }),
          }),
        };
      }
      if (table === "invites") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi
                .fn()
                .mockResolvedValue({ data: mockInvites, error: null }),
            }),
          }),
        };
      }
    });

    render(<Invites />);

    await waitFor(() => {
      expect(screen.getByText("Test Event")).toBeInTheDocument();
    });

    expect(screen.getByText("Generate Invite Code")).toBeInTheDocument();
  });

  it("generates invite code successfully", async () => {
    const user = userEvent.setup();
    const mockEvents = [
      {
        id: "event-1",
        name: "Test Event",
        date: "2023-12-01T10:00",
        description: "Desc",
        location: "Loc",
        user_id: "user-1",
        created_at: "2023-11-01",
      },
    ];

    (mockSupabase.from as any).mockImplementation((table: string) => {
      if (table === "events") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi
                .fn()
                .mockResolvedValue({ data: mockEvents, error: null }),
            }),
          }),
        };
      }
      if (table === "invites") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
      }
    });

    render(<Invites />);

    const generateButton = screen.getByText("Generate Invite Code");
    await user.click(generateButton);

    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalledWith("invites");
      expect(mockSupabase.from().insert).toHaveBeenCalledWith({
        event_id: "event-1",
        referrer_id: "user-1",
        code: "mock-uuid".substring(0, 8),
        email_sent: false,
      });
    });
  });

  it("copies link to clipboard", async () => {
    const user = userEvent.setup();
    const mockEvents = [
      {
        id: "event-1",
        name: "Test Event",
        date: "2023-12-01T10:00",
        description: "Desc",
        location: "Loc",
        user_id: "user-1",
        created_at: "2023-11-01",
      },
    ];
    const mockInvites = [
      {
        id: "invite-1",
        event_id: "event-1",
        referrer_id: "user-1",
        code: "abc123",
        email_sent: false,
        created_at: "2023-11-01",
      },
    ];

    (mockSupabase.from as any).mockImplementation((table: string) => {
      if (table === "events") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi
                .fn()
                .mockResolvedValue({ data: mockEvents, error: null }),
            }),
          }),
        };
      }
      if (table === "invites") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi
                .fn()
                .mockResolvedValue({ data: mockInvites, error: null }),
            }),
          }),
        };
      }
    });

    render(<Invites />);

    await waitFor(() => {
      expect(screen.getByText("Copy Link")).toBeInTheDocument();
    });

    const copyButton = screen.getByText("Copy Link");
    await user.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      "http://localhost:3000/event/event-1?ref=abc123"
    );
  });

  it("sends email successfully", async () => {
    const user = userEvent.setup();
    const mockEvents = [
      {
        id: "event-1",
        name: "Test Event",
        date: "2023-12-01T10:00",
        description: "Desc",
        location: "Loc",
        user_id: "user-1",
        created_at: "2023-11-01",
      },
    ];
    const mockInvites = [
      {
        id: "invite-1",
        event_id: "event-1",
        referrer_id: "user-1",
        code: "abc123",
        email_sent: false,
        created_at: "2023-11-01",
      },
    ];

    (mockSupabase.from as any).mockImplementation((table: string) => {
      if (table === "events") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi
                .fn()
                .mockResolvedValue({ data: mockEvents, error: null }),
            }),
          }),
        };
      }
      if (table === "invites") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi
                .fn()
                .mockResolvedValue({ data: mockInvites, error: null }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      }
    });

    mockResend.emails.send.mockResolvedValue({ id: "email-id" });

    render(<Invites />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
    });

    const emailInput = screen.getByPlaceholderText("Email");
    const sendButton = screen.getByText("Send Email");

    await user.type(emailInput, "recipient@example.com");
    await user.click(sendButton);

    await waitFor(() => {
      expect(mockResend.emails.send).toHaveBeenCalledWith({
        from: "noreply@yourdomain.com",
        to: "recipient@example.com",
        subject: "You're invited to Test Event",
        html: expect.stringContaining(
          "http://localhost:3000/event/event-1?ref=abc123"
        ),
      });
    });
  });
});
