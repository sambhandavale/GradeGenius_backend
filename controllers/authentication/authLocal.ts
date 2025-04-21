import Users from "../../models/Users";
import { Response, Request, NextFunction } from "express";
import { sign, verify } from "jsonwebtoken";

export const signup = (req: Request, res: Response) => {
  const { username, email, password, role } = req.body;

  Users.findOne({ email: email })
    .then((user: any) => {
      if (user) {
        return res.status(400).json({
          error: "Email is taken",
        });
      }

      const newUser = new Users({
        username,
        email,
        password,
        role,
      });

      newUser
        .save()
        .then((savedUser: any) => {
          const jwtToken = sign(
            { _id: savedUser._id },
            process.env.JWT_SECRET ?? "",
            { expiresIn: "7h" }
          );

          res.cookie("jwt", jwtToken, {
            expires: new Date(Date.now() + 7 * 60 * 60 * 1000), // 7 hours
            httpOnly: true,
            secure: req.secure || req.headers["x-forwarded-proto"] === "https",
          });

          return res.status(200).json({
            jwtToken,
            user: savedUser,
            message: `${username} is enrolled successfully. Welcome to the party!!`,
          });
        })
        .catch((err) => {
          return res.status(500).json({
            error: "Signup failed. Please try again.",
            details: err,
          });
        });
    })
    .catch((err) => {
      return res.status(500).json({
        error: "Internal server error during signup",
        details: err,
      });
    });
};

export const signin = (req: Request, res: Response) => {
    const { email, password } = req.body;
    Users.findOne({ email })
      .then((user: any) => {
        if (!user.authenticate(password)) {
          return res.status(400).json({
            error: "Email and password do not match",
          });
        }
        console.log(`${user.username} Logged In`);
        const jwtToken = sign({ _id: user._id }, process.env.JWT_SECRET ?? "", {
          expiresIn: "7h",
        });
  
        res.cookie("jwt", jwtToken, {
          expires: new Date(Date.now() + 7 * 60 * 60 * 1000),
          httpOnly: true,
          secure: req.secure || req.headers["x-forwarded-proto"] === "https",
        });
  
        return res.json({
          jwtToken,
          user: user,
        });
      })
      .catch((err) => {
        if (err) {
          return res.status(400).json({
            error: "User does not exist. Please signup",
            err,
          });
        }
      });
};