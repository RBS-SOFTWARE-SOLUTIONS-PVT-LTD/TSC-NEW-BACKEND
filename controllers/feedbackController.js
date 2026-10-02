import { createFeedback } from "../services/feedbackService.js";
import Feedback from "../models/feedback.js";

export const submitFeedback = async (req, res) => {
    try {
        // Get student ID from logged-in user's JWT
        const studentId = req.user.userId || req.user._id || req.user.id;

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
            Number(rating),
            comment || ""
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

export const getSessionFeedback = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const feedbacks = await Feedback.find({ sessionId })
            .populate("studentId", "name faculty userId")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: feedbacks.length,
            data: feedbacks
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const getTutorFeedback = async (req, res) => {
    try {
        const tutorId = req.params.tutorId || req.user.userId || req.user._id || req.user.id;
        const feedbacks = await Feedback.find({ tutorId })
            .populate("studentId", "name faculty userId")
            .populate("sessionId", "subject topic date")
            .sort({ createdAt: -1 });

        const averageRating = feedbacks.length > 0 
            ? (feedbacks.reduce((acc, f) => acc + f.rating, 0) / feedbacks.length).toFixed(1)
            : 0;

        return res.status(200).json({
            success: true,
            count: feedbacks.length,
            averageRating: Number(averageRating),
            data: feedbacks
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const getAllFeedbacks = async (req, res) => {
    try {
        const feedbacks = await Feedback.find()
            .populate("studentId", "name email faculty userId")
            .populate("tutorId", "name email faculty userId")
            .populate("sessionId", "subject topic date")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: feedbacks.length,
            data: feedbacks
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};