import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {AsyncHandler} from "../utils/AsyncHandler.js"


const toggleSubscription = AsyncHandler(async (req, res) => {
    const {channelId} = req.params
    
    if(!isValidObjectId(channelId)){
        throw new ApiError(
            400,
            "This channel id is not valid"
        )
    }
    //if its a channel so its already a user
    const channel=await User.findById(channelId)
   
    if(!channel){
        throw new ApiError(400,
            "This channel does not Exists"
        )
    }
if (channel._id.toString() === req.user?._id.toString()) {
        throw new ApiError(400, "You cannot subscribe to your own channel.");
    }
    let unsubscribe
    let subscribe

    const itHasSubscription=await Subscription.findOne({
        subscriber:req.user._id,
        channel:channelId
    })

    if(itHasSubscription){
        unsubscribe=await Subscription.findOneAndDelete(
            {
                subscriber:req.user._id,
                 channel:channelId
            }
        )
        if(!unsubscribe){
            throw new ApiError(500,"something went wrong while unsubscribing the channel")
        }
        //return response

        return res.status(200).json(
            new ApiResponse(
                200,
                unsubscribe,
                "channel unsubscribed"
            )
        )
    }else{
        //subscribe
        subscribe=await Subscription.create({
            subscriber:req.user._id,
            channel:channelId
        })
        if(!subscribe){
            throw new ApiError(500,
                "something went wrong while subscribing the channel"
            )
        }
        return res.status(200).json(
            new ApiResponse(
                200,
                subscribe,
                "channel subscribed successfully!!"
            )
        )
    }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = AsyncHandler(async (req, res) => {
    const {channelId} = req.params
    if(!isValidObjectId(channelId)){
        throw new ApiError(400,
            "This channel is not valid"
        )
    }
    
    const subscription=await Subscription.aggregate([
        {
            $match:{
                subscriber:new mongoose.Types.ObjectId(channelId?.trim())
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"subscriber",
                foreignField:"_id",
                as:"subscribers"
            }
        },
        {
            $project:{
                subscribers:{
                    username:1,
                    fullName:1,
                    avatar:1
                }
            }
        }
    ])

    return res.status(200).json(
        new ApiResponse(
            200,
            subscription[0],
            "All user channel Subscribers fetched successfully"
        )
    )
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = AsyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    if(!isValidObjectId(subscriberId)){
        throw new ApiError(
            400,
            "This subscrition is not valid"
        )
    }
    const subscriptions =await Subscription.aggregate([
        {
            $match:{
                channel:new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"channel",
                foreignField:"_id",
                as:"subscribedChannel"
            }
        },
        {
            $project:{
                subscribedChannel:{
                   username:1,
                   avatar:1
                }
            }
        }
    ])
    console.log(subscriptions)

    return res.status(200).json(
        new ApiResponse(
            200,
            subscriptions[0],
            "All Subsciribed channels fetched successfully!!"
        )
    )

})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}