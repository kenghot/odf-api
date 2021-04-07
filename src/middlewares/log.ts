import { RequestHandler } from "express";
import { UserRepository } from "../repositories/v1";

export const createdBy = async (req, res, next) => {
  if (req.user) {
    try {
      const user = await UserRepository.findOne(req.user.id, {
        select: ["id", "title", "firstname", "lastname"]
      });
      req.body.createdBy = +req.user.id;
      req.body.createdByName = `${user.title}${user.firstname} ${user.lastname}`;
    } catch (e) {
      return next(e);
    }
  }
  next();
};

export const updatedBy = async (req, res, next) => {
  if (req.user) {
    try {
      const user = await UserRepository.findOne(req.user.id, {
        select: ["id", "title", "firstname", "lastname"]
      });
      req.body.updatedBy = +req.user.id;
      req.body.updatedByName = `${user.title}${user.firstname} ${user.lastname}`;
    } catch (e) {
      return next(e);
    }
  }
  next();
};
