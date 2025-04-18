import { catchAsync } from "../../utils/utils";
import { IBaseRequest } from "../../interfaces/core_interfaces";
import { Response } from "express";
import Kaksha from "../../models/Kaksha";
import mongoose from "mongoose";
import { GridFSBucket } from "mongodb";

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

export const createFolder = catchAsync(
  async (req: IBaseRequest, res: Response) => {
    const {kakshaId} = req.query;
    const {name} = req.body;
    const user = req.user;

    const kaksha = await Kaksha.findById(kakshaId);
    if (!kaksha) return res.status(404).json({ message: "Kaksha not found" });

    kaksha.fileManager.push({
      name,
      createdBy: user._id,
      files: [],
    });

    await kaksha.save();
    res.status(201).json({ message: "Folder created successfully" });
  }
);

export const uploadFileToFolder = catchAsync(
  async (req: IBaseRequest, res: Response) => {
    const { kakshaId, folderId } = req.query;
    const user = req.user;
    const file = req.file as GridFSFile | undefined;

    const kaksha = await Kaksha.findById(kakshaId);
    if (!kaksha) return res.status(404).json({ message: "Kaksha not found" });

    const folder = kaksha.fileManager.find((folder) => folder._id.toString() === folderId);
    if (!folder) return res.status(404).json({ message: "Folder not found" });

    folder.files.push({
      filename: file.filename,
      fileId: file.id,
      contentType: file.mimetype,
      size: file.size,
      uploadedBy: user._id,
    });

    await kaksha.save();
    res.status(200).json({ message: "File uploaded successfully" });
  }
);

export const downloadFileFromFolder = catchAsync(
  async (req: IBaseRequest, res: Response) => {
    const { kakshaId, folderId, fileId } = req.query;
    const user = req.user;

    const kaksha = await Kaksha.findById(kakshaId);
    if (!kaksha) return res.status(404).json({ message: "Kaksha not found" });

    const folder = kaksha.fileManager.find(
      (folder) => folder._id.toString() === folderId
    );
    if (!folder) return res.status(404).json({ message: "Folder not found" });

    const file = folder.files.find((f) => f.fileId.toString() === fileId);
    if (!file) return res.status(404).json({ message: "File not found in folder" });

    if (!mongoose.Types.ObjectId.isValid(fileId as string)) {
      return res.status(400).json({ message: "Invalid file ID" });
    }

    const _fileId = new mongoose.Types.ObjectId(fileId as string);
    const downloadStream = gfs.openDownloadStream(_fileId);

    downloadStream.on("file", (file) => {
      res.setHeader("Content-Type", file.contentType);
      res.setHeader("Content-Disposition", `attachment; filename="${file.filename}"`);
    });

    downloadStream.on("error", (err) => {
      return res.status(404).json({ message: "Error downloading file" });
    });

    downloadStream.pipe(res);
  }
);

export const deleteFileFromFolder = catchAsync(
    async (req: IBaseRequest, res: Response) => {
      const { kakshaId, folderId, fileId } = req.query; // Get the parameters from the query
  
      const user = req.user;
  
      // Validate required query parameters
      if (!kakshaId || !folderId || !fileId) {
        return res.status(400).json({ message: "Missing required parameters" });
      }
  
      // Find the Kaksha document
      const kaksha = await Kaksha.findById(kakshaId);
      if (!kaksha) return res.status(404).json({ message: "Kaksha not found" });
  
      // Find the folder in the Kaksha model
      const folder = kaksha.fileManager.find(
        (folder) => folder._id.toString() === folderId
      );
      if (!folder) return res.status(404).json({ message: "Folder not found" });
  
      // Find the file in the folder
      const file = folder.files.find((f) => f.fileId.toString() === fileId);
      if (!file) return res.status(404).json({ message: "File not found in folder" });
  
      // Remove the file entry from the folder
      folder.files = folder.files.filter((f) => f.fileId.toString() !== fileId);
  
      // Delete the file from GridFS storage
      const _fileId = new mongoose.Types.ObjectId(fileId);
      try {
        await gfs.delete(_fileId);  // Use await to delete file
      } catch (err) {
        return res.status(500).json({ message: "Error deleting file from GridFS" });
      }
  
      // Save the updated Kaksha document
      await kaksha.save();
  
      res.status(200).json({ message: "File deleted successfully" });
    }
  );
  
export const deleteFolder = catchAsync(
  async (req: IBaseRequest, res: Response) => {
    const { kakshaId, folderId } = req.query;

    if (!kakshaId || !folderId) {
      return res.status(400).json({ message: "Missing required parameters" });
    }

    const kaksha = await Kaksha.findById(kakshaId);
    if (!kaksha) return res.status(404).json({ message: "Kaksha not found" });

    const folderIndex = kaksha.fileManager.findIndex(
      (folder) => folder._id.toString() === folderId
    );
    if (folderIndex === -1) return res.status(404).json({ message: "Folder not found" });

    const folder = kaksha.fileManager[folderIndex];
    for (const file of folder.files) {
      const _fileId = new mongoose.Types.ObjectId(file.fileId);
      try {
        await gfs.delete(_fileId);
      } catch (err) {
        return res.status(500).json({ message: "Error deleting file from GridFS" });
      }
    }

    kaksha.fileManager.splice(folderIndex, 1);

    await kaksha.save();

    res.status(200).json({ message: "Folder and its files deleted successfully" });
  }
);

export const getKakshaFileTreeEmbedded = catchAsync(
  async (req: IBaseRequest, res: Response) => {
    const { kakshaId } = req.query;

    if (!kakshaId) {
      return res.status(400).json({ message: "Kaksha ID is required" });
    }

    const kaksha = await Kaksha.findById(kakshaId).populate({
      path: "fileManager.files.uploadedBy",
      select: "name email role",
    });

    if (!kaksha) {
      return res.status(404).json({ message: "Kaksha not found" });
    }

    const folderTree = kaksha.fileManager.map((folder) => ({
      type: "folder",
      id: folder._id,
      name: folder.name,
      createdBy: folder.createdBy,
      createdAt: folder.createdAt,
      children: folder.files.map((file) => ({
        type: "file",
        id: file._id,
        name: file.filename,
        size: `${(file.size / 1024).toFixed(2)} KB`,
        uploadedAt: file.uploadedAt,
        uploadedBy: file.uploadedBy,
        contentType: file.contentType,
      })),
    }));

    res.status(200).json({
      message: "Fetched file manager tree successfully",
      tree: folderTree,
    });
  }
);
