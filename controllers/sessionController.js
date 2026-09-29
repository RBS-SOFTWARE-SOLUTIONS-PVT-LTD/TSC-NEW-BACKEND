import Session from "../models/Session";
import crypto from "crypto";

export const CreateSession = async (req, res) => {
    try {
        if (req.user.role !== "tutor") {
            console.log("only tutors can create a session!");
            return res.status(400).json({
                success: false,
                message: "Only tutors can create a session!"
            });
        }

        const { subject, topic, type, location, meetingLink, date, scheduledStartTime, scheduledEndTime } = req.body;

        if (!subject || !topic || !type || !location || !date || !scheduledStartTime || !scheduledEndTime) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required session fields."
            });
        }

        const generatedOtp = crypto.randomInt(100000, 999999).toString();
        const otpExpiresAt = scheduledEndTime ? new Date(scheduledEndTime) : new Date(Date.now() + 2 * 60 * 60 * 1000);

        const newSession = new Session({
            tutorId: req.user.userId || req.user.id, subject, topic, type, location,
            meetingLink: type === "online" ? meetingLink : undefined, date: new Date(date), scheduledStartTime: new Date(scheduledStartTime), scheduledEndTime: new Date(scheduledEndTime),
            status: "scheduled", otp: generatedOtp, otpExpiresAt, loggedStudents: [], numOfStudents: 0
        });

        await newSession.save();

        res.status(201).json({
            success: true,
            message: "New Session created successfully!",
            session_data: {
                sessionId: newSession.sessionId,
                subject: newSession.subject,
                topic: newSession.topic,
                tutor: req.user.name
            }
        });

    } catch (error) {
        console.log("Error: " + error.message);
        res.status(500).json({
            success: false,
            message: "server error while creating session!"
        });
    }
}