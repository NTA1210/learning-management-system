import { sendMail } from "@/utils/sendMail";
import { getCourseInviteTemplate } from "@/utils/emailTemplates";

// Helper function để gửi email invite
export const sendCourseInviteEmail = async (
    email: string,
    inviteLink: string,
    courseTitle: string
) => {
    try {
        const { error } = await sendMail({
            to: email,
            ...getCourseInviteTemplate(inviteLink, courseTitle),
        });

        if (error) {
            console.error(`Failed to send invite to ${email}`, error);
        }
    } catch (err) {
        console.error(`Error when sending invite to ${email}`, err);
    }
};

// Helper: Sleep function
export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper: Gửi email theo lô (Batch)
export const sendInvitesWithBatch = async (
    emails: string[],
    inviteLink: string,
    courseTitle: string
) => {
    const BATCH_SIZE = 2;      // Mỗi lô gửi 2 email song song
    const BATCH_DELAY = 700;   // Nghỉ 700ms giữa các lô

    for (let i = 0; i < emails.length; i += BATCH_SIZE) {
        const batch = emails.slice(i, i + BATCH_SIZE);

        // Gửi 1 lô song song
        await Promise.all(
            batch.map((email) =>
                sendCourseInviteEmail(email, inviteLink, courseTitle)
            )
        );

        // Nếu chưa phải lô cuối thì nghỉ chút
        if (i + BATCH_SIZE < emails.length) {
            await sleep(BATCH_DELAY);
        }
    }
};