import mongoose, { ObjectId, Schema } from "mongoose";
import { IDoubt, IFile, IFolder, IKaksha, IPost } from "../interfaces/interfaces";

const DoubtSchema = new mongoose.Schema<IDoubt>(
    {
        question: {
            type: String,
            required: true,
        },
        answer: {
            type: String,
        },
        askedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        answeredBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        plusOnes: {
            type: Number,
            default: 0,
        },
        plusOneBy: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
    },
    {
        timestamps: true,
    }
);

const FileSchema = new mongoose.Schema<IFile>(
    {
      filename: String,
      fileId: mongoose.Schema.Types.ObjectId,
      uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      contentType: String,
      size: Number,
    },
    { 
        timestamps: { createdAt: "uploadedAt", updatedAt: false } 
    }
  );
  
  const FolderSchema = new mongoose.Schema<IFolder>(
    {
      name: { type: String, required: true },
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      files: [FileSchema],
    },
    { 
        timestamps: true 
    }
  );
  
  const PostSchema = new mongoose.Schema<IPost>(
    {
      title: { type: String, required: true },
      content: { type: String },
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      type: {
        type: String,
        enum: ['announcement', 'assignment'],
      },
      typeId: {
        type: Schema.Types.ObjectId,
        refPath: 'posts.type'
      },
    },
    { 
        timestamps: true 
    }
  );
  

const KakshaSchema = new mongoose.Schema<IKaksha>(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        members: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        inviteCode: {
            type: String,
            unique: true,
            sparse: true,
        },
        doubts: [DoubtSchema],
        posts: [PostSchema],
        fileManager: [FolderSchema],
    },
    {
        timestamps: true,
    }
);

const KakshaModel = mongoose.model<IKaksha>("Kaksha", KakshaSchema);

export default KakshaModel;
