import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import Auth from "../page";

// Mock the useAuth hook
const mockSignIn = vi.fn();
const mockSignUp = vi.fn();
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    signIn: mockSignIn,
    signUp: mockSignUp,
  }),
}));

// Mock Next.js router
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock posthog
vi.mock("posthog-js", () => ({
  default: {
    capture: vi.fn(),
  },
}));

describe("Auth Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders sign in form by default", () => {
    render(<Auth />);

    expect(screen.getByText("Sign in to your account")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in/i })
    ).toBeInTheDocument();
    expect(screen.getByText("Need an account? Sign up")).toBeInTheDocument();
  });

  it("switches to sign up form when toggled", async () => {
    const user = userEvent.setup();
    render(<Auth />);

    const toggleButton = screen.getByText("Need an account? Sign up");
    await user.click(toggleButton);

    expect(screen.getByText("Create your account")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign up/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Already have an account? Sign in")
    ).toBeInTheDocument();
  });

  it("calls signIn on form submission for sign in", async () => {
    const user = userEvent.setup();
    render(<Auth />);

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith(
        "test@example.com",
        "password123"
      );
    });
    expect(mockPush).toHaveBeenCalledWith("/");
  });

  it("calls signUp on form submission for sign up", async () => {
    const user = userEvent.setup();
    render(<Auth />);

    // Switch to sign up
    const toggleButton = screen.getByText("Need an account? Sign up");
    await user.click(toggleButton);

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign up/i });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith(
        "test@example.com",
        "password123"
      );
    });
    expect(mockPush).toHaveBeenCalledWith("/");
  });

  it("displays error message on sign in failure", async () => {
    mockSignIn.mockRejectedValueOnce(new Error("Invalid credentials"));
    const user = userEvent.setup();
    render(<Auth />);

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "wrongpassword");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
    });
  });

  it("disables button during loading", async () => {
    mockSignIn.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );
    const user = userEvent.setup();
    render(<Auth />);

    const submitButton = screen.getByRole("button", { name: /sign in/i });
    await user.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });
});
