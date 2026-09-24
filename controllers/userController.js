import User from "../models/User.js";
import bcrypt from "bcrypt"

export const SignUp = async (req, res)=>{
    try {
        const {userId, name, email, password, role, faculty, status} = req.body;
        
        //check is user exists
        const existingUser = await User.findOne({$or: [{email}, {userId}]});
        if(existingUser) {
            return res.status(400).json({
                message : "User already exists!",
                success : false
            });
        } 

        //Hash pwd
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        //create new user
        const newUser = new User({
            userId, name, email, 
            password : hashedPassword,
            role, faculty, status
        }) ;

        await newUser.save();

        //send success response
        res.status(201).json({
            success: true,
            message : "User created successfully",
            createdUser : {
                userId : newUser.userId,
                name : newUser.name,
                email : newUser.email,
                faculty : newUser.faculty,

            }
        });

    } catch (error) {
        console.log("Error: "+ error.message);
        res.status(500).json({
            success : false,
            message: "Server error during registration"
        });
    }
}

export const getAllUsers = async (req, res)=>{
    try {
        const users = await User.find().select("-password");

        res.status(200).json({
            success: true,
            userCount: users.length,
            data : users
        });


    } catch (error) {
        console.log("Error: "+ error.message);
        res.status(500).json({
            success : false,
            message: "Server error during Fetch users 👎"
        });
    }
}