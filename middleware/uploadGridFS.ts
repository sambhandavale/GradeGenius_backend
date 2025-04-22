import multer from "multer";
import { GridFsStorage } from "multer-gridfs-storage";
import { ObjectId } from "mongodb";
import dotenv from 'dotenv';

dotenv.config();

const storage = new GridFsStorage({
  url: process.env.MONGO_URL,
  file: (req, file) => {
    console.log('Storing file:', file.originalname);
    const user = req.user as { _id: string | ObjectId, role: string };
    if (!user) {
      throw new Error('Authentication required');
    }
    return {
      bucketName: 'uploads',
      filename: `${file.originalname}`,
      metadata: {
        uploadedBy: user._id,
        originalName: file.originalname
      }
    };
  }
});

export const upload = multer({ storage });