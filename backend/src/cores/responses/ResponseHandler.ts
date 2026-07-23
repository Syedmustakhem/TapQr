import { Response } from "express";

export class ResponseHandler {

    static success(
        res: Response,
        message: string,
        data?: unknown
    ) {
        return res.status(200).json({
            success: true,
            message,
            data,
        });
    }

    static created(
        res: Response,
        message: string,
        data?: unknown
    ) {
        return res.status(201).json({
            success: true,
            message,
            data,
        });
    }

    static noContent(res: Response) {
        return res.status(204).send();
    }

    static badRequest(
        res: Response,
        message: string
    ) {
        return res.status(400).json({
            success: false,
            message,
        });
    }

}