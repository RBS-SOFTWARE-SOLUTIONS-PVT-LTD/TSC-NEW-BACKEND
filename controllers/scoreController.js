import { getLiveScoresService, getMonthlyScoresService, getTutorOwnCurrentScoreService } from "../services/scoreService.js";

/**
 * Controller to get live scores for the current month.
 */
export const getLiveScores = async (req, res) => {
    try {
        const result = await getLiveScoresService();
        res.status(200).json({
            success: true,
            message: "Live tutor scores fetched successfully",
            data: result
        });
    } catch (error) {
        console.error("Error fetching live scores:", error.message);
        res.status(500).json({
            success: false,
            message: "Server error while fetching live scores"
        });
    }
};

/**
 * Controller to get monthly scores for a specified year and month.
 */
export const getMonthlyScores = async (req, res) => {
    try {
        let { year, month } = req.query;

        const now = new Date();
        const targetYear = year ? parseInt(year, 10) : now.getUTCFullYear();
        const targetMonth = month ? parseInt(month, 10) : now.getUTCMonth() + 1;

        if (isNaN(targetYear) || isNaN(targetMonth) || targetMonth < 1 || targetMonth > 12) {
            return res.status(400).json({
                success: false,
                message: "Invalid year or month query parameter provided."
            });
        }

        const result = await getMonthlyScoresService(targetYear, targetMonth);
        res.status(200).json({
            success: true,
            message: `Monthly tutor scores for ${targetYear}-${String(targetMonth).padStart(2, '0')} fetched successfully`,
            data: result
        });
    } catch (error) {
        console.error("Error fetching monthly scores:", error.message);
        res.status(500).json({
            success: false,
            message: "Server error while fetching monthly scores"
        });
    }
};

/**
 * Controller for a tutor to view their own live current score.
 */
export const getMyCurrentScore = async (req, res) => {
    try {
        if (req.user.role !== "tutor") {
            return res.status(403).json({
                success: false,
                message: "Only tutors can view their own score!"
            });
        }

        const tutorId = req.user.userId || req.user.id;
        const result = await getTutorOwnCurrentScoreService(tutorId);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Score data not found for tutor account."
            });
        }

        res.status(200).json({
            success: true,
            message: "Your current live score fetched successfully",
            data: result
        });
    } catch (error) {
        console.error("Error fetching my current score:", error.message);
        res.status(500).json({
            success: false,
            message: "Server error while fetching your score"
        });
    }
};

