import User from "../models/User.js";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken";

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

export const Login = async (req, res)=>{
    try {
        const {email, password} = req.body;

        //check if both given
        if(!email || !password){
            return res.status(400).json({
                success: false,
                message: "Email and password 're required!"
            });
        }

        //find user
        const user = await User.findOne({ email });

        if(!user){
            return res.status(401).json({
                success: false,
                message : "Invalid email or password!"
            });
        }

        //check pswd
        const isPasswordCorrect = await bcrypt.compare(
            password, user.password
        );

        if(!isPasswordCorrect){
            return res.status(401).json({
                success: false,
                message: "Invalid email or password!"
            });
        }

        if(user.status == "suspended"){
            return res.status(403).json({
                success: false,
                message: "User account has been suspended!"
            });
        }

        //create jwt
        const token = await jwt.sign(
            {
                userId : user._id,
                role : user.role
            },
            "thawakalika password eka",
            {
                expiresIn: "7d"
            }
        );

        //send respons
        res.status(200).json({
            success: true,
            message : "User login in successfully!",
            user : {
                id : user._id,
                name : user.name,
                email : user.email,
                role : user.role,
                faculty : user.faculty,
            },
            token : token
        })
    } catch (error) {
        console.log("Error: "+ error.nessage);
        res.status(500).json({
            success: false,
            message : "Internal Sever Error!"
        });
    }
}