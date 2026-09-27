import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
    {
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        sessionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Session",
            required: true
        },

        tutorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 10
        },

        comment: {
            type: String,
            trim: true,
            maxlength: 1000
        }
    },
    {
        timestamps: true
    }
);

// One student can give only one feedback for one session
feedbackSchema.index(
    { studentId: 1, sessionId: 1 },
    { unique: true }
);

const Feedback = mongoose.model("Feedback", feedbackSchema);

export default Feedback;