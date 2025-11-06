jest.mock("@/services/auth.service", () => ({
  createAccount: jest.fn(),
  loginUser: jest.fn(),
  refreshUserAccessToken: jest.fn(),
  resetPassword: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  verifyEmail: jest.fn(),
}));

jest.mock("@/validators/auth.schemas", () => ({
  registerSchema: { parse: jest.fn() },
  loginSchema: { parse: jest.fn() },
  refreshTokenSchema: { parse: jest.fn() },
  resetPasswordSchema: { parse: jest.fn() },
  sendPasswordResetEmailSchema: { parse: jest.fn() },
  verifyEmailSchema: { parse: jest.fn() },
}));

jest.mock("@/utils/cookies", () => {
  return {
    setAuthCookies: jest.fn(),
    clearAuthCookies: jest.fn(),
    getAccessTokenCookieOptions: jest.fn(),
    getRefreshTokenCookieOptions: jest.fn(),
  };
});

jest.mock("@/models", () => {
  return {
    SessionModel: {
      findByIdAndDelete: jest.fn().mockResolvedValue({}),
    },
  };
});

jest.mock("@/utils/jwt", () => ({
  verifyToken: jest.fn().mockReturnValue({
    payload: { sessionId: "1234" },
  }),
}));

// ------------------------//----------------------------------
import {
  loginHandler,
  logoutHandler,
  registerHandler,
} from "@/controller/auth.controller";
import { SessionModel } from "@/models";
import { createAccount, loginUser } from "@/services/auth.service";
import { clearAuthCookies, setAuthCookies } from "@/utils/cookies";
import { verifyToken } from "@/utils/jwt";
import { loginSchema, registerSchema } from "@/validators";
import { ZodError } from "zod";

// ------------------------//----------------------------------

describe("Auth Controller Unit Tests", () => {
  const mockReq = {
    body: {},
    headers: {
      "user-agent": "jest-test-agent",
    } as Record<string, string>,
    cookies: {},
    params: {},
  };

  const mockRes = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    success: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
  };

  const mockNext = jest.fn();

  describe("Register", () => {
    const mockUser = {
      username: "user12345",
      email: "user12345@gmail.com",
      password: "12345678",
      confirmPassword: "12345678",
    };
    it("should validate request, call createAccount, and return success", async () => {
      // Mock Zod schema parse
      (registerSchema.parse as jest.Mock).mockReturnValue(mockUser);

      // Mock service
      (createAccount as jest.Mock).mockResolvedValue({ user: mockUser });

      await registerHandler(mockReq as any, mockRes as any, mockNext);

      // ✅ validate gọi schema.parse đúng
      expect(registerSchema.parse).toHaveBeenCalledWith({
        ...mockReq.body,
        useAgent: mockReq.headers["user-agent"],
      });

      // ✅ validate service được gọi đúng
      expect(createAccount).toHaveBeenCalledWith(mockUser);

      // ✅ validate res.success được gọi
      expect(mockRes.success).toHaveBeenCalledWith(
        expect.any(Number),
        mockUser
      );
    });

    it("should throw error if validation fails", async () => {
      const validationError = new Error("Validation error");
      (registerSchema.parse as jest.Mock).mockImplementation(() => {
        throw validationError;
      });

      await registerHandler(mockReq as any, mockRes as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith(validationError);
    });

    it("should throw error if passwords don't match", async () => {
      const mockReq: any = {
        body: {
          username: "user1",
          email: "test@test.com",
          password: "123",
          confirmPassword: "456",
        },
        headers: { "user-agent": "jest-agent" },
      };

      (registerSchema.parse as jest.Mock).mockImplementation(() => {
        throw new ZodError([
          {
            code: "custom",
            message: "Passwords do not match",
            path: ["confirmPassword"],
          },
        ]);
      });

      await registerHandler(mockReq, mockRes as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        new ZodError([
          {
            code: "custom",
            message: "Passwords do not match",
            path: ["confirmPassword"],
          },
        ])
      );
    });

    it("should throw error if user already exists", async () => {
      (registerSchema.parse as jest.Mock).mockResolvedValueOnce(mockUser);

      (createAccount as jest.Mock).mockRejectedValueOnce(
        new ZodError([
          {
            code: "custom",
            message: "User already exists",
            path: ["email"],
          },
        ])
      );
      await registerHandler(mockReq as any, mockRes as any, mockNext);
      expect(mockNext).toHaveBeenCalledWith(
        new ZodError([
          {
            code: "custom",
            message: "User already exists",
            path: ["email"],
          },
        ])
      );
    });
  });

  describe("Login", () => {
    const mockUser = {
      email: "user12345@gmail.com",
      password: "12345678",
    };

    it("should return success", async () => {
      const mockReqLogin = {
        ...mockReq,
        body: { email: mockUser.email, password: mockUser.password },
      };

      // Mock schema parse
      (loginSchema.parse as jest.Mock).mockReturnValue({
        ...mockReqLogin.body,
        userAgent: mockReqLogin.headers["user-agent"],
      });

      // Mock service
      (loginUser as jest.Mock).mockResolvedValue({
        user: mockUser,
        accessToken: "token",
        refreshToken: "token",
      });

      await loginHandler(mockReqLogin as any, mockRes as any, mockNext);

      expect(setAuthCookies).toHaveBeenCalledWith({
        res: mockRes,
        accessToken: "token",
        refreshToken: "token",
      });
    });

    it("should throw error if validation fails", async () => {
      const validationError = new ZodError([]);
      (loginSchema.parse as jest.Mock).mockImplementation(() => {
        throw validationError;
      });

      await loginHandler(mockReq as any, mockRes as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith(validationError);
    });

    it("should throw error if user not found", async () => {
      const mockReqLogin = {
        ...mockReq,
        body: { email: mockUser.email, password: mockUser.password },
      };
      const error = new ZodError([
        {
          code: "custom",
          message: "User not found",
          path: ["email"],
        },
      ]);

      // Mock schema parse
      (loginSchema.parse as jest.Mock).mockReturnValue({
        ...mockReqLogin.body,
        userAgent: mockReqLogin.headers["user-agent"],
      });

      // Mock service
      (loginUser as jest.Mock).mockRejectedValue(error);

      await loginHandler(mockReqLogin as any, mockRes as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("Logout", () => {
    it("should return success and delete session", async () => {
      const mockReq = {
        cookies: {
          accessToken: "token",
          refreshToken: "token",
        },
      };
      // Mock verifyToken trả về sessionId
      (verifyToken as jest.Mock).mockReturnValueOnce({
        payload: { sessionId: "123" },
      });
      (SessionModel.findByIdAndDelete as jest.Mock).mockResolvedValue({});

      await logoutHandler(mockReq as any, mockRes as any, mockNext);

      // Session được xoa
      expect(SessionModel.findByIdAndDelete).toHaveBeenCalled();

      // Cookies được clear
      expect(clearAuthCookies).toHaveBeenCalledWith(mockRes);
    });

    it("should throw error if find session fails", async () => {
      const mockReq = {
        cookies: {
          accessToken: "token",
          refreshToken: "token",
        },
      };
      // Mock verifyToken trả về sessionId
      (verifyToken as jest.Mock).mockReturnValueOnce({
        payload: { sessionId: "123" },
      });
      (SessionModel.findByIdAndDelete as jest.Mock).mockRejectedValue(
        new Error("Internal server error")
      );

      await logoutHandler(mockReq as any, mockRes as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith(new Error("Internal server error"));
    });
  });
});
