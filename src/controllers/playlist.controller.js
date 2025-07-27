import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {AsyncHandler} from "../utils/AsyncHandler.js"
import { User } from "../models/user.model.js"
import { Video } from "../models/video.model.js"


const createPlaylist = AsyncHandler(async (req, res) => {
    const {name, description} = req.body

     if(!name || name?.trim()===""){
        throw new ApiError(400,"name and description both are required")
    }

    //creating a playlist

    const playlist=await Playlist.create({
        name,
        description,
        owner:req.user._id
    })

    if(!playlist){
        throw new ApiError(500,"something went wrong while creating playlist")
    }

    //return response
    return res.status(201).json(
        new ApiResponse(200,playlist,"playlist created successfully")
    )
})

const getUserPlaylists = AsyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }

    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const playlists = await Playlist.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos"
            }
        },
        {
            $addFields: {
                totalVideos: { $size: "$videos" },
                totalViews: { $sum: "$videos.views" }
            }
        },
        {
            $project:{
                name: 1,
                description: 1,
                createdAt: 1,
                totalVideos: 1,
                totalViews: 1,
                videos: 1
            }
        }
    ]);
    
    return res.status(200).json(
        new ApiResponse(200, playlists, "Playlists fetched successfully")
    );
});

const getPlaylistById = AsyncHandler(async (req, res) => {
    const {playlistId} = req.params
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"The playlist is not valid")
    }

     const playlist=await Playlist.findById(playlistId)

     if(!playlist){
        throw new ApiError(404,"playlist not found")
     }
     return res.status(200).json(
        new ApiResponse(200,playlist,"playlist fetched successfully")
     )
})

const addVideoToPlaylist = AsyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"This playlist is not valid")
    }
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"This video is not valid")
    }
    //find playlist in db
    const playlist=await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(404,"No playlist found")
    }
    if(playlist.owner.toString()!=req.user._id.toString()){
        throw new ApiError(403,"You don't have permission to add video in this playlist!!")
    }

    //find video in db
    const  video=await Video.findById(videoId)

    if(!video){
        throw new ApiError(404,"no video found")
    }

    //if video already exists in playlist
    if(playlist.video.includes(videoId)){
        throw new ApiError(400,"video already exists in playlist")
    }

    //push video to playlist
    const addedToPlaylist=await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $push:{
                videos:videoId
            }
        },
        {
            new:true
        }
    )
    if(!addedToPlaylist){
        throw new ApiError(500,"something went wrong while adding video to playlist!!")
    }

    //return response
    return res.status(200).json(
        new ApiResponse(200,addedToPlaylist," added video in playlist successfully")
    )
})

const removeVideoFromPlaylist = AsyncHandler(async (req, res) => {
   const {playlistId, videoId} = req.params
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"This playlist is not valid")
    }
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"This video is not valid")
    }
    //find playlist in db
    const playlist=await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(404,"No playlist found")
    }
    if(playlist.owner.toString()!=req.user._id.toString()){
        throw new ApiError(403,"You don't have permission to remove video in this playlist!!")
    }

    //find video in db
    const  video=await Video.findById(videoId)

    if(!video){
        throw new ApiError(404,"no video found")
    }

    //if video already exists in playlist
    if(!playlist.video.includes(videoId)){
        throw new ApiError(400,"video does not exists in playlist")
    }

    //push video to playlist
    const removedFromPlaylist=await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull:{
                videos:videoId
            }
        },
        {
            new:true
        }
    )
    if(!removedFromPlaylistPlaylist){
        throw new ApiError(500,"something went wrong while removing video from playlist!!")
    }

    //return response
    return res.status(200).json(
        new ApiResponse(200,removedFromPlaylist," removed video from playlist successfully")
    )

})

const deletePlaylist = AsyncHandler(async (req, res) => {
const { playlistId } = req.params

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "This playlist id is not valid")
    }

    const playlist = await Playlist.findById(playlistId)

    console.log("playlist", playlist)

    if (!playlist) {
        throw new ApiError(404, "no playlist found!");
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You don't have permission to delete this playlist!");
    }

    const deletePlaylist = await Playlist.deleteOne({
        _id: playlistId
    })


    if(!deletePlaylist){
        throw new ApiError(500, "something went wrong while deleting playlist")
    }

    // return responce
    return res.status(201).json(
        new ApiResponse(200, deletePlaylist, "playlist deleted successfully!!"))
})

const updatePlaylist = AsyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const {NewName, NewDescription} = req.body

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "This playlist id is not valid")
    }
    // if any one is provided
    if (!((!NewName || NewName?.trim() === "") || (!NewDescription || NewDescription?.trim() === ""))) {
        throw new ApiError(400, "Either name or description is required");
    } else {
        const playlist = await Playlist.findById(playlistId)

        if (playlist.owner.toString() !== req.user._id.toString()) {
            throw new ApiError(403, "You don't have permission to update this playlist!");
        }

        const updatePlaylist = await Playlist.findByIdAndUpdate(
            playlistId,
            {
                $set:{
                    name: NewName,
                    description: NewDescription
                }
            },
            {
                new: true
            }
        )

        if(!updatePlaylist){
            throw new ApiError(500, "something went wrong while updating playlist!!")
        }

        // return responce
        return res.status(201).json(
        new ApiResponse(200, updatePlaylist, "playlist updated successfully!!"))
    }
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}