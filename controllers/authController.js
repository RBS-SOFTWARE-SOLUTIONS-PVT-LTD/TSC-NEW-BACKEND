import {createAdmin,loginUser} from "../services/authService.js";

export const registerAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    const admin = await createAdmin(
      email,
      password
    );

    res.status(201).json({
      message: "Admin created successfully",
      admin: {
        email: admin.email,
      }
    });

  } catch (error) {
    res.status(400).json({
      message: error.message
    });
  }
};


export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    const result = await loginUser(
      email,
      password
    );

    res.status(200).json(result);

  } catch (error) {
    res.status(401).json({
      message: error.message
    });
  }
};