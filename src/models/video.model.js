import mongoose,{Schema} from "mongoose";
const videoSchema=Schema({
    videoFile:{
        type:String,//url cloudinary
        required:true
    },
    thumbnail:{
        type:String,//url cloudinary
        required:true
    },
    title:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    duration:{
        type:Number,//url cloudinary,
        required:true
    },
    views:{
        type:Number,
        default:0
    },
    isPublished:{
        type:Boolean,
        default:0
    },
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User"
    }

},{timestamps:true})
export const Video=mongoose.model("Video",videoSchema)
