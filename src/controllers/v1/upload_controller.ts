import { RequestHandler } from "express";

export class UploadController {
    static uploadMany: RequestHandler = async (req, res, next) => {
        try {
            console.log("uploadOne", req.files);
            res.send({});
        } catch (e) {
            next(e);
        }
    };
}
