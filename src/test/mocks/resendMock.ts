import { vi } from "vitest";

export const mockResend = {
  emails: {
    send: vi.fn(),
  },
};

export default mockResend;
