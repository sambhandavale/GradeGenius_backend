import mongoose, { ObjectId } from "mongoose";

export interface IUser {
    _id?: ObjectId;
    user_photo?: string;
    first_name?: string;
    last_name?: string;
    gender?: string;
    mobile_number?: number;
    email: string;
    username: string;
    hashed_password: string;
    salt?: string;
    bod?: string;
    role?: "student" | "teacher" | "admin";
    bio?: string;
    status?: string;
    designation?: string;
    kakshas?: ObjectId[];
}

export interface IAssignment {
  _id?: ObjectId;
  title: string;
  description?: string;
  kaksha: ObjectId;
  createdBy: ObjectId;
  dueDate?: Date;
  grade?:number;
  attachments?: {
    fileId: ObjectId;
    filename: string;
  }[];
  submissions?: {
    student: ObjectId;
    submittedAt: Date;
    files: {
      fileId: any;
      filename: string;
      originalName?: string;
      size?: number;
      contentType?: string;
    }[];
    marks?: number;
    feedback?: string;
  }[];
}

export interface IPost {
    _id?: ObjectId;
    title: string;
    content?: string;
    createdBy: ObjectId;
    type:string;
    typeId?:ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IFile {
    _id?: ObjectId;
    filename: string;
    fileId: any;
    uploadedBy: ObjectId;
    contentType: string;
    size: number;
    uploadedAt?: Date;
  }
  
export interface IFolder {
    _id?: ObjectId;
    name: string;
    createdBy: ObjectId;
    files: IFile[];
    createdAt?: Date;
    updatedAt?: Date;
}
  

export interface IDoubt {
    _id?: ObjectId;
    question: string;
    answer?: string;
    askedBy: ObjectId;
    answeredBy?: ObjectId;
    plusOnes: number;
    plusOneBy?: ObjectId[];
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IKaksha {
    _id?: ObjectId;
    name: string;
    description?: string;
    createdBy: ObjectId;
    members?: ObjectId[];
    inviteCode?: string;
    doubts?: IDoubt[];
    posts?: IPost[];
    fileManager?: IFolder[];
}
  