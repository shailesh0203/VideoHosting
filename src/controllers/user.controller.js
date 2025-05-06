import { AsyncHandler } from "../utils/AsyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js"
const generateAccessAndRefereshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}
const registerUser=AsyncHandler(async(req,res)=>{
//get user details from frontend
//validation-not empty
//check if username already exists:username,email
//check for images,check for avatar
//upload them on cloudinary,avatar
//create user object,create entry in db
//remove password nd refresh token field from response
//check for user creation
//return res
const {username,fullName,password,email}=req.body
console.log(email);
if([fullName,email,username,password].some((field)=>field.trim()==="")){
   throw new ApiError(400,"All fields are required")
}

const existedUser=await User.findOne({
    $or:[{username},{email}]
})
if(existedUser){
    throw new ApiError(409,"User already exists")
}

const avatarLocalPath=req.files?.avatar[0]?.path;
const coverImageLocalPath=req.files?.coverImage?.[0]?.path;
if(!avatarLocalPath){
    throw new ApiError(400,"Avatar file is required")
}
const avatar=await uploadOnCloudinary(avatarLocalPath)
let coverImage;
if(coverImageLocalPath){
coverImage=await uploadOnCloudinary(coverImageLocalPath)
}
if(!avatar){
    throw new ApiError(400,"avatar file is required")
}
const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email, 
    password,
    username: username.toLowerCase()
})

const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
)

if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user")
}

return res.status(201).json(
    new ApiResponse(200, createdUser, "User registered Successfully")
)
})
const loginUser=AsyncHandler(async(req,res)=>{
//req body->data
//username or email
//find the user
//check password
//generate access and refresh token and send it to the user
//send cookies

const {username,email,password}=req.body
if(!username && !email){
    throw new ApiError(404,"email or username is required");
}
const user=await User.findOne({
    $or:[{username},{email}]
})
const isPasswordValid=await user.isPasswordCorrect(password);
if(!isPasswordValid){
    throw new ApiError(401,"Invalid user credentials")
}
const {accessToken,refreshToken}=await generateAccessAndRefereshTokens(user._id);
})


export {registerUser,loginUser}