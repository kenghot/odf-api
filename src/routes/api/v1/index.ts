import { Router } from "express";

import { createdBy, updatedBy } from "../../../middlewares/log";
import { authenticate } from "../../../middlewares/passport/authenticate";
import { accountReceivableRouter } from "./account_receivable_route";
import { agreementRouter } from "./agreement_route";
import { attachedFileRouter } from "./attachedfile_route";
import { guaranteeRouter } from "./guarantee_route";
import { occupationRouter } from "./occupation_route";
import { organizationRouter } from "./organization_route";
import { permissionRouter } from "./permission_route";
import { receiptRouter } from "./receipt_route";
import { requestRouter } from "./request_route";
import { roleRouter } from "./role_route";
import { sequenceRouter } from "./sequence_route";
import { userRouter } from "./user_route";
import { voucherRouter } from "./voucher_route";

export const apiRouter = Router();

apiRouter.use(authenticate("jwt"));

apiRouter.post("*", createdBy);
apiRouter.put("*", updatedBy);

apiRouter.use("/users", userRouter);
apiRouter.use("/roles", roleRouter);
apiRouter.use("/organizations", organizationRouter);
apiRouter.use("/permissions", permissionRouter);
apiRouter.use("/requests", requestRouter);
apiRouter.use("/agreements", agreementRouter);
apiRouter.use("/occupations", occupationRouter);
apiRouter.use("/sequencies", sequenceRouter);
apiRouter.use("/guarantees", guaranteeRouter);
apiRouter.use("/account_receivables", accountReceivableRouter);
apiRouter.use("/receipts", receiptRouter);
apiRouter.use("/vouchers", voucherRouter);
apiRouter.use("/attachedfiles", attachedFileRouter);

// Testing Route
