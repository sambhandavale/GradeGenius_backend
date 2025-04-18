import { Router } from "express";
import { createKaksha, joinKaksha, getUserKakshas,deleteKaksha } from "../../controllers/kaksha/KakshaController";
import { getKakshaPosts } from "../../controllers/kaksha/PostsController";

const router = Router();

router.route("/create-kaksha").post(createKaksha);
router.route("/join-kaksha").post(joinKaksha);
router.route("/all-kaksha").get(getUserKakshas);
router.route('/delete-kaksha').delete(deleteKaksha);

router.route("/kaksha-posts").get(getKakshaPosts);

export default router;
