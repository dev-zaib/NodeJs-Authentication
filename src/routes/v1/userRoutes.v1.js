import { Router } from "express";
import { loginUser, logoutUser, registerUser } from "../../controllers/v1/userController.v1.js";
import { upload } from "../../middleware/multerMiddleware.js";
import verifyJWT from "../../middleware/authMiddleware.js";
const router = Router();
router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

router.route('/logout').post(verifyJWT, logoutUser);
export default router;
