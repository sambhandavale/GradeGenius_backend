import { Request, Response, NextFunction } from "express";
import { IBaseRequest } from "../../interfaces/core_interfaces";
import AssignmentModel from "../../models/Assignments";
import KakshaModel from "../../models/Kaksha";
import { catchAsync } from "../../utils/utils";
import mongoose from "mongoose";

interface GridFSFile extends Express.Multer.File {
  id: string;
  filename: string;
}

let gfs: mongoose.mongo.GridFSBucket;

mongoose.connection.once("open", () => {
  gfs = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: "uploads",
  });
});

export const createAssignment = catchAsync(
  async (req: IBaseRequest, res: Response, next: NextFunction) => {
    const { title, description, kaksha, dueDate } = req.body;
    const user = req.user;

    if (!["teacher", "admin"].includes(user.role)) {
      return res.status(403).json({ message: "Only teachers/admins can create assignments." });
    }

    const kakshaDoc = await KakshaModel.findById(kaksha);
    if (!kakshaDoc) {
      return res.status(404).json({ message: "Kaksha not found." });
    }

    if (kakshaDoc.createdBy.toString() !== user._id.toString()) {
      return res.status(403).json({ message: "Only the creator of the Kaksha can create assignments for it." });
    }   

    const files = req.files as GridFSFile[] | undefined;
    console.log('Incoming files:', req.files);
    const attachments = files?.map((file) => ({
      fileId: file.id,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      contentType: file.mimetype
    })) || [];

    const assignment = new AssignmentModel({
      title,
      description,
      kaksha,
      createdBy: user._id,
      dueDate,
      attachments,
    });

    await assignment.save();

    kakshaDoc.posts.push({
      title: title,
      content: `${title} is now live. Due on ${new Date(dueDate).toDateString()}.`,
      createdBy: user._id,
      type:'assignment',
      typeId:assignment._id,
    });
    await kakshaDoc.save();

    res.status(201).json({ message: "Assignment created successfully", assignment });
  }
);

export const downloadAssignmentAttachment = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { fileId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return res.status(400).json({ message: "Invalid file ID" });
    }

    const _id = new mongoose.Types.ObjectId(fileId);

    const downloadStream = gfs.openDownloadStream(_id);

    downloadStream.on("file", (file) => {
      res.setHeader("Content-Type", file.contentType);
      res.setHeader("Content-Disposition", `attachment; filename="${file.filename}"`);
    });

    downloadStream.on("error", (err) => {
      return res.status(404).json({ message: "File not found" });
    });

    downloadStream.pipe(res);
  }
);

export const getAssignmentDetails = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { assignmentId } = req.query;

    if (!assignmentId) {
      return res.status(400).json({ message: "Provide Assignment ID" });
    }

    const assignment = await AssignmentModel.findById(assignmentId)
      .populate("kaksha", "name description");

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    res.status(200).json({ assignment });
  }
);

export const submitAssignment = catchAsync(
  async (req: IBaseRequest, res: Response, next: NextFunction) => {
    const { assignmentId } = req.query;
    const user = req.user;

    if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
      return res.status(400).json({ message: "Invalid assignment ID" });
    }

    const assignment = await AssignmentModel.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    // Ensure the user is a student
    if (user.role !== "student") {
      return res.status(403).json({ message: "Only students can submit assignments" });
    }

    // Check for existing submission
    const alreadySubmitted = assignment.submissions.find(
      (sub) => sub.student.toString() === user._id.toString()
    );
    if (alreadySubmitted) {
      return res.status(409).json({ message: "You have already submitted this assignment" });
    }

    const files = req.files as GridFSFile[] | undefined;
    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const submissionFiles = files.map((file) => ({
      fileId: file.id,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      contentType: file.mimetype,
    }));

    assignment.submissions.push({
      student: user._id,
      submittedAt: new Date(),
      files: submissionFiles,
    });

    await assignment.save();

    return res.status(201).json({ message: "Assignment submitted successfully" });
  }
);

export const listSubmissions = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { assignmentId } = req.query;

    if (!assignmentId) {
      return res.status(400).json({ message: "Provide Assignment ID" });
    }

    const assignment = await AssignmentModel.findById(assignmentId)
      .populate("submissions.student", "name email")
      .select("title submissions");

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    res.status(200).json({
      message: "Submissions fetched successfully",
      assignmentTitle: assignment.title,
      submissions: assignment.submissions,
    });
  }
);

export const downloadStudentSubmission = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { assignmentId, studentId, fileId } = req.query;

    if (
      !assignmentId || !studentId || !fileId ||
      !mongoose.Types.ObjectId.isValid(assignmentId.toString()) ||
      !mongoose.Types.ObjectId.isValid(studentId.toString()) ||
      !mongoose.Types.ObjectId.isValid(fileId.toString())
    ) {
      return res.status(400).json({ message: "Invalid query parameters" });
    }

    const assignment = await AssignmentModel.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    const submission = assignment.submissions.find(
      (sub) => sub.student.toString() === studentId
    );

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    const file = submission.files.find(
      (f) => f.fileId.toString() === fileId
    );

    if (!file) {
      return res.status(404).json({ message: "File not found in submission" });
    }

    const db = mongoose.connection.db;
    const bucket = new mongoose.mongo.GridFSBucket(db, {
      bucketName: "uploads", // change if you're using a different bucket
    });

    res.set("Content-Disposition", `attachment; filename="${file.filename}"`);
    res.set("Content-Type", file.contentType || "application/octet-stream");

    bucket.openDownloadStream(new mongoose.Types.ObjectId(fileId.toString())).pipe(res);
  }
);