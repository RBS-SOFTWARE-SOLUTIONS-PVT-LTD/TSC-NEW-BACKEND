import Feedback from "../models/feedback.js";
import Session from "../models/Session.js";

export const createFeedback = async (
    studentId,
    sessionId,
    rating,
    comment
) => {

    // Find the session
    const session = await Session.findById(sessionId);

    if (!session) {
        throw new Error("Session not found");
    }

    // Get tutor from session
    const tutorId = session.tutorId;

    if (!tutorId) {
        throw new Error("Tutor not found for this session");
    }

    // Check if student already submitted feedback
    const existingFeedback = await Feedback.findOne({
        studentId,
        sessionId
    });

    if (existingFeedback) {
        throw new Error(
            "You have already submitted feedback for this session"
        );
    }

    // Create feedback
    const feedback = await Feedback.create({
        studentId,
        sessionId,
        tutorId,
        rating,
        comment
    });

    return feedback;
};