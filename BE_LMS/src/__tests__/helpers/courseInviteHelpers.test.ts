import {
  sendCourseInviteEmail,
  sendInvitesWithBatch,
  sleep,
} from "../../services/helpers/courseInviteHelpers";
import { sendMail } from "@/utils/sendMail";
import { getCourseInviteTemplate } from "@/utils/emailTemplates";

// Mock dependencies
jest.mock("@/utils/sendMail");
jest.mock("@/utils/emailTemplates");

describe("courseInviteHelpers", () => {
  const mockSendMail = sendMail as jest.Mock;
  const mockGetTemplate = getCourseInviteTemplate as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetTemplate.mockReturnValue({
      subject: "Course Invitation",
      html: "<p>You are invited</p>",
    });
    mockSendMail.mockResolvedValue({ error: null });
  });

  describe("sendCourseInviteEmail", () => {
    const testEmail = "student@example.com";
    const testInviteLink = "http://localhost:3000/courses/join?token=abc123";
    const testCourseTitle = "Introduction to Programming";

    it("Should send email successfully with correct parameters", async () => {
      await sendCourseInviteEmail(testEmail, testInviteLink, testCourseTitle);

      expect(mockGetTemplate).toHaveBeenCalledWith(testInviteLink, testCourseTitle);
      expect(mockSendMail).toHaveBeenCalledWith({
        to: testEmail,
        subject: "Course Invitation",
        html: "<p>You are invited</p>",
      });
    });

    it("Should log error when sendMail returns error object", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      const mockError = { message: "SMTP connection failed" };
      mockSendMail.mockResolvedValue({ error: mockError });

      await sendCourseInviteEmail(testEmail, testInviteLink, testCourseTitle);

      expect(consoleSpy).toHaveBeenCalledWith(
        `Failed to send invite to ${testEmail}`,
        mockError
      );
      consoleSpy.mockRestore();
    });

    it("Should catch and log exception when sendMail throws", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      const networkError = new Error("Network timeout");
      mockSendMail.mockRejectedValue(networkError);

      await sendCourseInviteEmail(testEmail, testInviteLink, testCourseTitle);

      expect(consoleSpy).toHaveBeenCalledWith(
        `Error when sending invite to ${testEmail}`,
        networkError
      );
      consoleSpy.mockRestore();
    });

    it("Should not throw even when email sending fails", async () => {
      jest.spyOn(console, "error").mockImplementation(() => {});
      mockSendMail.mockRejectedValue(new Error("Critical failure"));

      await expect(
        sendCourseInviteEmail(testEmail, testInviteLink, testCourseTitle)
      ).resolves.not.toThrow();
    });
  });

  describe("sleep", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("Should resolve after specified milliseconds", async () => {
      const sleepPromise = sleep(500);

      jest.advanceTimersByTime(500);

      await expect(sleepPromise).resolves.toBeUndefined();
    });

    it("Should not resolve before specified time", async () => {
      let resolved = false;
      sleep(1000).then(() => {
        resolved = true;
      });

      jest.advanceTimersByTime(999);
      expect(resolved).toBe(false);

      jest.advanceTimersByTime(1);
      await Promise.resolve();
      expect(resolved).toBe(true);
    });
  });

  describe("sendInvitesWithBatch", () => {
    const inviteLink = "http://localhost:3000/courses/join?token=xyz789";
    const courseTitle = "Advanced Mathematics";

    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("Should send all emails when list has 2 emails (single batch)", async () => {
      const emails = ["user1@test.com", "user2@test.com"];

      const promise = sendInvitesWithBatch(emails, inviteLink, courseTitle);
      await promise;

      expect(mockSendMail).toHaveBeenCalledTimes(2);
    });

    it("Should send emails in batches of 2 with delay between batches", async () => {
      jest.useRealTimers(); // Use real timers for this test
      const emails = ["a@test.com", "b@test.com", "c@test.com", "d@test.com"];

      await sendInvitesWithBatch(emails, inviteLink, courseTitle);

      // All 4 emails should be sent (2 batches of 2)
      expect(mockSendMail).toHaveBeenCalledTimes(4);
    });

    it("Should handle empty email list without calling sendMail", async () => {
      await sendInvitesWithBatch([], inviteLink, courseTitle);

      expect(mockSendMail).not.toHaveBeenCalled();
    });

    it("Should handle single email without delay", async () => {
      const emails = ["single@test.com"];

      await sendInvitesWithBatch(emails, inviteLink, courseTitle);

      expect(mockSendMail).toHaveBeenCalledTimes(1);
    });

    it("Should handle odd number of emails correctly", async () => {
      jest.useRealTimers(); // Use real timers for this test
      const emails = ["1@test.com", "2@test.com", "3@test.com"];

      await sendInvitesWithBatch(emails, inviteLink, courseTitle);

      // Total: 3 emails sent (batch of 2 + batch of 1)
      expect(mockSendMail).toHaveBeenCalledTimes(3);
    });

    it("Should continue sending even if one email fails", async () => {
      jest.spyOn(console, "error").mockImplementation(() => {});
      const emails = ["fail@test.com", "success@test.com"];

      // First call fails, second succeeds
      mockSendMail
        .mockRejectedValueOnce(new Error("Failed"))
        .mockResolvedValueOnce({ error: null });

      await sendInvitesWithBatch(emails, inviteLink, courseTitle);

      expect(mockSendMail).toHaveBeenCalledTimes(2);
    });
  });
});
