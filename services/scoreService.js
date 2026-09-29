import mongoose from "mongoose";
import User from "../models/User.js";
import Session from "../models/Session.js";
import Feedback from "../models/feedback.js";

/**
 * Common pipeline to calculate scores given a date range.
 * @param {Date} startDate 
 * @param {Date} endDate 
 */
export const calculateScoresByDateRange = async (startDate, endDate) => {
    // 1. Get all active tutors
    const tutors = await User.find({ role: "tutor", status: { $ne: "suspended" } }).select("name email userId");

    if (tutors.length === 0) {
        return [];
    }

    const tutorIds = tutors.map(t => t._id);

    // 2. Aggregate completed session hours per tutor in date range
    const sessionHours = await Session.aggregate([
        {
            $match: {
                tutorId: { $in: tutorIds },
                status: "completed",
                date: { $gte: startDate, $lte: endDate }
            }
        },
        {
            $group: {
                _id: "$tutorId",
                totalMinutes: { $sum: "$durationMinutes" },
                totalSessions: { $sum: 1 }
            }
        }
    ]);

    // 3. Aggregate feedback ratings per tutor in date range
    const feedbackRatings = await Feedback.aggregate([
        {
            $match: {
                tutorId: { $in: tutorIds },
                createdAt: { $gte: startDate, $lte: endDate }
            }
        },
        {
            $group: {
                _id: "$tutorId",
                averageRating10: { $avg: "$rating" },
                totalFeedbacks: { $sum: 1 }
            }
        }
    ]);

    // Create lookup maps for fast access
    const hoursMap = new Map();
    sessionHours.forEach(sh => {
        hoursMap.set(sh._id.toString(), {
            totalHours: Number((sh.totalMinutes / 60).toFixed(2)),
            totalSessions: sh.totalSessions
        });
    });

    const ratingMap = new Map();
    feedbackRatings.forEach(fr => {
        const avg5Star = Number((fr.averageRating10 / 2).toFixed(2));
        ratingMap.set(fr._id.toString(), {
            averageRating: avg5Star,
            totalFeedbacks: fr.totalFeedbacks
        });
    });

    // Determine the highest tutor hours in this date range
    let highestTutorHours = 0;
    tutors.forEach(tutor => {
        const tutorHoursData = hoursMap.get(tutor._id.toString());
        const hours = tutorHoursData ? tutorHoursData.totalHours : 0;
        if (hours > highestTutorHours) {
            highestTutorHours = hours;
        }
    });

    // 4. Calculate scores for each tutor
    const results = tutors.map(tutor => {
        const tid = tutor._id.toString();
        const hourData = hoursMap.get(tid) || { totalHours: 0, totalSessions: 0 };
        const ratingData = ratingMap.get(tid) || { averageRating: 0, totalFeedbacks: 0 };

        const tutorHours = hourData.totalHours;
        const avgRating5 = ratingData.averageRating;

        // HS Calculation: (Tutor Hours / Highest Hours) * 100
        const hourScore_HS = highestTutorHours > 0
            ? Number(((tutorHours / highestTutorHours) * 100).toFixed(2))
            : 0;

        // RS Calculation: (Avg Rating out of 5 / 5) * 100
        const ratingScore_RS = Number(((avgRating5 / 5) * 100).toFixed(2));

        // MS Calculation: (HS * 40%) + (RS * 60%)
        const monthlyScore_MS = Number(((hourScore_HS * 0.40) + (ratingScore_RS * 0.60)).toFixed(2));

        return {
            tutorId: tutor._id,
            userId: tutor.userId,
            name: tutor.name,
            email: tutor.email,
            metrics: {
                totalHours: tutorHours,
                totalSessions: hourData.totalSessions,
                averageRating: avgRating5,
                totalFeedbacks: ratingData.totalFeedbacks,
                highestTutorHoursInPeriod: highestTutorHours
            },
            scores: {
                hourScore_HS,
                ratingScore_RS,
                monthlyScore_MS
            }
        };
    });

    // Sort by Monthly Score (MS) descending
    results.sort((a, b) => b.scores.monthlyScore_MS - a.scores.monthlyScore_MS);

    // Assign rank
    return results.map((item, index) => ({
        rank: index + 1,
        ...item
    }));
};

/**
 * Calculates live score for the current ongoing month (1st of month to NOW).
 */
export const getLiveScoresService = async () => {
    const now = new Date();
    const startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
    const endDate = now;

    const scores = await calculateScoresByDateRange(startDate, endDate);
    return {
        period: "Current Live Month",
        startDate,
        endDate,
        tutorScores: scores
    };
};

/**
 * Calculates monthly score for a specified month and year.
 * @param {number} year 
 * @param {number} month 1-indexed (1 = Jan, 12 = Dec)
 */
export const getMonthlyScoresService = async (year, month) => {
    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    const scores = await calculateScoresByDateRange(startDate, endDate);
    return {
        period: `${year}-${String(month).padStart(2, '0')}`,
        startDate,
        endDate,
        tutorScores: scores
    };
};

/**
 * Calculates and returns the logged-in tutor's own live score & rank for the current month.
 * @param {string} tutorId 
 */
export const getTutorOwnCurrentScoreService = async (tutorId) => {
    const liveData = await getLiveScoresService();
    const tutorScores = liveData.tutorScores;

    const myScoreData = tutorScores.find(
        t => t.tutorId.toString() === tutorId.toString() || t.userId === tutorId
    );

    if (!myScoreData) {
        return null;
    }

    return {
        period: liveData.period,
        startDate: liveData.startDate,
        endDate: liveData.endDate,
        totalTutors: tutorScores.length,
        ...myScoreData
    };
};

