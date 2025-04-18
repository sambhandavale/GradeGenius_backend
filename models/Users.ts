import mongoose, { ObjectId } from "mongoose";
import crypto from "crypto";
import { IUser } from "../interfaces/interfaces";

const UserSchema = new mongoose.Schema<IUser>(
    {
        first_name: { type: String, trim: true },
        last_name: { type: String, trim: true },
        gender: { type: String, enum: ['m', 'f'] },
        user_photo: { type: String, default: "default.png" },
        bod: String,
        email: { type: String, lowercase: true, unique: true },
        username: { type: String, unique: true },
        mobile_number: { type: Number },

        hashed_password: { type: String },
        salt: { type: String },

        role: {
            type: String,
            enum: ["student", "teacher", "admin"],
            default: "student",
        },

        bio: { type: String },
        status: { type: String },
        designation: { type: String }, // For teachers
        kakshas: [{ type: mongoose.Schema.Types.ObjectId, ref: "Kaksha" }],
    },
    {
        timestamps: true,
    }
);

UserSchema.virtual("password")
    .set(function (this: any, password: string) {
        this._password = password;
        this.salt = this.makesalt();
        this.hashed_password = this.encrptPassword(password);
    })
    .get(function (this: any) {
        return this._password;
    });

UserSchema.methods = {
    authenticate: function (plainText: string) {
        return this.encrptPassword(plainText) === this.hashed_password;
    },
    encrptPassword: function (password: string) {
        if (!password) return "";
        try {
            return crypto
                .createHmac("sha1", this.salt)
                .update(password)
                .digest("hex");
        } catch (err) {
            return "";
        }
    },
    makesalt: function () {
        return Math.round(new Date().valueOf() * Math.random()) + "";
    },
};

UserSchema.set("toJSON", { virtuals: true });

const UserModel = mongoose.model<IUser>("User", UserSchema);

export default UserModel;
