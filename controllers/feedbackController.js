import { createFeedback } from "../services/feedbackService.js";

export const submitFeedback = async (req, res) => {
    try {

        // Get student ID from logged-in user's JWT
        const studentId = req.user.userId;

        // Get data from request body
        const {
            sessionId,
            rating,
            comment
        } = req.body;

        // Basic validation
        if (!sessionId || !rating) {
            return res.status(400).json({
                success: false,
                message: "Session ID and rating are required"
            });
        }

        // Make sure rating is between 1 and 10
        if (rating < 1 || rating > 10) {
            return res.status(400).json({
                success: false,
                message: "Rating must be between 1 and 10"
            });
        }

        const feedback = await createFeedback(
            studentId,
            sessionId,
            rating,
            comment
        );

        return res.status(201).json({
            success: true,
            message: "Feedback submitted successfully",
            data: feedback
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};