import { Response, Express } from "express";
import authRouter from "./Auth/authRoute";
import kakshaRoute from "./Kaksha/kakshaRoute"
import doubtRoute from "./Kaksha/DoubtRoute"
import assigmentRoute from "./Kaksha/AssignmentRoute"
import FilesRoute from "./Kaksha/FilesRoute"
import UserRoute from "./User/UserRoute"
import passport from "passport";

export const routes = (app: Express) =>{
    app.use(
        "/api/auth", 
        authRouter
    ),
    app.use(
        "/api/user",
        passport.authenticate("jwt", { session: false }),
        UserRoute,
    );    
    app.use(
        "/api/kaksha",
        passport.authenticate("jwt", { session: false }),
        kakshaRoute,
    );
    app.use(
        "/api/kaksha/doubt",
        passport.authenticate("jwt", { session: false }),
        doubtRoute,
    );
    app.use(
        "/api/kaksha/assignment",
        passport.authenticate("jwt", { session: false }),
        assigmentRoute,
    );
    app.use(
        "/api/kaksha/files",
        passport.authenticate("jwt", { session: false }),
        FilesRoute,
    );
}