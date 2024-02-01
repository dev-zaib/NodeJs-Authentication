import { asyncHandler } from "../../utils/asynchandler.js";
import { User } from "../../models/userModel.js";
import { uploadOnCloudinary } from "../../utils/cloudinary.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import Jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async(userId) =>{
  try {
      const user = await User.findById(userId)
      const accessToken = user.generateAccessToken()
      const refreshToken = user.generateRefreshToken()
      user.refreshToken = refreshToken
      await user.save({ validateBeforeSave: false })
      return {accessToken, refreshToken}


  } catch (error) {
      throw new Error("Something went wrong while generating referesh and access token")
  }
}

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, username, password } = req.body;

  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new Error("All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new Error("User with email or username already exists");
  }
  existedUser;

  const avatarLocalPath = await req.files?.avatar[0]?.path;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = await req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new Error("Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new Error("Avatar file is required");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new Error("Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered Successfully"));
});

const loginUser = asyncHandler(async (req, res, next) => {
  try {
    const { email, username, password } = req.body;
    if (!username && !email) {
      throw new Error("username or email is required");
    }
    const user = await User.findOne({
      $or: [{ email }, { username }],
    });
    if (!user) {
      throw new Error("User does not exist");
    }
    const isPasswordValid = await user.isPasswordCorrect(password);
  
    if (!isPasswordValid) {
      throw new Error("Invalid Credentials");
    }
  
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user._id
    );
    const loggedInUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );
  
    const options = {
      https: true,
      secure: true,
    };
  
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { user: loggedInUser, accessToken, refreshToken },
          "User logged In Successfull"
        )
      );
  } catch (error) {
    next(error)
  }
});

const logoutUser = asyncHandler(async(req, res) => {
  await User.findByIdAndUpdate(
      req.user._id,
      {
          $unset: {
              refreshToken: 1
          }
      },
      {
          new: true
      }
  )

  const options = {
      httpOnly: true,
      secure: true
  }

  return res
  .status(200)
  .clearCookie("accessToken", options)
  .clearCookie("refreshToken", options)
  .json(new ApiResponse(200, {}, "User logged Out"))
})

const forgotPassword = asyncHandler(async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
  
    if (!user) {
      throw new Error("No account with that email address exists.");
    }
  
    const token = Jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '1m' });
  
    console.log(`Password reset token for ${email}: ${token}`);
  
    res.status(200).json({ message: 'Password reset token has been generated.' });  
  } catch (error) {
    next(error)
  }
})

const resetPassword = asyncHandler(async (req, res, next) => {
  const { token, newPassword } = req.body;

  try {
      const decoded = Jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded._id);

      if (!user) {
          throw new Error ('User not found.');
      }

      user.password = newPassword;
      await user.save();

      res.status(200).json({ message: 'Password has been reset.' });
  } catch (err) {
      next(err)
  }
});

const changePassword = asyncHandler(async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;

  try {
      const user = await User.findById(req.user._id);

      if (!user) {
          throw new Error ('User not found.');
      }

      const isPasswordValid = await user.isPasswordCorrect(oldPassword);

      if (!isPasswordValid) {
          throw new Error ('Invalid password.');
      }

      user.password = newPassword;
      await user.save();

      res.status(200).json({ message: 'Password has been changed.' });
  } catch (err) {
      next(err)
  }
});


export { registerUser, loginUser, logoutUser, forgotPassword, resetPassword, changePassword};
