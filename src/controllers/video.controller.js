import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {AsyncHandler} from "../utils/AsyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = AsyncHandler(async (req, res) => {
    
    //TODO: get all videos based on query, sort, pagination
     const { 

        page = 1,
        limit = 10,
        query = `/^video/`,
        sortBy = "createdAt",
        sortType = 1, 
        userId = req.user._id } = req.query

    // find user in db
    const user = await User.findById(
        {
            _id: userId
        }
    )

    if(!user){
        throw new ApiError(404, "user not found")
    }

    const getAllVideosAggregate = await Video.aggregate([
        {
            $match: { 
                videoOwner: new mongoose.Types.ObjectId(userId),
                   $or: [
                    { title: { $regex: query, $options: 'i' } },
                    { description: { $regex: query, $options: 'i' } }
                ]
            }
        },
        {
            $sort:{
                [sortBy]: sortType
            }
        },
        {
            $skip: (page -1) * limit
        },
        {
            $limit: parseInt(limit)
        }

    ])

    Video.aggregatePaginate(getAllVideosAggregate, {page, limit})
    .then((result)=>{
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                result,
                "fetched all videos successfully !!"
            )
        )
    })
    .catch((error)=>{
        console.log("getting error while fetching all videos:",error)
        throw error
    })
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
     if(!isValidObjectId(videoId)){
        throw new ApiError(400, "This video id is not valid")
    } 

    const video = await Video.findById(
        {
            _id: videoId
        }
    )

    if(!video){
        throw new ApiError(404, "video not found")
    }

    // return responce
    return res.status(200).json(
        new ApiResponse(
            200,
            video,
            "video fetched successfully!!"
        )
    )
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
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "This video id is not valid")
    } 

    // find video in db
    const video = await Video.findById(
        {
            _id: videoId
        }
    )

    if(!video){
        throw new ApiError(404, "video not found")
    }

    if (video.Owner.toString() !== req.user._id.toString()) {
         throw new ApiError(403, "You don't have permission to delete this video!");
    }

    // delete video and thumbnail in cloudinary
    if(video.videoFile){
        await deleteOnCloudinary(video.videoFile.public_id, "video")
    }

    if(video.thumbnail){
        await deleteOnCloudinary(video.thumbnail.public_id)
    }

    const deleteResponce = await Video.findByIdAndDelete(videoId)

    if(!deleteResponce){
        throw new ApiError(500, "something went wrong while deleting video !!")
    }

    // return responce
    return res.status(200).json(
        new ApiResponse(
            200,
            deleteResponce,
            "video deleted successfully!!"
        )
    )
})

const togglePublishStatus = AsyncHandler(async (req, res) => {
     const { videoId } = req.params

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "This video id is not valid")
    } 

     // find video in db
     const video = await Video.findById(
        {
            _id: videoId
        }
    )

    if(!video){
        throw new ApiError(404, "video not found")
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You don't have permission to toggle this video!")
    }

    // toggle video status
    video.isPublished = !video.isPublished

    await video.save({validateBeforeSave: false})

    //return responce 
    return res.status(200).json(
        new ApiResponse(
            200,
            video,
            "video toggle successfully!!"
        )
    )
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}