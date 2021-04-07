import * as bodyParser from "body-parser";
import * as cors from "cors";
import * as express from "express";
import * as helmet from "helmet";
import * as morgan from "morgan";
import * as path from "path";

import { errorHandler } from "./middlewares/error/error-handler";
import "./middlewares/passport";
import { authenticate } from "./middlewares/passport/authenticate";
import { setHeader } from "./middlewares/setheader";
import { apiRouter } from "./routes/api/v1";
import { apiV2Router } from "./routes/api/v2";
import { authRouter } from "./routes/auth_route";
import { configRouter } from "./routes/config_route";
import { paymentRouter } from "./routes/payment_route";
import { controller as ct } from "./controllers/v2/RequestController";
import { onSuccess } from "./middlewares/success-handler";

export function initServer() {
  return new Promise((resolve, reject) => {
    const app = express();

    if (process.env.NODE_ENV === "development") {
      app.use(morgan("dev"));
    }

    app.use(helmet());

    app.use(
      cors({
        exposedHeaders: ["x-access-token", "uid", "filename", "version"]
      })
    );

    app.use(bodyParser.json());

    app.use(bodyParser.urlencoded({ extended: false }));

    app.use(setHeader);

    app.use("/config", configRouter);

    app.use("/auth/v1", authRouter);

    app.use("/api/v1", apiRouter);

    app.use("/api/v2", apiV2Router);

    app.use("/payment", paymentRouter);

    app.get("/checkresult", ct.searchResult, onSuccess());
    // console.log(path.join(process.cwd()));
    // console.log(__dirname);
    // if (process.env.NODE_ENV === "development") {
    // app.use("/public", express.static(path.join(__dirname, "../public")));
    app.use("/public", express.static(path.join(process.cwd(), "/public")));
    // }

    app.use(errorHandler);

    const port = process.env.PORT || 3000;

    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
      return resolve(app);
    });
  });
}
