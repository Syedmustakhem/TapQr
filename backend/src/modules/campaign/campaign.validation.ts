import { z } from "zod";

import {
  CampaignStatus,
} from "@prisma/client";

export const createCampaignSchema =
  z.object({
    name: z
      .string()
      .trim()
      .min(
        1,
        "Campaign name is required."
      )
      .max(
        200,
        "Campaign name must not exceed 200 characters."
      ),

    description:
      z
        .string()
        .trim()
        .max(
          5000,
          "Campaign description must not exceed 5000 characters."
        )
        .nullable()
        .optional(),

    startsAt:
      z
        .string()
        .datetime({
          offset: true,
        })
        .nullable()
        .optional(),

    endsAt:
      z
        .string()
        .datetime({
          offset: true,
        })
        .nullable()
        .optional(),
  })
  .refine(
    (data) => {
      if (
        !data.startsAt ||
        !data.endsAt
      ) {
        return true;
      }

      return (
        new Date(data.endsAt).getTime() >=
        new Date(data.startsAt).getTime()
      );
    },
    {
      message:
        "Campaign end time cannot be before start time.",
      path: ["endsAt"],
    }
  );

export const updateCampaignSchema =
  z.object({
    name: z
      .string()
      .trim()
      .min(
        1,
        "Campaign name cannot be empty."
      )
      .max(
        200,
        "Campaign name must not exceed 200 characters."
      )
      .optional(),

    description:
      z
        .string()
        .trim()
        .max(
          5000,
          "Campaign description must not exceed 5000 characters."
        )
        .nullable()
        .optional(),

    startsAt:
      z
        .string()
        .datetime({
          offset: true,
        })
        .nullable()
        .optional(),

    endsAt:
      z
        .string()
        .datetime({
          offset: true,
        })
        .nullable()
        .optional(),
  });

export const updateCampaignStatusSchema =
  z.object({
    status: z.nativeEnum(
      CampaignStatus
    ),
  });