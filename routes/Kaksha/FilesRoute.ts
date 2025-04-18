import express from "express";
import { upload } from "../../middleware/uploadGridFS";
import { createFolder, deleteFileFromFolder, deleteFolder, downloadFileFromFolder, getKakshaFileTreeEmbedded, uploadFileToFolder } from "../../controllers/kaksha/FileController";

const router = express.Router();

router.post("/create-folder", createFolder);
router.post("/folder/upload-file", upload.single("file"), uploadFileToFolder);
router.get("/folder/file/download-file", downloadFileFromFolder);
router.delete("/folder/file/delete-file", deleteFileFromFolder);
router.delete("/folder/delete-folder", deleteFolder);

router.get("/file-tree", getKakshaFileTreeEmbedded);

export default router;
