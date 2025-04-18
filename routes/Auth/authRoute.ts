import { Router } from "express";
const router = Router();
import passport from "passport";

import { userSigninValidator,userSignupValidator, runValidation } from "../../controllers/validators/auth";
import { signup, signin } from "../../controllers/authentication/authLocal";
import { logout } from "../../controllers/authentication/auth";

router.post("/signup", userSigninValidator, runValidation, signup);
router.post("/signin", userSigninValidator, runValidation, signin);
router.get("/logout", logout);

export default router;