import express, { Request, Response, NextFunction } from "express";
import { notFound } from "@middlewares/notfound";
import { errorHandler } from "@middlewares/errorHandler";
import cors from "cors";
import AuthRoutes from "@routes/authRoutes";
import UserRoutes from "@routes/userRoutes";
import FaqRoutes from "@routes/faqRoutes";
import TaCRoutes from "@routes/tacRoutes";
import PrivacyRoutes from "@routes/privacyRoutes";
import ContentRoutes from "@routes/contentRoutes";

const app = express();

app.use(express.json());

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PATCH", "DELETE"],
    credentials: true
  })
);

app.use("/auth", AuthRoutes);
app.use("/user", UserRoutes);
app.use("/faq", FaqRoutes);
app.use("/tac", TaCRoutes);
app.use("/privacy", PrivacyRoutes);
app.use("/content", ContentRoutes);



app.use("/", (req: Request, res: Response, next: NextFunction) => {
  res.send("Hello From Footlove");
});

app.use("/**", notFound);
app.use(errorHandler);

export default app;
