import { Request, Response, NextFunction } from "express";

export const asyncHandler =
(
handler:any
)=>

(
req:Request,
res:Response,
next:NextFunction
)=>

Promise
.resolve(
handler(req,res,next)
)
.catch(next);