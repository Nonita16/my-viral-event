import { vi } from "vitest";

export const mockPosthog = {
  capture: vi.fn(),
  identify: vi.fn(),
  reset: vi.fn(),
};

export default mockPosthog;
