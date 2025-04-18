import mongoose, { ObjectId } from "mongoose";
import { IAssignment } from "../interfaces/interfaces";

const AssignmentSchema = new mongoose.Schema<IAssignment>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
    },
    kaksha: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Kaksha",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    dueDate: {
      type: Date,
    },
    grade:{
        type:Number,
    },
    attachments: [
      {
        fileId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
        },
        filename: {
          type: String,
          required: true,
        },
      },
    ],
    submissions: [
      {
        student: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        submittedAt: {
          type: Date,
          default: Date.now,
        },
        files: [
          {
            fileId: {
              type: mongoose.Schema.Types.ObjectId,
              required: true,
            },
            filename: {
              type: String,
              required: true,
            },
            originalName: {
              type: String,
            },
            size: {
              type: Number,
            },
            contentType: {
              type: String,
            },
          },
        ],        
        marks: {
          type: Number,
        },
        feedback: {
          type: String,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const AssignmentModel = mongoose.model<IAssignment>("Assignment", AssignmentSchema);

export default AssignmentModel;
