import { Router } from "express";
import { getUserDetails, updateUserDetails, deleteUser } from "../../controllers/user/UserController";

const router = Router();

router.route("/me")
  .get(getUserDetails)
  .patch(updateUserDetails)
  .delete(deleteUser);

export default router;
