import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {AsyncHandler} from "../utils/AsyncHandler.js"

const createTweet = AsyncHandler(async (req, res) => {
    //TODO: create tweet
})

const getUserTweets = AsyncHandler(async (req, res) => {
    // TODO: get user tweets
})

const updateTweet = AsyncHandler(async (req, res) => {
    //TODO: update tweet
})

const deleteTweet = AsyncHandler(async (req, res) => {
    //TODO: delete tweet
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}