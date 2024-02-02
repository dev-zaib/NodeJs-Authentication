import { asyncHandler } from "@/utils/asynchandler";
import { User } from "@/models/userModel";
import { uploadOnCloudinary } from "@/utils/cloudinary";
import { ApiResponse } from "@/utils/ApiResponse";
import Jwt , {JwtPayload} from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";
import { Document } from "mongoose";


interface UserDocument extends Document {
  _id: string;
  username: string;
  email: string;
  fullName: string;
  avatar: string;
  coverImage?: string;
  password: string;
  refreshToken?: string;
  isPasswordCorrect(password: string): Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): string;
}

interface RequestWithUser extends Request {
user?: UserDocument;
}

const generateAccessAndRefreshTokens = async (userId: string) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new Error(
      "Something went wrong while generating referesh and access token"
    );
  }
};

const registerUser = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { fullName, email, username, password } = req.body;

    if (
      [fullName, email, username, password].some(
        (field) => field?.trim() === ""
      )
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

    let avatarLocalPath;
    if (req.files && "avatar" in req.files) {
      avatarLocalPath = await req.files.avatar[0]?.path;
    }
    let coverImageLocalPath;
    if (req.files && "coverImage" in req.files) {
      coverImageLocalPath = await (
        req.files as { [fieldname: string]: Express.Multer.File[] }
      ).coverImage[0]?.path;
    }

    if (!avatarLocalPath) {
      throw new Error("Avatar file is required");
    }


    const avatar = await uploadOnCloudinary(avatarLocalPath);
    let coverImage;
    if (coverImageLocalPath) {
      coverImage = await uploadOnCloudinary(coverImageLocalPath);
    } else {
      throw new Error("Cover image file is required");
    }

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

    res
      .status(201)
      .json(new ApiResponse(200, createdUser, "User registered Successfully"));
  }
);

const loginUser = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

    res
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
    return;
  } catch (error) {
    next(error);
  }
});

const logoutUser = asyncHandler(async (req: RequestWithUser, res: Response): Promise<void>=> {
  if (!req.user) {
    throw new Error("User is not authenticated");
  }
  
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"));
});

const forgotPassword = asyncHandler(async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      throw new Error("No account with that email address exists.");
    }

    const token = Jwt.sign({ _id: user._id }, process.env.JWT_SECRET as string, {
      expiresIn: "1m",
    });

    console.log(`Password reset token for ${email}: ${token}`);

    res
      .status(200)
      .json({ message: "Password reset token has been generated." });
  } catch (error) {
    next(error);
  }
});

const resetPassword = asyncHandler(async (req, res, next) => {
  const { token, newPassword } = req.body;

  try {
    const decoded = Jwt.verify(token, process.env.JWT_SECRET as string);
    const user = await User.findById((decoded as JwtPayload)._id);

    if (!user) {
      throw new Error("User not found.");
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: "Password has been reset." });
  } catch (err) {
    next(err);
  }
});

const changePassword = asyncHandler(async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;

  try {
    if (!req.user) {
      throw new Error("User is not authenticated");
    }
    const user = await User.findById(req.user._id);

    if (!user) {
      throw new Error("User not found.");
    }

    const isPasswordValid = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordValid) {
      throw new Error("Invalid password.");
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: "Password has been changed." });
  } catch (err) {
    next(err);
  }
});

export {
  registerUser,
  loginUser,
  logoutUser,
  forgotPassword,
  resetPassword,
  changePassword,
};
