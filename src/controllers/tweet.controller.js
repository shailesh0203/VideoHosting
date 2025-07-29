import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {AsyncHandler} from "../utils/AsyncHandler.js"

const createTweet = AsyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content}=req.body;
    if(!content || content?.trim()===""){
        throw new ApiError(400,"content is required")
    }

    //creating tweet 
    const tweet =await Tweet.create({
        content,
        owner:req.user._id
    })

    if(!tweet){
        throw new ApiError(500,"something went wrong while creating tweet")
    }

    return res.status(201).json(
        new ApiResponse(201,tweet,"tweet created successfully!!!")
    )
})

const getUserTweets = AsyncHandler(async (req, res) => {
    const {userId}=req.params
    if(!isValidObjectId(userId)){
        throw new ApiError(400,"This user Id is not valid")
    }

    //find user in database

    const user=await User.findById(userId)
    if(!user){
        throw new ApiError(404,"User not found")
    }

    //match and find all tweets

    const tweets=await Tweet.aggregate([
        {
            $match:{
                owner:user._id,
            }
        }
    ])
    if(!tweets ){
        throw new ApiError(500,"something went wrong while fetching tweets")
    }

    //return response
    return res.status(200).json(
        new ApiResponse(200,tweets,"tweets fetched successfully")
    )
})

const updateTweet = AsyncHandler(async (req, res) => {
    //TODO: update tweet
    const {newContent}=req.body
    const {tweetId}=req.params

    if(!newContent || newContent?.trim()===""){
        throw new ApiError(400,"content is required")
    }
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400,"This tweet id is not valid")
    }

    const tweet=await Tweet.findById(tweetId)

    if(!tweet){
        throw new ApiError(400,"Tweet is not found")
    }

    if(tweet.owner.toString()!==req.user._id.toString()){
        throw new ApiError(403,"You don't have permission to update this tweet")
    }

    const updatedTweet=await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set:{
                content:newContent
            }
        },{
            new:true
        }
    )

    if(!updatedTweet){
        throw new ApiError(500,"something went wrong while updating the tweet")
    }

    return res.status(200).json(
        new ApiResponse(200,updatedTweet,"tweet updated succesfully")
    )

})

const deleteTweet = AsyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId} = req.params;

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "This tweet id is not valid")
    }

    const tweet = await Tweet.findById(tweetId)

    if (!tweet) {
        throw new ApiError(404, "no tweet found!");
    }

    if (tweet.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You don't have permission to delete this tweet!");
    }

    const deleteTweet = await Tweet.deleteOne(tweetId)

    // console.log("delete successfully", deleteTweet)

    if(!deleteTweet){
        throw new ApiError(500, "something went wrong while deleting tweet")
       }

       // return responce
       return res.status(200).json(
        new ApiResponse(200, deleteTweet, "tweet deleted successfully!!"))
})


export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}