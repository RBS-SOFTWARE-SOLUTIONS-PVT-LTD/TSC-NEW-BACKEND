import mongoose, { Schema } from "mongoose";

const sessionSchema = new Schema({
    tutorId : {
        type: mongoose.Schema.Types.ObjectId,
        ref : "User",
        required : true
    },
    subject : {
        type : String,
        required: true
    },
    topic : {
        type : String,
        required: true
    },
    type :{
        type : String,
        enum : ["physical", "online"],
        required: true
    },
    location : {
        type : String,
        required : true
    },
    meetingLink : {
        type : String,
    },
    date : {
        type : Date,
        required : true
    },

    scheduledStartTime: {
      type: Date,
      required: true
    },

    scheduledEndTime: {
      type: Date,
      required: true
    },

    actualStartTime: {
      type: Date
    },

    actualEndTime: {
      type: Date
    },

    durationMinutes: {
      type: Number,
      default: 0
    },

    numOfStudents: {
      type: Number,
      default: 0
    },

    status: {
      type: String,
      enum: [
        "scheduled",
        "active",
        "completed",
        "cancelled",
        "flagged"
      ],
      default: "scheduled"
    },
    qrCode: {
      type: String
    },

    qrExpiresAt: {
      type: Date
    }
  },
  {
    timestamps: true
  });


  const Session = mongoose.model("Session", sessionSchema);

  export default Session;