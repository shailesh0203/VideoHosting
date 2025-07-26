import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {AsyncHandler} from "../utils/AsyncHandler.js"
import { User } from "../models/user.model.js"

const toggleVideoLike = AsyncHandler(async (req, res) => {
    const {videoId} = req.params
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"This video is not valid")
    }
//find video already liked or not
const videoLike=await Like.findOne(
    {
        video:videoId,
        likedBy:req.user._id
    }
)
let like;
let unlike;
if(videoLike){
    unlike=await Like.deleteOne({
        video:videoId
    })
    if(!unlike){
        throw new ApiError(500,
            "something went wrong while unliking the video"
        )
    }
}else{
    like=await Like.create({
        video:videoId,
        likedBy:req.user._id
    })
    if(!like){
        throw new ApiError(
            500,
            "something went wrong while liking the video"
        )
    }
}
return res.status(200).json(
    new ApiResponse(200,{},`user ${like?"like":"unlike"} video successsfully`)
)
})

const toggleCommentLike = AsyncHandler(async (req, res) => {
    const {commentId} = req.params
    if(!isValidObjectId(commentId)){
        throw new ApiError(400,"This comment is not valid")
    }
//find video already liked or not
const commentLike=await Like.findOne(
    {
        comment:commentId,
        likedBy:req.user._id
    }
)
let like;
let unlike;
if(commentLike){
    unlike=await Like.deleteOne({
        comment:commentId
    })
    if(!unlike){
        throw new ApiError(500,
            "something went wrong while unliking the comment"
        )
    }
}else{
    like=await Like.create({
       comment:commentId,
        likedBy:req.user._id
    })
    if(!like){
        throw new ApiError(
            500,
            "something went wrong while liking the comment"
        )
    }
}
return res.status(201).json(
    new ApiResponse(200,{},`user ${like?"like":"unlike"} comment successsfully`)
)

})

const toggleTweetLike = AsyncHandler(async (req, res) => {
     const {tweetId} = req.params
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400,"This tweet is not valid")
    }
//find video already liked or not
const tweetLike=await Like.findOne(
    {
       tweet:tweetId,
       likedBy:req.user._id
    }
)
let like;
let unlike;
if(tweetLike){
    unlike=await Like.deleteOne({
        tweet:tweetId
    })
    if(!unlike){
        throw new ApiError(500,
            "something went wrong while unliking the tweet"
        )
    }
}else{
    like=await Like.create({
       tweet:tweetId,
        likedBy:req.user._id
    })
    if(!like){
        throw new ApiError(
            500,
            "something went wrong while liking the tweet"
        )
    }
}
return res.status(201).json(
    new ApiResponse(200,{},`user ${like?"like":"unlike"} tweet successsfully`)
)

}
)

const getLikedVideos = AsyncHandler(async (req, res) => {
    const userId = req.user._id;

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "This user id is not valid");
    }

    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const likes = await Like.aggregate([
        {
            $match: { likedBy: new mongoose.Types.ObjectId(userId) } // filter only current user's likes
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "likedVideos",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "videoOwner",
                            foreignField: "_id",
                            as: "videoOwner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            videoOwner: { $arrayElementAt: ["$videoOwner", 0] }
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$likedVideos"
        },
        {
            $replaceRoot: { newRoot: "$likedVideos" } // flatten structure to return videos directly
        }
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            likes,
            "Fetched liked videos successfully!!"
        )
    );
});


export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}