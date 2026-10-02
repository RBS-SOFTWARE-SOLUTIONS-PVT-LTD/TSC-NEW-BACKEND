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

/**
 * Calculates annual score for all active tutors for a specified year.
 * AS = (AHS * 30%) + (AMS * 70%)
 * AMS = Total Monthly Score / Number of months
 * AHS = (Tutor's Total Annual Hours / Highest Tutor Annual Hours) * 100
 * @param {number} year 
 */
export const getAnnualScoresService = async (year) => {
    const now = new Date();
    const currentYear = now.getUTCFullYear();

    let monthsCount = 12;
    if (year === currentYear) {
        monthsCount = now.getUTCMonth() + 1;
    } else if (year > currentYear) {
        monthsCount = 1;
    }

    const startDate = new Date(Date.UTC(year, 0, 1, 0, 0, 0));
    const endDate = year === currentYear
        ? now
        : new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));

    // 1. Get all active tutors
    const tutors = await User.find({ role: "tutor", status: { $ne: "suspended" } }).select("name email userId");

    if (tutors.length === 0) {
        return {
            period: `${year}`,
            year,
            monthsEvaluated: monthsCount,
            startDate,
            endDate,
            tutorScores: []
        };
    }

    const tutorIds = tutors.map(t => t._id);

    // 2. Compute total annual hours per tutor in the year
    const annualSessionHours = await Session.aggregate([
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

    const annualHoursMap = new Map();
    annualSessionHours.forEach(ash => {
        annualHoursMap.set(ash._id.toString(), {
            totalHours: Number((ash.totalMinutes / 60).toFixed(2)),
            totalSessions: ash.totalSessions
        });
    });

    let highestTutorAnnualHours = 0;
    tutors.forEach(tutor => {
        const data = annualHoursMap.get(tutor._id.toString());
        const hours = data ? data.totalHours : 0;
        if (hours > highestTutorAnnualHours) {
            highestTutorAnnualHours = hours;
        }
    });

    // 3. Compute Total Monthly Score for each tutor across evaluated months
    const monthlyScoresSumMap = new Map();
    tutors.forEach(t => monthlyScoresSumMap.set(t._id.toString(), 0));

    for (let month = 1; month <= monthsCount; month++) {
        let monthlyData;
        if (year === currentYear && month === monthsCount) {
            monthlyData = await getLiveScoresService();
        } else {
            monthlyData = await getMonthlyScoresService(year, month);
        }

        if (monthlyData && monthlyData.tutorScores) {
            monthlyData.tutorScores.forEach(ts => {
                const tid = ts.tutorId.toString();
                if (monthlyScoresSumMap.has(tid)) {
                    const currentSum = monthlyScoresSumMap.get(tid);
                    monthlyScoresSumMap.set(tid, currentSum + (ts.scores?.monthlyScore_MS || 0));
                }
            });
        }
    }

    // 4. Calculate Annual Score (AS) for each tutor
    const results = tutors.map(tutor => {
        const tid = tutor._id.toString();
        const annualData = annualHoursMap.get(tid) || { totalHours: 0, totalSessions: 0 };
        const tutorAnnualHours = annualData.totalHours;
        const totalMonthlyScore = monthlyScoresSumMap.get(tid) || 0;

        // AMS = Total Monthly Score / Number of months
        const averageMonthlyScore_AMS = Number((totalMonthlyScore / monthsCount).toFixed(2));

        // AHS = (Tutor's Total Annual Hours / Highest Tutor Annual Hours) * 100
        const annualHourScore_AHS = highestTutorAnnualHours > 0
            ? Number(((tutorAnnualHours / highestTutorAnnualHours) * 100).toFixed(2))
            : 0;

        // AS = (AHS * 30%) + (AMS * 70%)
        const annualScore_AS = Number(((annualHourScore_AHS * 0.30) + (averageMonthlyScore_AMS * 0.70)).toFixed(2));
        const award = getAwardTier(annualScore_AS);

        return {
            tutorId: tutor._id,
            userId: tutor.userId,
            name: tutor.name,
            email: tutor.email,
            metrics: {
                totalAnnualHours: tutorAnnualHours,
                totalAnnualSessions: annualData.totalSessions,
                highestTutorAnnualHours,
                totalMonthlyScoreSum: Number(totalMonthlyScore.toFixed(2)),
                monthsEvaluated: monthsCount
            },
            scores: {
                averageMonthlyScore_AMS,
                annualHourScore_AHS,
                annualScore_AS,
                award
            }
        };
    });

    // Sort by Annual Score (AS) descending
    results.sort((a, b) => b.scores.annualScore_AS - a.scores.annualScore_AS);

    // Assign rank
    const tutorScores = results.map((item, index) => ({
        rank: index + 1,
        ...item
    }));

    return {
        period: `${year}`,
        year,
        monthsEvaluated: monthsCount,
        startDate,
        endDate,
        tutorScores
    };
};

/**
 * Helper to determine award tier based on Annual Score (AS).
 * 90-100: Gold
 * 80-89.99: Silver
 * 70-79.99: Bronze
 * Below 70: No award
 */
export const getAwardTier = (score) => {
    if (score >= 90) return "Gold";
    if (score >= 80) return "Silver";
    if (score >= 70) return "Bronze";
    return "No award";
};

/**
 * Calculates and returns annual awards summary and list for tutors in a specified year.
 * @param {number} year 
 */
export const getAnnualAwardsService = async (year) => {
    const annualScoreData = await getAnnualScoresService(year);
    const tutorScores = annualScoreData.tutorScores || [];

    let goldCount = 0;
    let silverCount = 0;
    let bronzeCount = 0;
    let noAwardCount = 0;

    const tutorAwards = tutorScores.map(t => {
        const award = t.scores?.award || getAwardTier(t.scores?.annualScore_AS || 0);
        if (award === "Gold") goldCount++;
        else if (award === "Silver") silverCount++;
        else if (award === "Bronze") bronzeCount++;
        else noAwardCount++;

        return {
            rank: t.rank,
            tutorId: t.tutorId,
            userId: t.userId,
            name: t.name,
            email: t.email,
            annualScore_AS: t.scores?.annualScore_AS || 0,
            award
        };
    });

    return {
        period: annualScoreData.period,
        year: annualScoreData.year,
        monthsEvaluated: annualScoreData.monthsEvaluated,
        awardSummary: {
            goldCount,
            silverCount,
            bronzeCount,
            noAwardCount,
            totalTutors: tutorAwards.length
        },
        tutorAwards
    };
};



