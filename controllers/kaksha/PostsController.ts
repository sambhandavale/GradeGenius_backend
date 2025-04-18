import { NextFunction, Request, Response } from "express";
import KakshaModel from "../../models/Kaksha";
import { catchAsync } from "../../utils/utils";
import Users from "../../models/Users";

export const getKakshaPosts = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const { kaksha_id } = req.query;

        const kaksha = await KakshaModel.findById(kaksha_id).populate({
            path: "posts",
            populate: {
                path: "createdBy",
                select: "name email role username",
            },
        });

        if (!kaksha) {
            return res.status(404).json({ message: "Kaksha not found" });
        }

        return res.status(200).json({ message: "Posts fetched successfully", posts: kaksha.posts });
    }
);
