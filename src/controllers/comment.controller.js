import mongoose, { isValidObjectId } from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {AsyncHandler} from "../utils/AsyncHandler.js"
import { Video } from "../models/video.model.js"
import { Tweet } from "../models/tweet.model.js"

const getVideoComments = AsyncHandler(async (req, res) => {
    
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"This Video is not valid")
    }
    //find video in database
    const video=await Video.findById(videoId)
    if(!video){
        throw new ApiError(400,"This video is not valid")
    }
    //match and find all the comments
    const aggregateComments=await Comment.aggregate([
        {
            $match:{
                video:new mongoose.Types.ObjectId(videoId)
            }
        }
    ])
    Comment.aggregatePaginate(aggregateComments,{
        page,
        limit
    })
    .then((result)=>{
        return res.status(201).json(
            new ApiResponse(200,result,"VideoComments fetched succesully")
        )
    })
    .catch((error)=>{
        throw new ApiError(500,"something went wrong while reaching video comments",error)
    })
})

const getTweetComments=AsyncHandler(async(req,res)=>{
    // req.param se tweetId le
    //use validate kr
    //comments par pipelining laga kr same tweetId ke comments le
    //uska pagination kr
    const {tweetId}=req.params
    const {page=1,limit=10}=req.query
    //find the tweet in database
   
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400,"TweetId not valid")
    }
     const tweet=await Tweet.findById(tweetId)
     if(!tweet){
        throw new ApiError(404,"Tweet Not found")
     }
    //match and find all the comments
    const aggregateComments=await Comment.aggregate([
        {
            $match:{
                tweet:new mongoose.Types.ObjectId(tweetId)
            }
        }
    ])
    Comment.aggregatePaginate(aggregateComments,{
        page,
        limit
    })
    .then((result)=>{
        return res.status(201).json(
            new ApiResponse(200,result,"TweetComments fetched succesfully")
        )
    })
    .catch((error)=>{
        throw new ApiError(500,"something went wrong while fetching tweet comments",error)
    })

})
const addCommentToVideo = AsyncHandler(async (req, res) => {
    //req se comment aur video id le
    //ek naya comment create kr aur uske parameters dal de
    const {comment}=req.body
    const {videoId}=req.params
    
    console.log("req.body",req.body)
    console.log("comment",comment)

    if(!comment || comment?.trim()==""){
        throw new ApiError(400,"comment is required")
    }
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"This video id is not valid")
    }
    const videoComment=await Comment.create({
        content:comment,
        video:videoId,
        owner:req.user_id
    })
    if(!videoComment){
        throw new ApiError(500,"something went wrong while creating the comment")
    }
   return res.status(201).json(new ApiResponse(200,videoComment,"video comment created successfully"))
})

const updateCommentToVideo = AsyncHandler(async (req, res) => {
    // TODO: update a comment
    const {newContent}=req.body
    const {commentId}=req.params

    if(!newContent || newContent?.trim()===""){
        throw new ApiError(400,"content is required")
    }
    if(!isValidObjectId(commentId)){
        throw new ApiError(400,"This is not a valid comment")
    }
    const comment=await Comment.findById(commentId)
    if(!comment){
        throw new ApiError(404,"comment not found")
    }

    if(comment.owner.toString()!==req.user._id.toString()){
        throw new ApiError(403,"You dont have permission to update the comment")
    }
    const updateComment=await Comment.findByIdAndUpdate(
        commentId,
        {
            $set:{
                content:newContent
            }
        },
        {
            new:true
        }
    )
    if(!updateComment){
        throw new ApiError(500,"something went wrong while updating the comment")
    }

    return res.status(201).json(
        new ApiResponse(200,updateComment,
            "comment updated successfully"
        )
    )


})

const deleteCommentToVideo = AsyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId}=req.params
    if(!isValidObjectId(commentId)){
        throw new ApiError(404,"Not a valid commentid")
    }
    const comment=await Comment.findById(commentId)

    if(!comment){
        throw new ApiError(404,"comment not found!")
    }
    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You don't have permission to delete this comment!");
    }
    const deleteComment = await Comment.deleteOne(req.user._id)

    if(!deleteComment){
        throw new ApiError(500, "something went wrong while deleting comment")
    }

    // return responce
    return res.status(201).json(
        new ApiResponse(200, deleteComment, "comment deleted successfully!!"))
})
const addCommentToTweet = AsyncHandler(async (req, res) => {
    const { comment } = req.body;
    const { tweetId } = req.params

    if( !comment || comment?.trim()===""){
        throw new ApiError(400, "comment is required")
    }

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "This tweet id is not valid")
    }

    const tweetComment = await Comment.create({
        content: comment,
        tweet: tweetId,
        owner: req.user._id
    })

    if(!tweetComment){
        throw new ApiError(500, "something went wrong while creating tweet comment")
    }

    // return responce
        return res.status(201).json(
        new ApiResponse(200, tweetComment, "Tweet comment created successfully!!")
    );
})

// update comment to Tweet
const updateCommentToTweet = AsyncHandler(async (req, res) => {
    const { newContent } = req.body 
    const { commentId } = req.params

    if(!newContent || newContent?.trim()===""){
        throw new ApiError(400, "content is required")
    }

    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "This video id is not valid")
    }

    const comment = await Comment.findById(commentId)

    if (!comment) {
        throw new ApiError(404, "comment not found!");
    }

    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You don't have permission to update this comment!");
    }

    const updateComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set:{
                content: newContent
            }
        },
        {
            new: true
        }
    )

    if(!updateComment){
        throw new ApiError(500, "something went wrong while updating comment")
    }

    // return responce
   return res.status(201).json(
    new ApiResponse(200, updateComment, "comment updated successfully!!"))
})

// delete comment to tweet 
const deleteCommentToTweet = AsyncHandler(async (req, res) => {
    const { commentId } = req.params

    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "This tweet id is not valid")
    }

    const comment = await Comment.findById(commentId)

    if (!comment) {
        throw new ApiError(404, "comment not found!");
    }

    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You don't have permission to delete this comment!");
    }

    const deleteComment = await Comment.deleteOne(req.user._id)

    if(!deleteComment){
        throw new ApiError(500, "something went wrong while deleting comment")
    }

    // return responce
    return res.status(201).json(
        new ApiResponse(200, deleteComment, "comment deleted successfully!!"))
})
export {
    getVideoComments,
    getTweetComments ,
    addCommentToVideo, 
    updateCommentToVideo,
     deleteCommentToVideo,
     addCommentToTweet,
     updateCommentToTweet,
     deleteCommentToTweet
    }