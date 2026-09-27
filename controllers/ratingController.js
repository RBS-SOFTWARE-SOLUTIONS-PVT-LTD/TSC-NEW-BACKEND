import { getTutorRatingById,getHighestRatedTutor } from "../services/ratingService.js";

export const getTutorRating = async (req, res) => {
    try {

        const { tutorId } = req.params;

        const tutorRating = await getTutorRatingById(tutorId);

        if (!tutorRating) {
            return res.status(404).json({
                success: false,
                message: "No ratings found for this tutor"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Tutor rating retrieved successfully",
            data: tutorRating
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


export const getHighestRatedTutorController = async (req, res) => {
    try {

        const tutor = await getHighestRatedTutor();

        if (!tutor) {
            return res.status(404).json({
                success: false,
                message: "No tutor ratings found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Highest rated tutor retrieved successfully",
            data: tutor
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};