/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import Events from "../page";
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

describe("Events Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading when auth is loading", () => {
    vi.mocked(vi.importMock("@/contexts/AuthContext")).useAuth.mockReturnValue({
      user: null,
      loading: true,
    });

    render(<Events />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders login message when not authenticated", () => {
    vi.mocked(vi.importMock("@/contexts/AuthContext")).useAuth.mockReturnValue({
      user: null,
      loading: false,
    });

    render(<Events />);
    expect(
      screen.getByText("Please log in to create and view events.")
    ).toBeInTheDocument();
  });

  it("renders event creation form and fetches events", async () => {
    const mockEvents = [
      {
        id: "1",
        name: "Test Event",
        date: "2023-12-01T10:00",
        description: "Desc",
        location: "Location",
        user_id: "user-1",
        created_at: "2023-11-01",
      },
    ];

    (mockSupabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockEvents, error: null }),
        }),
      }),
    });

    render(<Events />);

    await waitFor(() => {
      expect(screen.getByText("Events")).toBeInTheDocument();
    });

    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Date")).toBeInTheDocument();
    expect(screen.getByLabelText("Description")).toBeInTheDocument();
    expect(screen.getByLabelText("Location")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create event/i })
    ).toBeInTheDocument();
  });

  it("submits event creation form successfully", async () => {
    const user = userEvent.setup();

    (mockSupabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
      insert: vi.fn().mockResolvedValue({ error: null }),
    });

    render(<Events />);

    const nameInput = screen.getByLabelText("Name");
    const dateInput = screen.getByLabelText("Date");
    const descriptionInput = screen.getByLabelText("Description");
    const locationInput = screen.getByLabelText("Location");
    const submitButton = screen.getByRole("button", { name: /create event/i });

    await user.type(nameInput, "New Event");
    await user.type(dateInput, "2023-12-01T10:00");
    await user.type(descriptionInput, "Event Description");
    await user.type(locationInput, "Event Location");
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalledWith("events");
      expect(mockSupabase.from().insert).toHaveBeenCalledWith({
        name: "New Event",
        date: "2023-12-01T10:00",
        description: "Event Description",
        location: "Event Location",
        user_id: "user-1",
      });
    });
  });

  it("displays events list", async () => {
    const mockEvents = [
      {
        id: "1",
        name: "Event 1",
        date: "2023-12-01T10:00",
        description: "Desc 1",
        location: "Loc 1",
        user_id: "user-1",
        created_at: "2023-11-01",
      },
      {
        id: "2",
        name: "Event 2",
        date: "2023-12-02T11:00",
        description: "Desc 2",
        location: "Loc 2",
        user_id: "user-1",
        created_at: "2023-11-02",
      },
    ];

    (mockSupabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockEvents, error: null }),
        }),
      }),
    });

    render(<Events />);

    await waitFor(() => {
      expect(screen.getByText("Event 1")).toBeInTheDocument();
      expect(screen.getByText("Event 2")).toBeInTheDocument();
    });
  });
});
