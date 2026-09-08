import { Router } from "express";

import { authenticate } from "../auth/auth.middleware";
import { validate } from "../../cores/middleware/validate";
import { QRExperimentsController } from "./qr-experiments.controller";
import {
  createConversionSchema,
  createQRExperimentSchema,
  createVariantSchema,
  experimentIdSchema,
  experimentListQuerySchema,
  updateQRExperimentSchema,
  updateVariantSchema,
  variantParamSchema,
} from "./qr-experiments.validation";

const router = Router();
const controller = new QRExperimentsController();

router.use(authenticate);

router.post(
  "/",
  validate(createQRExperimentSchema),
  controller.create
);

router.get(
  "/",
  validate(experimentListQuerySchema, "query"),
  controller.list
);

router.post(
  "/conversions",
  validate(createConversionSchema),
  controller.createConversion
);

router.get(
  "/:id",
  validate(experimentIdSchema, "params"),
  controller.get
);

router.patch(
  "/:id",
  validate(experimentIdSchema, "params"),
  validate(updateQRExperimentSchema),
  controller.update
);

router.delete(
  "/:id",
  validate(experimentIdSchema, "params"),
  controller.archive
);

router.post(
  "/:id/start",
  validate(experimentIdSchema, "params"),
  controller.start
);

router.post(
  "/:id/pause",
  validate(experimentIdSchema, "params"),
  controller.pause
);

router.post(
  "/:id/complete",
  validate(experimentIdSchema, "params"),
  controller.complete
);

router.post(
  "/:id/variants",
  validate(experimentIdSchema, "params"),
  validate(createVariantSchema),
  controller.createVariant
);

router.patch(
  "/:id/variants/:variantId",
  validate(variantParamSchema, "params"),
  validate(updateVariantSchema),
  controller.updateVariant
);

router.delete(
  "/:id/variants/:variantId",
  validate(variantParamSchema, "params"),
  controller.deleteVariant
);

export default router;
