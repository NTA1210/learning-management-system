import { Request, Response } from "express";
import { catchErrors } from "../utils/asyncHandler";
import { getEnrollmentStatistics } from "../services/student-statistics.service";
import { OK } from "../constants/http";

export const getStatisticsHandler = catchErrors(async (req: Request, res: Response) => {
    const { enrollmentId } = req.params;
    const userId = req.userId; // Assuming authenticate middleware populates this
    const role = req.role;     // Assuming authenticate middleware populates this

    const result = await getEnrollmentStatistics({
        enrollmentId,
        userId,
        role,
    });

    return res.status(OK).json(result);
});
