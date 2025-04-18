import { NextFunction, Request, Response } from "express";
import KakshaModel from "../../models/Kaksha";
import crypto from "crypto";
import { IBaseRequest } from "../../interfaces/core_interfaces";
import { catchAsync } from "../../utils/utils";
import Users from "../../models/Users";
import { IUser } from "../../interfaces/interfaces";
import UserModel from "../../models/Users";
import Assignments from "../../models/Assignments";
import mongoose from "mongoose";

let gfs: mongoose.mongo.GridFSBucket;

mongoose.connection.once("open", () => {
  gfs = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: "uploads",
  });
});

export const createKaksha = catchAsync(
    async (req: IBaseRequest, res: Response, next: NextFunction) => {
        const { name, description } = req.body;
        const user = req.user._id;

        if (req.user.role !== "teacher") {
            return res.status(403).json({ message: "Only teachers can create a Kaksha." });
        }

        if (!name || !user) {
            return res.status(400).json({ message: "Name and creator are required" });
        }

        const existing = await KakshaModel.findOne({ name });
        if (existing) {
            return res.status(400).json({ message: "Kaksha with this name already exists" });
        }

        const inviteCode = crypto.randomBytes(4).toString("hex");

        const kaksha = new KakshaModel({
            name,
            description,
            createdBy: user,
            members: [],
            inviteCode,
        });

        await Users.findByIdAndUpdate(user, {
            $push: { kakshas: kaksha._id },
        });

        await kaksha.save();

        return res.status(201).json({ message: "Kaksha created successfully", kaksha });
    }
);

export const joinKaksha = catchAsync(
    async (req: IBaseRequest, res: Response, next: NextFunction) => {
        const { kakshacode } = req.body;
        const userId = req.user._id;

        if (!kakshacode) {
            return res.status(400).json({ message: "Invite code is required" });
        }

        const kaksha = await KakshaModel.findOne({ inviteCode: kakshacode });

        if (!kaksha) {
            return res.status(404).json({ message: "Kaksha not found with this invite code" });
        }

        if (kaksha.members.includes(userId)) {
            return res.status(400).json({ message: "You are already a member of this Kaksha" });
        }

        kaksha.members.push(userId);
        await kaksha.save();

        await Users.findByIdAndUpdate(userId, {
            $push: { teams: kaksha._id },
        });

        return res.status(200).json({ message: "Successfully joined Kaksha", kaksha });
    }
);

export const getUserKakshas = catchAsync(
    async (req: IBaseRequest, res: Response, next: NextFunction) => {
        const userId = req.user._id;
        const role = req.user.role;

        const user = await UserModel.findById(userId).populate('kakshas', 'name description createdBy members inviteCode');

        if (!user || !user.kakshas || user.kakshas.length === 0) {
            return res.status(404).json({ message: "You are not a member of any Kaksha." });
        }

        return res.status(200).json({ 
            message: "Kakshas retrieved successfully", 
            kakshas: user.kakshas,
            no_of_kaksha: user.kakshas.length 
        });
    }
);

export const deleteKaksha = catchAsync(
    async (req: IBaseRequest, res: Response, next: NextFunction) => {
      const { kakshaId } = req.query;
      const userId = req.user._id;
  
      // Find the Kaksha document
      const kaksha = await KakshaModel.findById(kakshaId);
      if (!kaksha) {
        return res.status(404).json({ message: "Kaksha not found" });
      }
  
      if (kaksha.createdBy.toString() !== userId.toString()) {
        return res.status(403).json({ message: "Only the creator can delete this Kaksha" });
      }
  
      // Step 1: Delete all assignments associated with the Kaksha
      const assignments = await Assignments.find({ kaksha: kakshaId });
  
      for (const assignment of assignments) {
        // Step 2: Delete any files associated with the assignment from GridFS
        if (assignment.attachments && assignment.attachments.length > 0) {
            for (const attachment of assignment.attachments) {
              // We can pass the fileId directly since it's already a mongoose.ObjectId
              await deleteFileFromGridFS(attachment.fileId); 
            }
          }          
        // Step 3: Delete the assignment itself from MongoDB
        await Assignments.findByIdAndDelete(assignment._id);
      }
  
      // Step 4: Delete any files associated with the Kaksha from fileManager (folders/files)
      if (kaksha.fileManager && kaksha.fileManager.length > 0) {
        for (const folder of kaksha.fileManager) {
          for (const file of folder.files) {
            await deleteFileFromGridFS(file.fileId); // Delete from GridFS
          }
        }
      }
  
      // Step 5: Remove the Kaksha from users' teams
      await Users.updateMany({ kakshas: kaksha._id }, {
        $pull: { kakshas: kaksha._id }
      });
  
      // Step 6: Delete the Kaksha itself
      await KakshaModel.findByIdAndDelete(kakshaId);
  
      return res.status(200).json({ message: "Kaksha deleted successfully" });
    }
  );
  

    async function deleteFileFromGridFS(fileId) {
    try {
        const _fileId = new mongoose.Types.ObjectId(fileId);
        await gfs.delete(_fileId);
        console.log(`File with ID ${fileId} deleted successfully from GridFS.`);
    } catch (error) {
        console.error(`Error deleting file with ID ${fileId} from GridFS:`, error);
        throw new Error('Error deleting file from GridFS');
    }
    }

