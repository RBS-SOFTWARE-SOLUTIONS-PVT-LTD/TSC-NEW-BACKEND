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

export const startSession = async (req, res) => {
    try {
        if (req.user.role !== "tutor") {
            return res.status(403).json({
                success: false,
                message: "Access denied. Only tutors can start a session."
            });
        }

        const { id } = req.params;
        const session = await Session.findById(id);

        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Session not found."
            });
        }

        const tutorId = req.user.userId || req.user._id;
        if (session.tutorId.toString() !== tutorId.toString()) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized. You are not the assigned tutor for this session."
            });
        }

        if (session.status !== "scheduled") {
            return res.status(400).json({
                success: false,
                message: `Cannot start session. Current session status is '${session.status}'.`
            });
        }

        const now = new Date();
        const dynamicOtp = crypto.randomInt(100000, 999999).toString();
        const qrPayload = crypto.randomBytes(16).toString("hex");
        const verificationExpiry = new Date(session.scheduledEndTime.getTime() + 15 * 60 * 1000); 

        session.status = "active";
        session.actualStartTime = now;
        session.otp = dynamicOtp;
        session.otpExpiresAt = verificationExpiry;
        session.qrCode = qrPayload;
        session.qrExpiresAt = verificationExpiry;

        await session.save();

        res.status(200).json({
            success: true,
            message: "Session started successfully!",
            data: {
                sessionId: session._id,
                subject: session.subject,
                topic: session.topic,
                status: session.status,
                type: session.type,
                actualStartTime: session.actualStartTime,
                otp: session.otp,
                qrCode: session.qrCode,
                otpExpiresAt: session.otpExpiresAt
            }
        });

    } catch (error) {
        console.error("Error starting session:", error.message);
        res.status(500).json({
            success: false,
            message: "Server error while starting session."
        });
    }
};

export const endSession = async (req, res) => {
    try {
        if (req.user.role !== "tutor") {
            return res.status(403).json({
                success: false,
                message: "Access denied. Only tutors can end a session."
            });
        }

        const { id } = req.params;
        const session = await Session.findById(id);

        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Session not found."
            });
        }

        const tutorId = req.user.userId || req.user._id;
        if (session.tutorId.toString() !== tutorId.toString()) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized. You are not the assigned tutor for this session."
            });
        }

        if (session.status !== "active") {
            return res.status(400).json({
                success: false,
                message: `Cannot end session. Session status must be 'active', but is currently '${session.status}'.`
            });
        }

        const actualEndTime = new Date();
        const actualStartTime = session.actualStartTime || session.scheduledStartTime;

        // Calculate official tutoring duration automatically (milliseconds -> minutes)
        const diffMs = actualEndTime.getTime() - actualStartTime.getTime();
        const durationMinutes = Math.max(1, Math.round(diffMs / (1000 * 60)));
        const durationHours = Number((durationMinutes / 60).toFixed(2));

        session.status = "completed";
        session.actualEndTime = actualEndTime;
        session.durationMinutes = durationMinutes;
        session.numOfStudents = session.loggedStudents ? session.loggedStudents.length : 0;

        await session.save();

        res.status(200).json({
            success: true,
            message: "Session completed successfully!",
            data: {
                sessionId: session._id,
                subject: session.subject,
                topic: session.topic,
                status: session.status,
                actualStartTime: session.actualStartTime,
                actualEndTime: session.actualEndTime,
                durationMinutes: session.durationMinutes,
                durationHours: durationHours,
                numOfStudents: session.numOfStudents
            }
        });

    } catch (error) {
        console.error("Error ending session:", error.message);
        res.status(500).json({
            success: false,
            message: "Server error while ending session."
        });
    }
};

export const cancelSession = async (req, res) => {
    try {
        if (req.user.role !== "tutor") {
            return res.status(403).json({
                success: false,
                message: "Access denied. Only tutors can cancel a session."
            });
        }

        const { id } = req.params;
        const session = await Session.findById(id);

        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Session not found."
            });
        }

        const tutorId = req.user.userId || req.user._id;
        if (session.tutorId.toString() !== tutorId.toString()) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized. You are not the assigned tutor for this session."
            });
        }

        if (session.status !== "scheduled") {
            return res.status(400).json({
                success: false,
                message: `Only scheduled sessions can be cancelled. Current status is '${session.status}'.`
            });
        }

        session.status = "cancelled";
        await session.save();

        res.status(200).json({
            success: true,
            message: "Session cancelled successfully.",
            data: {
                sessionId: session._id,
                status: session.status
            }
        });

    } catch (error) {
        console.error("Error cancelling session:", error.message);
        res.status(500).json({
            success: false,
            message: "Server error while cancelling session."
        });
    }
};

export const getSessionById = async (req, res) => {
    try {
        const { id } = req.params;
        const session = await Session.findById(id)
            .populate("tutorId", "name email faculty")
            .populate("loggedStudents.studentId", "name email userId faculty");

        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Session not found."
            });
        }

        res.status(200).json({
            success: true,
            data: session
        });

    } catch (error) {
        console.error("Error fetching session:", error.message);
        res.status(500).json({
            success: false,
            message: "Server error while fetching session details."
        });
    }
};

export const attendSession = async (req, res) => {
    try {
        if (req.user.role !== "student") {
            return res.status(403).json({
                success: false,
                message: "Access denied. Only students can mark attendance."
            });
        }

        const { id } = req.params;
        const { otp, qrCode } = req.body;
        const studentId = req.user.userId || req.user._id || req.user.id;

        const session = await Session.findById(id);

        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Session not found."
            });
        }

        if (session.status !== "active") {
            return res.status(400).json({
                success: false,
                message: `Attendance can only be recorded for active sessions. Current session status is '${session.status}'.`
            });
        }

        // Application-level duplicate check
        const isAlreadyAttended = session.loggedStudents.some(
            (record) => record.studentId.toString() === studentId.toString()
        );

        if (isAlreadyAttended) {
            return res.status(409).json({
                success: false,
                message: "Attendance already recorded for this session. Duplicate check-ins are strictly prohibited."
            });
        }

        // Attendance Verification (OTP or QR Code)
        let verificationMethod = "otp";
        const now = new Date();

        if (otp) {
            if (session.otpExpiresAt && now > new Date(session.otpExpiresAt)) {
                return res.status(400).json({
                    success: false,
                    message: "Verification OTP has expired."
                });
            }
            if (session.otp !== otp.toString().trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid session OTP."
                });
            }
            verificationMethod = "otp";
        } else if (qrCode) {
            if (session.qrExpiresAt && now > new Date(session.qrExpiresAt)) {
                return res.status(400).json({
                    success: false,
                    message: "Verification QR code has expired."
                });
            }
            if (session.qrCode !== qrCode.toString().trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid QR code verification token."
                });
            }
            verificationMethod = "qr";
        } else {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid session OTP or QR code to verify attendance."
            });
        }

        // Atomic DB-level update with duplicate check invariant
        const updatedSession = await Session.findOneAndUpdate(
            {
                _id: id,
                status: "active",
                "loggedStudents.studentId": { $ne: studentId }
            },
            {
                $push: {
                    loggedStudents: {
                        studentId,
                        joinedAt: now,
                        verificationMethod
                    }
                },
                $inc: { numOfStudents: 1 }
            },
            { new: true }
        ).populate("tutorId", "name email faculty");

        if (!updatedSession) {
            return res.status(409).json({
                success: false,
                message: "Attendance could not be recorded. You may have already checked in or the session is no longer active."
            });
        }

        res.status(200).json({
            success: true,
            message: "Attendance verified and recorded successfully!",
            data: {
                sessionId: updatedSession._id,
                subject: updatedSession.subject,
                topic: updatedSession.topic,
                tutor: updatedSession.tutorId ? updatedSession.tutorId.name : undefined,
                joinedAt: now,
                verificationMethod,
                totalAttendees: updatedSession.numOfStudents
            }
        });

    } catch (error) {
        console.error("Error recording attendance:", error.message);
        res.status(500).json({
            success: false,
            message: "Server error while recording attendance."
        });
    }
};

export const getSessionAttendees = async (req, res) => {
    try {
        const { id } = req.params;
        const session = await Session.findById(id)
            .populate("loggedStudents.studentId", "userId name email faculty");

        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Session not found."
            });
        }

        const userId = req.user.userId || req.user._id || req.user.id;
        const isTutor = session.tutorId.toString() === userId.toString();
        const isAdmin = req.user.role === "admin";

        if (!isTutor && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: "Access denied. Only the assigned tutor or admin can view session attendees."
            });
        }

        res.status(200).json({
            success: true,
            sessionId: session._id,
            subject: session.subject,
            topic: session.topic,
            totalAttendees: session.loggedStudents.length,
            attendees: session.loggedStudents.map((item) => ({
                student: item.studentId,
                joinedAt: item.joinedAt,
                verificationMethod: item.verificationMethod
            }))
        });

    } catch (error) {
        console.error("Error fetching attendees:", error.message);
        res.status(500).json({
            success: false,
            message: "Server error while fetching attendees."
        });
    }
};

export const getStudentAttendanceHistory = async (req, res) => {
    try {
        if (req.user.role !== "student") {
            return res.status(403).json({
                success: false,
                message: "Access denied. Only students can view their attendance history."
            });
        }

        const studentId = req.user.userId || req.user._id || req.user.id;

        const attendedSessions = await Session.find({
            "loggedStudents.studentId": studentId
        })
            .populate("tutorId", "name email faculty")
            .sort({ date: -1 });

        const history = attendedSessions.map((session) => {
            const studentEntry = session.loggedStudents.find(
                (item) => item.studentId && item.studentId.toString() === studentId.toString()
            );

            return {
                sessionId: session._id,
                subject: session.subject,
                topic: session.topic,
                type: session.type,
                location: session.location,
                date: session.date,
                status: session.status,
                durationMinutes: session.durationMinutes,
                tutor: session.tutorId ? {
                    id: session.tutorId._id,
                    name: session.tutorId.name,
                    faculty: session.tutorId.faculty
                } : null,
                joinedAt: studentEntry ? studentEntry.joinedAt : null,
                verificationMethod: studentEntry ? studentEntry.verificationMethod : null
            };
        });

        res.status(200).json({
            success: true,
            totalAttended: history.length,
            data: history
        });

    } catch (error) {
        console.error("Error fetching student history:", error.message);
        res.status(500).json({
            success: false,
            message: "Server error while fetching attendance history."
        });
    }
};

export const getAllSessions = async (req, res) => {
    try {
        const { status, subject, tutorId, type, search } = req.query;
        const filter = {};

        if (status && status !== "all") {
            filter.status = status;
        }
        if (subject) {
            filter.subject = { $regex: subject, $options: "i" };
        }
        if (type) {
            filter.type = type;
        }
        if (tutorId) {
            filter.tutorId = tutorId;
        }
        if (search) {
            filter.$or = [
                { subject: { $regex: search, $options: "i" } },
                { topic: { $regex: search, $options: "i" } },
                { location: { $regex: search, $options: "i" } }
            ];
        }

        const sessions = await Session.find(filter)
            .populate("tutorId", "name email faculty userId")
            .sort({ date: -1, scheduledStartTime: -1 });

        res.status(200).json({
            success: true,
            count: sessions.length,
            data: sessions
        });
    } catch (error) {
        console.error("Error fetching sessions:", error.message);
        res.status(500).json({
            success: false,
            message: "Server error while fetching sessions."
        });
    }
};

export const getTutorSessions = async (req, res) => {
    try {
        const tutorId = req.user.userId || req.user._id || req.user.id;
        const sessions = await Session.find({ tutorId })
            .populate("tutorId", "name email faculty userId")
            .populate("loggedStudents.studentId", "name email userId faculty")
            .sort({ date: -1, scheduledStartTime: -1 });

        res.status(200).json({
            success: true,
            count: sessions.length,
            data: sessions
        });
    } catch (error) {
        console.error("Error fetching tutor sessions:", error.message);
        res.status(500).json({
            success: false,
            message: "Server error while fetching tutor sessions."
        });
    }
};



