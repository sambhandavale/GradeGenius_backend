import { Response, NextFunction } from "express";
import mongoose from "mongoose";
import { catchAsync } from "../../utils/utils";
import UserModel from "../../models/Users";
import { IBaseRequest } from "../../interfaces/core_interfaces";

export const getUserDetails = catchAsync(
  async (req: IBaseRequest, res: Response, next: NextFunction) => {
    const userId = req.user._id;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId.toString())) {
      return res.status(400).json({ message: "invalid userId" });
    }

    const user = await UserModel.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "user not found" });
    }

    res.status(200).json({ user });
  }
);

export const updateUserDetails = catchAsync(
  async (req: IBaseRequest, res: Response, next: NextFunction) => {
    const userId = req.user._id;
    const { name, email } = req.body;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId.toString())) {
      return res.status(400).json({ message: "invalid userId" });
    }

    const user = await UserModel.findByIdAndUpdate(
      userId,
      { name, email },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "user details updated successfully",
      user,
    });
  }
);

export const deleteUser = catchAsync(
  async (req: IBaseRequest, res: Response, next: NextFunction) => {
    const userId = req.user._id;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId.toString())) {
      return res.status(400).json({ message: "invalid userId" });
    }

    const deletedUser = await UserModel.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ message: "user not found" });
    }

    res.status(200).json({
      message: "user deleted successfully",
      success: true,
    });
  }
);
