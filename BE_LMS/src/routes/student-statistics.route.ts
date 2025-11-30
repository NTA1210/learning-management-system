import { Router } from "express";
import { getStatisticsHandler } from "../controller/student-statistics.controller";
import authenticate from "../middleware/authenticate";

const studentStatisticsRoutes = Router();

// Apply authentication middleware to all routes
studentStatisticsRoutes.use(authenticate);

studentStatisticsRoutes.get(
    "/enrollments/:enrollmentId/statistics",
    getStatisticsHandler
);

export default studentStatisticsRoutes;
