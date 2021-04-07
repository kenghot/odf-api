import { RequestHandler } from "express";
import { intersection } from "lodash";
import { NotFoundError } from "./error/error-type";

export const filterByOrganization = async (req, res, next) => {
  const isSuperUser = req.user.permissions
    ? req.user.permissions.includes("DATA.ALL.ORG")
    : false;

  if (req.query.organizationId) {
    req.query.permittedOrganizationIds = isSuperUser
      ? [req.query.organizationId]
      : intersection(req.user.responsibilityOrganizationIds, [
          req.query.organizationId
        ]);
  } else {
    req.query.permittedOrganizationIds = isSuperUser
      ? undefined
      : req.user.responsibilityOrganizationIds;
  }

  if (!isSuperUser && req.query.permittedOrganizationIds.length === 0) {
    return next(
      new NotFoundError({
        name: "ไม่พบรายการที่เกี่ยวข้อง",
        message: "ไม่พบรายการที่เกี่ยวข้องกับหน่วยงานที่รับผิดชอบ"
      })
    );
  }

  next();
};
