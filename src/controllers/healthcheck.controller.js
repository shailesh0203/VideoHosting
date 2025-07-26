import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {AsyncHandler} from "../utils/AsyncHandler.js"


const healthcheck = AsyncHandler(async (req, res) => {
    //TODO: build a healthcheck response that simply returns the OK status as json with a message
    let healthCheck={
        uptime:process.uptime(),
        message:'ok',
        responsetime:process.hrtime(),
        timestamp:Date.now()
    }
    try {
    return res.status(200).json(
        new ApiResponse(
            200,
            healthCheck,
            "health is good"
        )
    )
} catch (error) {
    console.error("error in health check",error)
    healthCheck.message=error;
    throw new ApiError(503,
        "getting error in healthcheck Time"
    )
}

});

export {
    healthcheck
    }
    