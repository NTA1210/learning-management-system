jest.mock('@/services/auth.service', () => ({
  createAccount: jest.fn(),
  loginUser: jest.fn(),
  refreshUserAccessToken: jest.fn(),
  resetPassword: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  verifyEmail: jest.fn(),
}));

jest.mock('@/validators/auth.schemas', () => ({
  registerSchema: { parse: jest.fn() },
  loginSchema: { parse: jest.fn() },
  emailSchema: { parse: jest.fn() },
  refreshTokenSchema: { parse: jest.fn() },
  resetPasswordSchema: { parse: jest.fn() },
  sendPasswordResetEmailSchema: { parse: jest.fn() },
  verificationCodeSchema: { parse: jest.fn() },
}));

jest.mock('@/utils/cookies', () => {
  return {
    setAuthCookies: jest.fn(),
    clearAuthCookies: jest.fn(),
    getAccessTokenCookieOptions: jest.fn().mockReturnValue({
      sameSite: 'strict',
      secure: true,
      httpOnly: true,
      expires: '2025-11-07T03:31:13.441Z',
    }),
    getRefreshTokenCookieOptions: jest.fn(),
  };
});

jest.mock('@/models', () => {
  return {
    SessionModel: {
      findByIdAndDelete: jest.fn().mockResolvedValue({}),
    },
  };
});

jest.mock('@/utils/jwt', () => ({
  verifyToken: jest.fn().mockReturnValue({
    payload: { sessionId: '1234' },
  }),
}));

import { BAD_REQUEST, NOT_FOUND, OK, UNAUTHORIZED } from '@/constants/http';
// ------------------------//----------------------------------
import {
  loginHandler,
  logoutHandler,
  refreshHandler,
  registerHandler,
  resetPasswordHandler,
  sendPasswordResetHandler,
  verifyEmailHandler,
} from '@/controller/auth.controller';

import { SessionModel } from '@/models';
import {
  createAccount,
  loginUser,
  refreshUserAccessToken,
  resetPassword,
  sendPasswordResetEmail,
  verifyEmail,
} from '@/services/auth.service';
import appAssert from '@/utils/appAssert';
import AppError from '@/utils/AppError';
import { clearAuthCookies, setAuthCookies } from '@/utils/cookies';
import { verifyToken } from '@/utils/jwt';
import {
  emailSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verificationCodeSchema,
} from '@/validators';
import { clear } from 'console';
import { ZodError } from 'zod';

// ------------------------//----------------------------------

describe('Auth Controller Unit Tests', () => {
  const mockReq = {
    body: {},
    headers: {
      'user-agent': 'jest-test-agent',
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
    clearCookie: jest.fn().mockReturnThis(),
  };

  const mockNext = jest.fn();

  describe('Register controller', () => {
    const mockUser = {
      username: 'user12345',
      email: 'user12345@gmail.com',
      password: '12345678',
      confirmPassword: '12345678',
    };
    it('should validate request, call createAccount, and return success', async () => {
      // Mock Zod schema parse
      (registerSchema.parse as jest.Mock).mockReturnValue(mockUser);

      // Mock service
      (createAccount as jest.Mock).mockResolvedValue({ user: mockUser });

      await registerHandler(mockReq as any, mockRes as any, mockNext);

      // ✅ validate gọi schema.parse đúng
      expect(registerSchema.parse).toHaveBeenCalledWith({
        ...mockReq.body,
        useAgent: mockReq.headers['user-agent'],
      });

      // ✅ validate service được gọi đúng
      expect(createAccount).toHaveBeenCalledWith(mockUser);

      // ✅ validate res.success được gọi
      expect(mockRes.success).toHaveBeenCalledWith(expect.any(Number), mockUser);
    });

    it('should throw error if validation fails', async () => {
      const validationError = new Error('Validation error');
      (registerSchema.parse as jest.Mock).mockImplementation(() => {
        throw validationError;
      });

      await registerHandler(mockReq as any, mockRes as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith(validationError);
    });

    it("should throw error if passwords don't match", async () => {
      const mockReq: any = {
        body: {
          username: 'user1',
          email: 'test@test.com',
          password: '123',
          confirmPassword: '456',
        },
        headers: { 'user-agent': 'jest-agent' },
      };

      (registerSchema.parse as jest.Mock).mockImplementation(() => {
        throw new ZodError([
          {
            code: 'custom',
            message: 'Passwords do not match',
            path: ['confirmPassword'],
          },
        ]);
      });

      await registerHandler(mockReq, mockRes as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        new ZodError([
          {
            code: 'custom',
            message: 'Passwords do not match',
            path: ['confirmPassword'],
          },
        ])
      );
    });

    it('should throw error if user already exists', async () => {
      (registerSchema.parse as jest.Mock).mockResolvedValueOnce(mockUser);

      (createAccount as jest.Mock).mockRejectedValueOnce(
        new ZodError([
          {
            code: 'custom',
            message: 'User already exists',
            path: ['email'],
          },
        ])
      );
      await registerHandler(mockReq as any, mockRes as any, mockNext);
      expect(mockNext).toHaveBeenCalledWith(
        new ZodError([
          {
            code: 'custom',
            message: 'User already exists',
            path: ['email'],
          },
        ])
      );
    });
  });

  describe('Login controller', () => {
    const mockUser = {
      email: 'user12345@gmail.com',
      password: '12345678',
    };

    it('should return success', async () => {
      const mockReqLogin = {
        ...mockReq,
        body: { email: mockUser.email, password: mockUser.password },
      };

      // Mock schema parse
      (loginSchema.parse as jest.Mock).mockReturnValue({
        ...mockReqLogin.body,
        userAgent: mockReqLogin.headers['user-agent'],
      });

      // Mock service
      (loginUser as jest.Mock).mockResolvedValue({
        user: mockUser,
        accessToken: 'token',
        refreshToken: 'token',
      });

      (setAuthCookies as jest.Mock).mockReturnValue(mockRes);

      await loginHandler(mockReqLogin as any, mockRes as any, mockNext);

      expect(setAuthCookies).toHaveBeenCalledWith({
        res: mockRes,
        accessToken: 'token',
        refreshToken: 'token',
      });

      expect(mockRes.success).toHaveBeenCalledWith(OK, expect.any(Object));
    });

    it('should throw error if validation fails', async () => {
      const validationError = new ZodError([]);
      (loginSchema.parse as jest.Mock).mockImplementation(() => {
        throw validationError;
      });

      await loginHandler(mockReq as any, mockRes as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith(validationError);
    });

    it('should throw error if user not found', async () => {
      const mockReqLogin = {
        ...mockReq,
        body: { email: mockUser.email, password: mockUser.password },
      };
      const error = new ZodError([
        {
          code: 'custom',
          message: 'User not found',
          path: ['email'],
        },
      ]);

      // Mock schema parse
      (loginSchema.parse as jest.Mock).mockReturnValue({
        ...mockReqLogin.body,
        userAgent: mockReqLogin.headers['user-agent'],
      });

      // Mock service
      (loginUser as jest.Mock).mockRejectedValue(error);

      await loginHandler(mockReqLogin as any, mockRes as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('Logout controller', () => {
    it('should return success and delete session', async () => {
      const mockReq = {
        cookies: {
          accessToken: 'token',
          refreshToken: 'token',
        },
      };
      // Mock verifyToken trả về sessionId
      (verifyToken as jest.Mock).mockReturnValueOnce({
        payload: { sessionId: '123' },
      });
      (SessionModel.findByIdAndDelete as jest.Mock).mockResolvedValue({});

      (clearAuthCookies as jest.Mock).mockReturnValueOnce(mockRes);

      await logoutHandler(mockReq as any, mockRes as any, mockNext);

      // Session được xoa
      expect(SessionModel.findByIdAndDelete).toHaveBeenCalled();

      // Cookies được clear
      expect(clearAuthCookies).toHaveBeenCalledWith(mockRes);

      // Res success
      expect(mockRes.success).toHaveBeenCalledWith(OK, {
        message: 'Logout successfully',
      });
    });

    it('should throw error if find session fails', async () => {
      const mockReq = {
        cookies: {
          accessToken: 'token',
          refreshToken: 'token',
        },
      };
      // Mock verifyToken trả về sessionId
      (verifyToken as jest.Mock).mockReturnValueOnce({
        payload: { sessionId: '123' },
      });
      (SessionModel.findByIdAndDelete as jest.Mock).mockRejectedValue(
        new Error('Internal server error')
      );

      await logoutHandler(mockReq as any, mockRes as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith(new Error('Internal server error'));
    });
  });

  describe('Refresh Token', () => {
    it('should return accessToken successfully', async () => {
      const mockReqWithCookie = {
        ...mockReq,
        cookies: { refreshToken: 'refresh-token' },
      };

      (refreshUserAccessToken as jest.Mock).mockResolvedValueOnce({
        accessToken: 'token',
      });

      await refreshHandler(mockReqWithCookie as any, mockRes as any, mockNext);

      expect(mockRes.cookie).toHaveBeenCalledWith('accessToken', 'token', {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        expires: '2025-11-07T03:31:13.441Z',
      });
      expect(mockRes.success).toHaveBeenCalledWith(OK, {
        message: 'Token refreshed successfully',
      });
    });

    it('should throw error if refresh token is invalid', async () => {
      const mockReqWithCookie = {
        ...mockReq,
        cookies: {},
      };

      await refreshHandler(mockReqWithCookie as any, mockRes as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith(new AppError('Missing refresh token', UNAUTHORIZED));
    });

    it('should throw error if verify token fails', async () => {
      const mockReqWithCookie = {
        ...mockReq,
        cookies: { refreshToken: 'refresh-token' },
      };

      (refreshUserAccessToken as jest.Mock).mockRejectedValueOnce(
        new AppError('Invalid refresh token', UNAUTHORIZED)
      );

      await refreshHandler(mockReqWithCookie as any, mockRes as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith(new AppError('Invalid refresh token', UNAUTHORIZED));
    });
  });

  describe('Verify email controller', () => {
    it('should return success', async () => {
      const mockReq = {
        params: {
          code: '123',
        },
      };
      (verificationCodeSchema.parse as jest.Mock).mockReturnValueOnce('123');
      (verifyEmail as jest.Mock).mockResolvedValueOnce(true);
      await verifyEmailHandler(mockReq as any, mockRes as any, mockNext);
      expect(mockRes.success).toHaveBeenCalledWith(OK, {
        message: 'Email verified successfully',
      });
    });
    it('should throw error if code is invalid', async () => {
      const mockReq = {
        params: {
          code: '123',
        },
      };
      (verificationCodeSchema.parse as jest.Mock).mockImplementationOnce(() => {
        throw new ZodError([]);
      });
      await verifyEmailHandler(mockReq as any, mockRes as any, mockNext);
      expect(mockNext).toHaveBeenCalledWith(new ZodError([]));
    });

    it('should throw error if verify email fails - cannot find verification code', async () => {
      const mockReq = {
        params: {
          code: '123',
        },
      };
      (verificationCodeSchema.parse as jest.Mock).mockReturnValueOnce('123');
      (verifyEmail as jest.Mock).mockRejectedValueOnce(
        new AppError('Invalid or expired verification code', NOT_FOUND)
      );
      await verifyEmailHandler(mockReq as any, mockRes as any, mockNext);
      expect(mockNext).toHaveBeenCalledWith(
        new AppError('Invalid or expired verification code', NOT_FOUND)
      );
    });
  });

  describe('Send reset password email controller', () => {
    it('should return success', async () => {
      const mockReq = {
        body: {
          email: 'user12345@gmail.com',
        },
      };
      (emailSchema.parse as jest.Mock).mockReturnValueOnce({
        email: 'user12345@gmail.com',
      });
      (sendPasswordResetEmail as jest.Mock).mockResolvedValueOnce(true);
      await sendPasswordResetHandler(mockReq as any, mockRes as any, mockNext);
      expect(mockRes.success).toHaveBeenCalledWith(OK, {
        message: 'Password reset email sent successfully',
        info: 'Check your email to reset your password',
      });
    });
    it('should throw error if email is invalid', async () => {
      const mockReq = {
        body: {
          email: 'user12345@gmail.com',
        },
      };
      (emailSchema.parse as jest.Mock).mockImplementationOnce(() => {
        throw new ZodError([]);
      });
      await sendPasswordResetHandler(mockReq as any, mockRes as any, mockNext);
      expect(mockNext).toHaveBeenCalledWith(new ZodError([]));
    });
    it('should throw error if email not found', async () => {
      const error = new AppError('User with this email does not exist', NOT_FOUND);
      const mockReq = {
        body: {
          email: 'user12345@gmail.com',
        },
      };
      (emailSchema.parse as jest.Mock).mockReturnValueOnce({
        email: 'user12345@gmail.com',
      });
      (sendPasswordResetEmail as jest.Mock).mockRejectedValueOnce(error);
      await sendPasswordResetHandler(mockReq as any, mockRes as any, mockNext);
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('Reset password controller', () => {
    it('should return success', async () => {
      const body = {
        verificationCode: '123',
        password: 'password',
      };
      const mockReq = { body };

      (resetPasswordSchema.parse as jest.Mock).mockReturnValueOnce(body);
      (resetPassword as jest.Mock).mockResolvedValueOnce(true);
      (clearAuthCookies as jest.Mock).mockReturnValueOnce(mockRes);

      await resetPasswordHandler(mockReq as any, mockRes as any, mockNext);

      expect(clearAuthCookies).toHaveBeenCalledWith(mockRes);
      expect(mockRes.success).toHaveBeenCalledWith(OK, {
        message: 'Password reset successfully',
      });
    });
    it('should throw error if verification code is invalid', async () => {
      const mockReq = {
        body: {
          verificationCode: '123',
          password: 'password',
        },
      };
      (resetPasswordSchema.parse as jest.Mock).mockImplementationOnce(() => {
        throw new ZodError([]);
      });
      await resetPasswordHandler(mockReq as any, mockRes as any, mockNext);
      expect(mockNext).toHaveBeenCalledWith(new ZodError([]));
    });

    it('should throw error if reset password fails - cannot find verification code', async () => {
      const mockReq = {
        body: {
          verificationCode: '123',
          password: 'password',
        },
      };
      (resetPasswordSchema.parse as jest.Mock).mockReturnValueOnce({
        verificationCode: '123',
        password: 'password',
      });
      (resetPassword as jest.Mock).mockRejectedValueOnce(
        new AppError('Invalid or expired verification code', NOT_FOUND)
      );
      await resetPasswordHandler(mockReq as any, mockRes as any, mockNext);
      expect(mockNext).toHaveBeenCalledWith(
        new AppError('Invalid or expired verification code', NOT_FOUND)
      );
    });
  });
});
