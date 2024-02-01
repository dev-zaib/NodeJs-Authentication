import { Router } from "express";
import { changePassword, forgotPassword, loginUser, logoutUser, registerUser, resetPassword } from "../../controllers/v2/userController.v2.js";
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
router.post('/forgotPassword', forgotPassword);
router.post('/resetPassword', resetPassword);
router.post('/changePassword', verifyJWT, changePassword)
export default router;
