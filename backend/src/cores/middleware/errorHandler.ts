import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError";

export const errorHandler=(

error:any,

req:Request,

res:Response,

next:NextFunction

)=>{

if(error instanceof AppError){

return res.status(
error.statusCode
).json({

success:false,

message:error.message

});

}

console.error(error);

return res.status(500).json({

success:false,

message:"Internal Server Error"

});

}