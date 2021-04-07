import { RequestHandler } from "express";

import * as data from "../../../config-data/permission.json";

export class PermissionController {
    static getMany: RequestHandler = async (req, res, next) => {
        try {
            res.locals.data = data;
            res.locals.total = data.length;
            next();
        } catch (e) {
            next(e);
        }
    };
}
