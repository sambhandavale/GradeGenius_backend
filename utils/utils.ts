import { IBaseRequest } from "../interfaces/core_interfaces";
import { Request, Response, NextFunction } from "express";

// Update catchAsync to handle IBaseRequest
export const catchAsync = (
  fn: (req: IBaseRequest, res: Response, next?: NextFunction) => Promise<any>
) => {
  return (req: IBaseRequest, res: Response, next?: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};
