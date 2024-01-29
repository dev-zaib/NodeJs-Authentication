import { asyncHandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/userModel.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
const registerUser = asyncHandler(async (req, res) => {
  const { email, fullname, username, password } = req.body;
  if (
    [fullname, email, username, password].some(
      (fields) => fields?.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required")
  }
  const existedUser = User.findOne({
    $or:[{email}, {password}]
  })
  if (existedUser) {
    throw new ApiError(409, "User already existed")
  }
  const avatarLocalPath =  req.files?.avatar[0]?.path
  const coverImageLocalPath =  req.files?.coverImage[0]?.path
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required")
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath)
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if(!avatar){
    throw new ApiError(400, "Avatar is required")
  }
  const user = User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase()
  })

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )
  if(!createdUser){
    throw new ApiError(500, "Unable to register the user")
  }
  return res.status(201).json(
    new ApiResponse(200, createdUser, "User has been created successfully")
  )
});
export { registerUser };
