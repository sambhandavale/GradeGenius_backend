import { Request, Response, NextFunction } from "express";
import { IBaseRequest } from "../../interfaces/core_interfaces";
import KakshaModel from "../../models/Kaksha";
import { catchAsync } from "../../utils/utils";

export const createDoubt = catchAsync(
  async (req: IBaseRequest, res: Response, next: NextFunction) => {
    const { kakshaId, question } = req.body;
    const userId = req.user._id;

    if (!kakshaId || !question) {
      return res.status(400).json({ message: "Kaksha ID and question are required." });
    }

    const kaksha = await KakshaModel.findById(kakshaId);
    if (!kaksha) {
      return res.status(404).json({ message: "Kaksha not found." });
    }

    kaksha.doubts?.push({
      question,
      askedBy: userId,
      plusOnes: 0,
    });

    await kaksha.save();
    return res.status(201).json({ message: "Doubt added successfully." });
  }
);

export const plusOneDoubt = catchAsync(
    async (req: IBaseRequest, res: Response, next: NextFunction) => {
      const { kakshaId, doubtId } = req.body;
      const userId = req.user._id;
  
      if (!kakshaId || !doubtId) {
        return res.status(400).json({ message: "Kaksha ID and doubt ID are required." });
      }
  
      const kaksha = await KakshaModel.findById(kakshaId);
      if (!kaksha) {
        return res.status(404).json({ message: "Kaksha not found." });
      }
  
      const doubt = kaksha.doubts?.find((d) => d._id.toString() === doubtId);
      if (!doubt) {
        return res.status(404).json({ message: "Doubt not found." });
      }

      if (doubt.answer) {
        return res.status(409).json({ message: "This doubt is already answered. No need to upvote." });
      }

      if (doubt.askedBy.toString() === userId.toString()) {
        return res.status(403).json({ message: "You cannot upvote your own doubt." });
      }
  
      if (doubt.plusOneBy?.some((id) => id.toString() === userId.toString())) {
        return res.status(409).json({ message: "You've already upvoted this doubt." });
      }
  
      doubt.plusOnes += 1;
      doubt.plusOneBy = doubt.plusOneBy || [];
      doubt.plusOneBy.push(userId);
  
      await kaksha.save();
      return res.status(200).json({ message: "Plus one added to the doubt." });
    }
  );
  
  

export const answerDoubt = catchAsync(
  async (req: IBaseRequest, res: Response, next: NextFunction) => {
    const { kakshaId, doubtId, answer } = req.body;
    const userId = req.user._id;

    if (!kakshaId || !doubtId || !answer) {
      return res.status(400).json({ message: "Kaksha ID, doubt ID, and answer are required." });
    }

    const kaksha = await KakshaModel.findById(kakshaId);
    if (!kaksha) {
      return res.status(404).json({ message: "Kaksha not found." });
    }

    const doubt = kaksha.doubts?.find((d) => d._id.toString() === doubtId);
    if (!doubt) {
      return res.status(404).json({ message: "Doubt not found." });
    }

    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Only teachers or admins can answer doubts." });
    }

    if (doubt.answer) {
        return res.status(409).json({ message: "This doubt has already been answered." });
    }

    doubt.answer = answer;
    doubt.answeredBy = userId;

    await kaksha.save();
    return res.status(200).json({ message: "Doubt answered successfully." });
  }
);

export const listDoubts = catchAsync(
  async (req: IBaseRequest, res: Response, next: NextFunction) => {
    const { kakshaId } = req.query;

    if (!kakshaId) {
      return res.status(400).json({ message: "Kaksha ID is required." });
    }

    const kaksha = await KakshaModel.findById(kakshaId)
      .populate("doubts.askedBy", "name email role username")
      .populate("doubts.answeredBy", "name email role username")
      // .populate("doubts.plusOneBy", "name email role");

    if (!kaksha) {
      return res.status(404).json({ message: "Kaksha not found." });
    }

    return res.status(200).json({ doubts: kaksha.doubts });
  }
);
