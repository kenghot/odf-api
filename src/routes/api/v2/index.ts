import { Router } from "express";

import { createdBy, updatedBy } from "../../../middlewares/log";
import { authenticate } from "../../../middlewares/passport/authenticate";
import { accountReceivableRouter } from "./AccountReceivableRoute";
import { agreementRouter } from "./AgreementRoute";
import { counterServiceRouter } from "./CounterServiceRoute";
import { debtCollectionRouter } from "./DebtCollectionRoute";
import { guaranteeRouter } from "./GuaranteeRoute";
import { letterRouter } from "./LetterRoute";
import { memoRouter } from "./MemoRoute";
import { occupationRouter } from "./OccupationRoute";
import { organizationRouter } from "./OrganizationRoute";
import { posRouter } from "./PosRoute";
import { posShiftRouter } from "./PosShiftRoute";
import { receiptControlRouter } from "./ReceiptControlRoute";
import { receiptRouter } from "./ReceiptRoute";
import { requestRouter } from "./RequestRoute";
import { roleRouter } from "./RoleRoute";
import { userRouter } from "./UserRoute";
import { visitRouter } from "./VisitRoute";
import { voucherRouter } from "./VoucherRoute";
import { paymentApiRouter } from "./PaymentApiRoute";
import { reportRouter } from "./ReportRoute";
import { accountReceivableTransactionRouter } from "./AccountReceivableTransactionRoute";
import { donationAllowanceRouter } from "./DonationAllowanceRoute";
import { donationDirectRouter } from "./DonationDirectRoute";

export const apiV2Router = Router();

apiV2Router.use(authenticate("jwt"));

apiV2Router.post("*", createdBy);
apiV2Router.put("*", updatedBy);

apiV2Router.use("/users", userRouter);
apiV2Router.use("/roles", roleRouter);
apiV2Router.use("/organizations", organizationRouter);
apiV2Router.use("/requests", requestRouter);
apiV2Router.use("/agreements", agreementRouter);
apiV2Router.use("/occupations", occupationRouter);
apiV2Router.use("/guarantees", guaranteeRouter);
apiV2Router.use("/account_receivables", accountReceivableRouter);
apiV2Router.use(
  "/account_receivable_transactions",
  accountReceivableTransactionRouter
);
apiV2Router.use("/donation_allowances", donationAllowanceRouter);
apiV2Router.use("/donation_directs", donationDirectRouter);
apiV2Router.use("/receipts", receiptRouter);
apiV2Router.use("/vouchers", voucherRouter);
apiV2Router.use("/debtcollections", debtCollectionRouter);
apiV2Router.use("/letters", letterRouter);
apiV2Router.use("/visits", visitRouter);
apiV2Router.use("/memos", memoRouter);
apiV2Router.use("/counterservices", counterServiceRouter);
apiV2Router.use("/poses", posRouter);
apiV2Router.use("/posshifts", posShiftRouter);
apiV2Router.use("/receipts_control_log", receiptControlRouter);
apiV2Router.use("/payment", paymentApiRouter);
apiV2Router.use("/reports", reportRouter);

// Testing Route
