import express from "express";
import { upload } from "../../middleware/uploadGridFS";
import { 
    createAssignment, 
    downloadAssignmentAttachment,
    getAssignmentDetails, 
    submitAssignment,
    listSubmissions,
    downloadStudentSubmission,
} from "../../controllers/assignments/AssignmentController";

const router = express.Router();

router.post(
    "/create", 
    upload.array("files", 3), 
    createAssignment
);
router.get(
    "/attachment/:fileId", 
    downloadAssignmentAttachment
);
router.get(
    "/details",
    getAssignmentDetails
);
router.post(
    "/submit",
    upload.array("submissionFiles", 3),
    submitAssignment
);
router.get(
    "/list-assignments",
    listSubmissions,
);
router.get(
    "/submissions/download", 
    downloadStudentSubmission
);

export default router;