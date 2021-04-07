import { Router } from "express";

import { SequenceController } from "../../../controllers/v1/sequence_controller";
import { getEmptyList } from "../../../middlewares/get-empty-list";
import { paging } from "../../../middlewares/paging";

export const sequenceRouter = Router();

sequenceRouter
  .route("/")
  .get([SequenceController.getMany(), paging, getEmptyList])
  .post(SequenceController.create);

sequenceRouter
  .route("/:id")
  .get(SequenceController.getOne({ relations: ["organizations"] }))
  .put(
    SequenceController.update,
    SequenceController.getOne({ relations: ["organizations"] })
  )
  .delete(SequenceController.delete);
