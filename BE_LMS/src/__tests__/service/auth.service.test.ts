jest.mock("@/models", () => {
  return {
    VerificationCodeModel: {
      create: jest.fn().mockResolvedValue({
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      }),
      findOne: jest.fn().mockResolvedValue({
        deleteOne: jest.fn().mockResolvedValue({}),
      }),
      countDocuments: jest.fn().mockResolvedValue(0),
    },
    UserModel: {
      create: jest.fn().mockResolvedValue({}),
      exists: jest.fn().mockResolvedValue(false),
      comparePassword: jest.fn().mockResolvedValue(true),
      findOne: jest.fn().mockResolvedValue({}),
      findById: jest.fn().mockResolvedValue({}),
      findByIdAndUpdate: jest.fn().mockResolvedValue({
        omitPassword: jest.fn().mockReturnValue({}),
      }),
    },
    SessionModel: {
      create: jest.fn().mockResolvedValue({}),
      findById: jest.fn().mockResolvedValue({
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        save: jest.fn().mockResolvedValue({}),
      }),
      deleteMany: jest.fn().mockResolvedValue({}),
    },
  };
});
jest.mock("@/utils/sendMail", () => {
  return {
    sendMail: jest.fn().mockResolvedValue({
      data: { id: "12345678" },
    }),
  };
});

jest.mock("@/utils/jwt", () => {
  return {
    refreshTokenSignOptions: {
      secret: "refreshTokenSecret",
    },
    verifyToken: jest.fn().mockReturnValue({
      payload: { sessionId: "1234" },
    }),
    signToKen: jest.fn().mockReturnValue({}),
  };
});

import {
  INTERNAL_SERVER_ERROR,
  NOT_FOUND,
  TOO_MANY_REQUESTS,
  UNAUTHORIZED,
} from "@/constants/http";
// --------------------------//---------------------------------
import { SessionModel, UserModel, VerificationCodeModel } from "@/models";
import {
  createAccount,
  loginUser,
  refreshUserAccessToken,
  resetPassword,
  sendPasswordResetEmail,
  verifyEmail,
} from "@/services/auth.service";
import { Role } from "@/types";
import AppError from "@/utils/AppError";
import { verifyToken } from "@/utils/jwt";
import { sendMail } from "@/utils/sendMail";
// --------------------------//---------------------------------

describe("Auth Service Unit Tests", () => {
  const mockUser = {
    username: "user12345",
    email: "user12345@gmail.com",
    password: "12345678",
    confirmPassword: "12345678",
  };

  const mockUserDoc = {
    email: "user12345@gmail.com",
    username: "user12345",
    role: Role.STUDENT,
    isVerified: false,
    omitPassword: jest.fn().mockReturnValue({
      email: "user12345@gmail.com",
      username: "user12345",
      role: Role.STUDENT,
      isVerified: false,
    }),
  };

  describe("Register", () => {
    it("should create a new user", async () => {
      (UserModel.create as jest.Mock).mockResolvedValue(mockUserDoc);
      const res = await createAccount(mockUser);

      expect(res.user.email).toBe(mockUser.email);
      expect(res.user.username).toBe(mockUser.username);
      expect(res.user.role).toBe(Role.STUDENT);
      expect(res.user.isVerified).toBe(false);
    });

    it("should call UserModel.create() with role=TEACHER if email ends with @fe.edu.vn", async () => {
      (UserModel.exists as jest.Mock).mockResolvedValue(false);
      (UserModel.create as jest.Mock).mockResolvedValue({
        omitPassword: jest.fn().mockReturnValue({}),
      });

      await createAccount({
        username: "teacherUser",
        email: "teacher@fe.edu.vn",
        password: "123456",
      });

      expect(UserModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          role: Role.TEACHER,
        })
      );
    });
    it("should throw error is user already exists", async () => {
      (UserModel.exists as jest.Mock).mockResolvedValue(true);
      await expect(createAccount(mockUser)).rejects.toThrow(
        "Email already in use"
      );
    });

    it("should throw error if username already exists", async () => {
      (UserModel.exists as jest.Mock)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);
      await expect(createAccount(mockUser)).rejects.toThrow(
        "Username already in use"
      );
    });

    it("should throw error if sendMail fails", async () => {
      (UserModel.exists as jest.Mock).mockResolvedValue(false);
      (UserModel.create as jest.Mock).mockResolvedValue(mockUser);
      (VerificationCodeModel.create as jest.Mock).mockResolvedValueOnce({
        _id: "code1",
      });
      (sendMail as jest.Mock).mockResolvedValueOnce({
        error: new Error("SMTP error"),
      });

      await expect(
        createAccount({
          username: "anh",
          email: "test@gmail.com",
          password: "123",
        })
      ).rejects.toThrow();
    });
  });

  describe("Login", () => {
    const user = {
      _id: "123",
      username: "user12345",
      email: "user12345@gmail.com",
      password: "12345678",
      role: Role.STUDENT,
      isVerified: true,
      comparePassword: jest.fn().mockResolvedValue(true),
      response: jest.fn().mockResolvedValue({}),
    };
    it("should return user and token", async () => {
      (UserModel.findOne as jest.Mock).mockResolvedValue(user);

      const res = await loginUser({
        email: user.email,
        password: user.password,
      });
      expect(res.user).toBeDefined();
      expect(res.accessToken).toBeDefined();
      expect(res.refreshToken).toBeDefined();
    });

    it("should throw error if user not found", async () => {
      (UserModel.findOne as jest.Mock).mockResolvedValue(null);
      await expect(
        loginUser({
          email: user.email,
          password: user.password,
        })
      ).rejects.toThrow(
        new AppError("Invalid email or password", UNAUTHORIZED)
      );
    });

    it("should throw error if email is not verified", async () => {
      (UserModel.findOne as jest.Mock).mockResolvedValue({
        ...user,
        isVerified: false,
      });
      await expect(
        loginUser({
          email: user.email,
          password: user.password,
        })
      ).rejects.toThrow(new AppError("Email not verified", UNAUTHORIZED));
    });

    it("should throw error if password is invalid", async () => {
      (UserModel.findOne as jest.Mock).mockResolvedValue({
        ...user,
        comparePassword: jest.fn().mockResolvedValue(false),
      });
      await expect(
        loginUser({
          email: user.email,
          password: user.password,
        })
      ).rejects.toThrow(
        new AppError("Invalid email or password", UNAUTHORIZED)
      );
    });
  });

  describe("Refresh Token", () => {
    it("should refresh token success", async () => {
      const res = await refreshUserAccessToken("refreshToken");
      expect(res.accessToken).toBeDefined();
      expect(res.refreshToken).toBeDefined();
    });

    it("should extend session if sessionNeedRefresh is true", async () => {
      const mockSave = jest.fn();
      const mockSession = {
        expiresAt: new Date(Date.now() + 23 * 60 * 60 * 1000),
        save: mockSave,
      };

      (SessionModel.findById as jest.Mock).mockResolvedValueOnce(mockSession);

      await refreshUserAccessToken("refreshToken");

      expect(mockSave).toHaveBeenCalled();
      expect(mockSession.expiresAt.getTime()).toBeGreaterThan(
        new Date(Date.now() + 23 * 60 * 60 * 1000).getTime()
      );
    });

    it("should throw error if refresh token is invalid", async () => {
      (verifyToken as jest.Mock).mockReturnValueOnce({ error: "jwt expired" });

      await expect(refreshUserAccessToken("refreshToken")).rejects.toThrow(
        new AppError("Invalid refresh token", UNAUTHORIZED)
      );
    });

    it("should throw error if refresh token is expired", async () => {
      (SessionModel.findById as jest.Mock).mockResolvedValueOnce({
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      });
      await expect(refreshUserAccessToken("refreshToken")).rejects.toThrow(
        new AppError("Session expired", UNAUTHORIZED)
      );
    });

    it("should throw error if session not found", async () => {
      (SessionModel.findById as jest.Mock).mockResolvedValueOnce(null);
      await expect(refreshUserAccessToken("refreshToken")).rejects.toThrow(
        new AppError("Session expired", UNAUTHORIZED)
      );
    });

    it("should throw error if user not found", async () => {
      (SessionModel.findById as jest.Mock).mockResolvedValueOnce({
        userId: "userId",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });
      (UserModel.findById as jest.Mock).mockResolvedValue(null);
      await expect(refreshUserAccessToken("refreshToken")).rejects.toThrow(
        new AppError("User not found", NOT_FOUND)
      );
    });
  });

  describe("Verify Email", () => {
    it("should verify email success", async () => {
      const res = await verifyEmail("code1");
      expect(res).toBeDefined();
    });

    it("should throw error if code not found", async () => {
      (VerificationCodeModel.findOne as jest.Mock).mockResolvedValueOnce(null);
      await expect(verifyEmail("code1")).rejects.toThrow(
        new AppError("Invalid or expired verification code", NOT_FOUND)
      );
    });

    it("should throw error if update user failed", async () => {
      (UserModel.findByIdAndUpdate as jest.Mock).mockResolvedValueOnce(null);
      await expect(verifyEmail("code1")).rejects.toThrow(
        new AppError("Failed to verify email", INTERNAL_SERVER_ERROR)
      );
    });
  });

  describe("Send Reset Password Mail", () => {
    it("should send forgot password mail", async () => {
      const res = await sendPasswordResetEmail("email");
      expect(res).toBeDefined();
    });

    it("should throw error if user email not found", async () => {
      (UserModel.findOne as jest.Mock).mockResolvedValueOnce(null);
      await expect(sendPasswordResetEmail("email")).rejects.toThrow(
        new AppError("User with this email does not exist", NOT_FOUND)
      );
    });

    it("should throw error if user send too many requests within 5m", async () => {
      (VerificationCodeModel.countDocuments as jest.Mock).mockResolvedValueOnce(
        2
      );
      await expect(sendPasswordResetEmail("email")).rejects.toThrow(
        new AppError(
          "Too many requests. Please try again later.",
          TOO_MANY_REQUESTS
        )
      );
    });

    it("should throw error if send email failed", async () => {
      (sendMail as jest.Mock).mockResolvedValue({ error: "error" });
      await expect(sendPasswordResetEmail("email")).rejects.toThrow(AppError);
      await expect(sendPasswordResetEmail("email")).rejects.toHaveProperty(
        "statusCode",
        INTERNAL_SERVER_ERROR
      );
    });
  });

  describe("Reset Password", () => {
    it("should reset password success", async () => {
      const res = await resetPassword({
        verificationCode: "code1",
        password: "123",
      });
      expect(res).toBeDefined();
    });

    it("should throw error if code not found", async () => {
      (VerificationCodeModel.findOne as jest.Mock).mockResolvedValueOnce(null);
      await expect(
        resetPassword({ verificationCode: "code1", password: "123" })
      ).rejects.toThrow(
        new AppError("Invalid or expired verification code", NOT_FOUND)
      );
    });

    it("should throw error if update user failed", async () => {
      (UserModel.findByIdAndUpdate as jest.Mock).mockResolvedValueOnce(null);
      await expect(
        resetPassword({ verificationCode: "code1", password: "123" })
      ).rejects.toThrow(
        new AppError("Failed to reset password", INTERNAL_SERVER_ERROR)
      );
    });
  });
});
