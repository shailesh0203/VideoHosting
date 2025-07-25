import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {AsyncHandler} from "../utils/AsyncHandler.js"

const getChannelStats = AsyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const allLikes=await Like.aggregate([
        {
            $match:{
                likedBy:new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $group:{
                _id:null,
                totalVideoLikes:{
                    $sum:{
                        $cond:[
                            {$ifNull:["$video",false]},
                            1,//add 1
                            0
                        ]
                    }
                },
                totalTweetLikes:{
                    $sum:{
                        $cond:[
                            {$ifNull:["$tweet",false]},
                            1,
                            0
                        ]
                    }
                },
                totalCommentLikes:{
                    $sum:{
                        $cond:[
                            {$ifNull:["$comment",false]},
                            1,
                            0
                        ]
                    }
                }
            }
        }
    ])
})

const getChannelVideos = AsyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
})

export {
    getChannelStats, 
    getChannelVideos
}