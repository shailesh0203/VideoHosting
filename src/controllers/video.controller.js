import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {AsyncHandler} from "../utils/AsyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = AsyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
})

const publishAVideo = AsyncHandler(async (req, res) => {
    const { title, description,isPublished=true} = req.body
    if(!title || title?.trim()===""){
      throw new ApiError(400,"Title content is required")
    }
    if(!description || description?.trim()===""){
        throw new ApiError(400,"description content is required")
    }
    //local path
    const videoFileLocalPath=req.files?.videoFile?.[0].path
    const thumbnailFileLocalPath=req.files?.thumbnail?.[0].path

    if(!videoFileLocalPath){
        throw new ApiError(400,"video file is missing!!")
    }

    //upload on cloudinary
    const videoFile=await uploadOnCloudinary(videoFileLocalPath)
    let thumbnail=null
    if(thumbnailFileLocalPath){
     thumbnail=await uploadOnCloudinary(thumbnailFileLocalPath)
    }

    if(!videoFile){
        throw new ApiError(500,"something went wrong while uploading the video")
    }

    //store in database

    const video=await Video.create({
       videoFile:{
        public_id:videoFile?.public_id,
        url:videoFile?.url
       },
       thumbnail:{
        public_id:thumbnail?.public_id,
        url:thumbnail?.url
       },
       title,
       description,
       isPublished,
       videoOwner:req.user._id,
       duration:videoFile?.duration
    })

    if(!video){
        throw new ApiError(500,"something went wrong while storing the video in database")
    }

    //return the response

    return res.status(201).json(
        new ApiResponse(201,video,"video uplaoded successfully")
    )
})

const getVideoById = AsyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
})

const updateVideo = AsyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description } = req.body;
    const thumbnailLocalPath = req.file?.path;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video ID format.");
    }

    if (!thumbnailLocalPath && !title?.trim() && !description?.trim()) {
        throw new ApiError(400, "At least one field (title, description, or thumbnail) is required for update.");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found.");
    }

    if (video.videoOwner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You do not have permission to update this video.");
    }

    let newThumbnailDetails = {};
    if (thumbnailLocalPath) {
        const oldThumbnailPublicId = video.thumbnail?.public_id;
        if (oldThumbnailPublicId) {
            await deleteOnCloudinary(oldThumbnailPublicId);
        }

        const newThumbnail = await uploadOnCloudinary(thumbnailLocalPath);
        if (!newThumbnail?.url) {
            throw new ApiError(500, "Error while uploading new thumbnail. Please try again.");
        }
        
        newThumbnailDetails = {
            public_id: newThumbnail.public_id,
            url: newThumbnail.url
        };
    }

    const updateFields = {};
    if (title?.trim()) updateFields.title = title;
    if (description?.trim()) updateFields.description = description;
    if (newThumbnailDetails.url) updateFields.thumbnail = newThumbnailDetails;

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: updateFields
        },
        { new: true }
    );

    if (!updatedVideo) {
        throw new ApiError(500, "Something went wrong while updating video details.");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, updatedVideo, "Video details updated successfully!"));
});

const deleteVideo = AsyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = AsyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}