import { Request } from "express";
import { IUser } from "./interfaces";

export interface IBaseRequest extends Request {
  user: Partial<IUser>;
  baseUrl: string;
  query: { [index: string]: string };
}

export interface IError extends Error {
  statusCode: any;
  status: any;
  message: any;
  stack?: any;
  isOperational: boolean;
  name: string;
}
