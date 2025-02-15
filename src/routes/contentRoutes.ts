import express from "express";
import ContentController from "@controllers/contentController";
import { authorize } from "@middlewares/authorization";

const router = express.Router();

router.post("/create", authorize, ContentController.create);

export default router;