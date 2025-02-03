import express from "express";
import UserController from "@controllers/userController";
import { authorize } from "@middlewares/authorization";
import UserServices from "@services/userServices";
import fileUpload from "express-fileupload";
import fileHandler from "@middlewares/fileHandler";

const router = express.Router();

router.patch("/update/:id", UserController.update);

export default router;
