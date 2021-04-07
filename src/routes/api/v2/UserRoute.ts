import { Router } from "express";
import * as multer from "multer";

import { controller as ct } from "../../../controllers/v2/UserController";
import { filterByOrganization } from "../../../middlewares/filter";
import { getEmptyList } from "../../../middlewares/get-empty-list";
import { mapFiles } from "../../../middlewares/mapfile";
import { paging } from "../../../middlewares/paging";
import { onSuccess } from "../../../middlewares/success-handler";
import { IQuery, ISubQuery } from "../../../repositories/v2/SearchRepository";
import { getStorage } from "../../../utils/multer-helper";

export const userRouter = Router();

const storage = getStorage("users");
const upload = multer({ storage });

const getUser = ct.getOne({
  relations: ["organization", "roles", "responsibilityOrganizations"],
  joins: [
    {
      type: "leftJoinAndMapMany",
      mapToField: "attachedFiles",
      joinEntityClass: "AttachedFile",
      joinEntityAlias: "attachedFile",
      conditions: [
        { joinFieldToMap: "refId", operator: "=", entityFieldToMap: "id" },
        {
          joinFieldToMap: "refType",
          operator: "=",
          queryField: "refType",
          value: "USER.ATTACHEDFILE",
        },
      ],
    },
  ],
});

const queries: IQuery[] = [
  {
    operator: "in",
    entityField: "organizationId",
    queryField: "permittedOrganizationIds",
  },
  {
    operator: "like",
    entityField: "firstname",
    queryField: "firstname",
  },
  {
    operator: "like",
    entityField: "lastname",
    queryField: "lastname",
  },
  {
    operator: "like",
    entityField: "username",
    queryField: "username",
  },
  { operator: "=", entityField: "active", queryField: "active" },
];
const subQueries: ISubQuery[] = [
  {
    operator: "in",
    entityField: "id",
    subEntityClass: "User",
    alias: "user",
    subEntityField: "id",
    join: "innerJoin",
    joinAlias: "role",
    joinField: "roles",
    queries: [
      {
        operator: "=",
        entityField: "id",
        queryField: "roleId",
      },
    ],
  },
];

userRouter
  .route("/")
  .get([
    filterByOrganization,
    ct.getMany({
      relations: ["organization"],
      selectedFields: [
        "id",
        "username",
        "firstname",
        "lastname",
        "lastSigninDate",
        "active",
      ],
      queries,
      subQueries,
    }),
    paging,
    getEmptyList,
  ])
  .post([ct.createWithOption({ listeners: false }), onSuccess()]);

userRouter.route("/pos_users").get([ct.getPosAdminUsers, paging, getEmptyList]);

userRouter
  .route("/:id")
  .get(getUser, onSuccess())
  .put([
    upload.any(),
    mapFiles,
    ct.withFormData,
    ct.update({
      relations: ["roles", "responsibilityOrganizations"],
      m2ms: [
        { entityField: "roles" },
        { entityField: "responsibilityOrganizations" },
      ],
      withFiles: true,
    }),
    getUser,
    onSuccess(),
  ])
  .delete(ct.delete, onSuccess());
