import { Router } from "express";
import { getUserDetails } from "../../controllers/user/UserController";

const router = Router();

router.route("/me").get(getUserDetails);

export default router;
