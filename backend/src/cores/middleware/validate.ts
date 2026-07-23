import { AnyZodObject } from "zod";
import { Request, Response, NextFunction } from "express";

export const validate =
(schema: AnyZodObject)=>

(req:Request,res:Response,next:NextFunction)=>{

const result=schema.safeParse(req.body);

if(!result.success){

return res.status(400).json({

success:false,

errors:result.error.flatten()

});

}

req.body=result.data;

next();

};