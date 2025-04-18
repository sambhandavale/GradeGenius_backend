import { Router } from "express";
import { createDoubt, plusOneDoubt,answerDoubt,listDoubts } from "../../controllers/kaksha/DoubtController";

const router = Router();

router.route("/create-doubt").post(createDoubt);
router.route("/plus-one-doubt").put(plusOneDoubt);
router.route("/answer-doubt").put(answerDoubt);
router.route("/list-doubts").get(listDoubts);

export default router;
