import mongoose, { Schema } from "mongoose";

const userSchema = new Schema({
    userId : {
        type : String,
        required: true,
        unique: true
    },
    name : {
        type : String,
        required: true,
        trim: true
    },
    email : {
        type : String,
        required: true,
        unique: true,
        lowercase : true,
        trim : true
    },
    password : {
        type : String,
        required: true
    },
    role : {
        type : String,
        enum : ["student", "tutor"],
        required: true
    },
    faculty : {
        type : String,
        required : true
    },
    status : {
        type : String,
        required : true
    }
});

const User = mongoose.model("User", userSchema);
export default User;