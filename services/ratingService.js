import mongoose from "mongoose";
import Feedback from "../models/feedback.js";

export const getTutorRatingById = async (tutorId) => {

    const result = await Feedback.aggregate([
        {
            $match: {
                tutorId: new mongoose.Types.ObjectId(tutorId)
            }
        },

        {
            $group: {
                _id: "$tutorId",
                averageRating: { $avg: "$rating" },
                totalFeedbacks: { $sum: 1 }
            }
        },

        {
            $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "tutor"
            }
        },

        {
            $unwind: "$tutor"
        },

        {
            $project: {
                _id: 0,
                tutorId: "$_id",
                userId: "$tutor.userId",
                name: "$tutor.name",

                // Convert 10-point rating to 5-star rating
                averageRating: {
                    $round: [
                        {
                            $divide: ["$averageRating", 2]
                        },
                        2
                    ]
                },

                totalFeedbacks: 1
            }
        }
    ]);

    return result[0] || null;
};


export const getHighestRatedTutor = async () => {
    const result = await Feedback.aggregate([
        {
            $group: {
                _id: "$tutorId",
                averageRating: { $avg: "$rating" },
                totalFeedbacks: { $sum: 1 }
            }
        },

        // Highest average rating first
        {
            $sort: {
                averageRating: -1
            }
        },

        // Get only the first tutor
        {
            $limit: 1
        },

        // Get tutor information
        {
            $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "tutor"
            }
        },

        {
            $unwind: "$tutor"
        },

        {
            $project: {
                _id: 0,
                tutorId: "$_id",
                userId: "$tutor.userId",
                name: "$tutor.name",

                // Convert 10-point rating to 5-star rating
                averageRating: {
                    $round: [
                        {
                            $divide: ["$averageRating", 2]
                        },
                        2
                    ]
                },

                totalFeedbacks: 1
            }
        }
    ]);

    return result[0] || null;
};