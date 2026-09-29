import Session from "../models/Session.js";
import User from "../models/User.js";
import crypto from "crypto";

export const CreateSession = async (req, res) => {
    try {
        if (req.user.role !== "tutor") {
            return res.status(403).json({
                success: false,
                message: "Only tutors can create a session!"
            });
        }

        const { subject, topic, type, location, meetingLink, date, scheduledStartTime, scheduledEndTime } = req.body;

        if (!subject || !topic || !type || !date || !scheduledStartTime || !scheduledEndTime) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required session fields (subject, topic, type, date, scheduledStartTime, scheduledEndTime)."
            });
        }

        if (!["physical", "online"].includes(type)) {
            return res.status(400).json({
                success: false,
                message: "Session type must be either 'physical' or 'online'."
            });
        }

        if (type === "physical" && !location) {
            return res.status(400).json({
                success: false,
                message: "Location is required for physical sessions."
            });
        }

        if (type === "online" && !meetingLink) {
            return res.status(400).json({
                success: false,
                message: "Meeting link is required for online sessions."
            });
        }

        const parsedDate = new Date(date);
        const startTime = new Date(scheduledStartTime);
        const endTime = new Date(scheduledEndTime);

        if (isNaN(parsedDate.getTime()) || isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
            return res.status(400).json({
                success: false,
                message: "Invalid date or time format provided."
            });
        }

        if (endTime <= startTime) {
            return res.status(400).json({
                success: false,
                message: "Scheduled end time must be after scheduled start time."
            });
        }

        const sessionLocation = type === "online" ? (location || "Online") : location;
        const generatedOtp = crypto.randomInt(100000, 999999).toString();
        const otpExpiresAt = new Date(endTime.getTime());

        // Get tutor name from token if available, or fetch from DB
        let tutorName = req.user.name;
        const tutorId = req.user.userId || req.user.id;
        if (!tutorName && tutorId) {
            const tutorUser = await User.findById(tutorId).select("name");
            if (tutorUser) {
                tutorName = tutorUser.name;
            }
        }

        const newSession = new Session({
            tutorId,
            subject,
            topic,
            type,
            location: sessionLocation,
            meetingLink: type === "online" ? meetingLink : undefined,
            date: parsedDate,
            scheduledStartTime: startTime,
            scheduledEndTime: endTime,
            status: "scheduled",
            otp: generatedOtp,
            otpExpiresAt,
            loggedStudents: [],
            numOfStudents: 0
        });

        await newSession.save();

        res.status(201).json({
            success: true,
            message: "New Session created successfully!",
            session_data: {
                sessionId: newSession._id,
                subject: newSession.subject,
                topic: newSession.topic,
                type: newSession.type,
                location: newSession.location,
                meetingLink: newSession.meetingLink,
                date: newSession.date,
                scheduledStartTime: newSession.scheduledStartTime,
                scheduledEndTime: newSession.scheduledEndTime,
                tutor: tutorName || "Tutor"
            }
        });

    } catch (error) {
        console.error("Error creating session:", error.message);
        if (error.name === "ValidationError") {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        res.status(500).json({
            success: false,
            message: "server error while creating session!"
        });
    }
};