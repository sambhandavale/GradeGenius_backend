import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { catchAsync } from "../../utils/utils";
import UserModel from "../../models/Users";
import { IBaseRequest } from "../../interfaces/core_interfaces";

export const getUserDetails = catchAsync(
  async (req: IBaseRequest, res: Response, next: NextFunction) => {
    const userId = req.user._id;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId.toString())) {
      return res.status(400).json({ message: "Invalid or missing userId" });
    }

    const user = await UserModel.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user });
  }
);
