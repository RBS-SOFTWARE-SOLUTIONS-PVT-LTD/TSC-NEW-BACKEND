import Admin from "../models/Admin.js";
import {hashPassword,comparePassword } from "../utils/hashPassword.js";
import { generateToken } from "../utils/generateToken.js";

export const createAdmin = async (email, password) => {

  const existingAdmin = await Admin.findOne({ email });

  if (existingAdmin) {
    throw new Error("Admin with this email already exists");
  }

  const hashedPassword = await hashPassword(password);

  const admin = await Admin.create({
    email,
    password: hashedPassword
  });

  return admin;
};


export const loginUser = async (email, password) => {
  const user = await Admin.findOne({ email });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const isPasswordCorrect = await comparePassword(
    password,
    user.password
  );

  if (!isPasswordCorrect) {
    throw new Error("Invalid email or password");
  }

  if (user.status !== "active") {
    throw new Error("Your account is inactive");
  }

  const token = generateToken(user);

  return {
    token,
    user: {
      email: user.email,
    }
  };
};