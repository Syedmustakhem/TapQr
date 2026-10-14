// src/app/app/experiment-new.tsx
//
// New experiment — mirrors
// /dashboard/qr/experiments/new on the web dashboard.
//
// Multi-step create:
//   Step 1 — details (QR, name, description, schedule)
//   Step 2 — traffic allocation mode
//            (PERCENTAGE / FIXED)
//   Step 3 — variants (at least 2; each has a name,
//            an allocation %, and an action) with
//            live validation that allocations total
//            100%.
//
// Submit: POST /qr-experiments, then one
// POST /qr-experiments/:id/variants call per variant.

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useQuery } from "@tanstack/react-query";

import { queryClient } from "../../api/query-client";

import { getQRCodes } from "../../api/qrcodeApi";

import {
  createQRExperiment,
  createQRExperimentVariant,
  QRExperimentAllocationType,
} from "../../api/qrExperimentsApi";

import type { QRRuleActionType } from "../../api/qrRulesApi";

import { useCurrentBusiness } from "../../hooks/useCurrentBusiness";

import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import ScreenLoader from "../../components/loaders/ScreenLoader";

import { COLORS } from "../../constants/colors";
import { SPACING } from "../../constants/spacing";

const ACTION_OPTIONS: Array<{
  value: QRRuleActionType;
  label: string;
}> = [
  { value: "EXPERIENCE", label: "Experience" },
  { value: "REDIRECT", label: "Redirect" },
  { value: "CATALOG", label: "Catalog" },
  { value: "MENU", label: "Menu" },
  { value: "SERVICES", label: "Services" },
  { value: "PRODUCTS", label: "Products" },
  { value: "CONTACT", label: "Contact" },
  { value: "CAMPAIGN", label: "Campaign" },
  { value: "CUSTOM", label: "Custom" },
];

type VariantDraft = {
  name: string;
  allocation: string;
  actionType: QRRuleActionType;
  actionValue: string;
};

const EMPTY_VARIANT: VariantDraft = {
  name: "",
  allocation: "",
  actionType: "REDIRECT",
  actionValue: "",
};

const STEPS = [
  "Details",
  "Allocation",
  "Variants",
];

export default function ExperimentNewScreen() {
  const { businessId } = useCurrentBusiness();

  const [step, setStep] = useState(0);

  const [qrCodeId, setQrCodeId] =
    useState<string | null>(null);

  const [name, setName] = useState("");

  const [description, setDescription] =
    useState("");

  const [startsAt, setStartsAt] =
    useState("");

  const [endsAt, setEndsAt] = useState("");

  const [allocationType, setAllocationType] =
    useState<QRExperimentAllocationType>(
      "PERCENTAGE"
    );

  const [variants, setVariants] = useState<
    VariantDraft[]
  >([
    { ...EMPTY_VARIANT, name: "A" },
    { ...EMPTY_VARIANT, name: "B" },
  ]);

  const [saving, setSaving] = useState(false);

  const qrcodesQuery = useQuery({
    queryKey: ["qrcodes", businessId],
    queryFn: () =>
      getQRCodes(businessId as string),
    enabled: Boolean(businessId),
  });

  const qrcodes = qrcodesQuery.data ?? [];

  const allocationTotal = useMemo(() => {
    return variants.reduce((sum, variant) => {
      const n = Number(variant.allocation);

      return (
        sum +
        (Number.isFinite(n) && n >= 0 ? n : 0)
      );
    }, 0);
  }, [variants]);

  const allocationValid =
    Math.abs(allocationTotal - 100) < 0.01;

  function step1Valid(): string | null {
    if (!qrCodeId) {
      return "Pick the QR code this experiment runs on.";
    }

    if (!name.trim()) {
      return "Give the experiment a name.";
    }

    return null;
  }

  function variantsValid(): string | null {
    if (variants.length < 2) {
      return "Add at least 2 variants.";
    }

    for (const variant of variants) {
      if (!variant.name.trim()) {
        return "Every variant needs a name.";
      }

      const allocation = Number(
        variant.allocation
      );

      if (
        !Number.isFinite(allocation) ||
        allocation <= 0
      ) {
        return `Variant "${variant.name}" needs an allocation greater than 0.`;
      }

      if (!variant.actionValue.trim()) {
        return `Variant "${variant.name}" needs an action value.`;
      }
    }

    if (!allocationValid) {
      return `Allocations must total 100% (currently ${allocationTotal.toFixed(1)}%).`;
    }

    return null;
  }

  function handleNext() {
    if (step === 0) {
      const error = step1Valid();

      if (error) {
        Alert.alert("Missing details", error);

        return;
      }
    }

    setStep((prev) => Math.min(prev + 1, 2));
  }

  function updateVariant(
    index: number,
    next: Partial<VariantDraft>
  ) {
    setVariants((prev) =>
      prev.map((variant, i) =>
        i === index
          ? { ...variant, ...next }
          : variant
      )
    );
  }

  function removeVariant(index: number) {
    setVariants((prev) =>
      prev.filter((_, i) => i !== index)
    );
  }

  async function handleSubmit() {
    const error =
      step1Valid() ?? variantsValid();

    if (error) {
      Alert.alert("Cannot create", error);

      return;
    }

    setSaving(true);

    try {
      const experiment =
        await createQRExperiment({
          qrCodeId: qrCodeId as string,
          name: name.trim(),
          description:
            description.trim() || null,
          allocationType,
          startsAt: startsAt.trim()
            ? new Date(
                startsAt.trim()
              ).toISOString()
            : null,
          endsAt: endsAt.trim()
            ? new Date(
                endsAt.trim()
              ).toISOString()
            : null,
        });

      for (const variant of variants) {
        await createQRExperimentVariant(
          experiment.id,
          {
            name: variant.name.trim(),
            allocation: Number(
              variant.allocation
            ),
            actionType: variant.actionType,
            actionValue:
              variant.actionValue.trim(),
          }
        );
      }

      await queryClient.invalidateQueries({
        queryKey: ["qr-experiments"],
      });

      router.replace({
        pathname: "/app/experiment-detail",
        params: { id: experiment.id },
      });
    } catch (submitError) {
      Alert.alert(
        "Create failed",
        submitError instanceof Error
          ? submitError.message
          : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  }

  if (qrcodesQuery.isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenLoader />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={
          styles.scrollContent
        }
      >
        <Text style={styles.title}>
          New Experiment
        </Text>

        {/* Step indicator */}
        <View style={styles.stepsRow}>
          {STEPS.map((label, index) => {
            const active = index === step;

            const done = index < step;

            return (
              <View
                key={label}
                style={styles.stepItem}
              >
                <View
                  style={[
                    styles.stepDot,
                    active &&
                      styles.stepDotActive,
                    done &&
                      styles.stepDotDone,
                  ]}
                >
                  <Text
                    style={[
                      styles.stepDotText,
                      (active || done) &&
                        styles.stepDotTextActive,
                    ]}
                  >
                    {done ? "✓" : index + 1}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.stepLabel,
                    active && styles.stepLabelActive,
                  ]}
                >
                  {label}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Step 1 — details */}
        {step === 0 && (
          <>
            <Text style={styles.fieldLabel}>
              QR code
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
              style={styles.chipRow}
              contentContainerStyle={
                styles.chipRowContent
              }
            >
              {qrcodes.map((qr) => {
                const selected =
                  qr.id === qrCodeId;

                return (
                  <Pressable
                    key={qr.id}
                    onPress={() =>
                      setQrCodeId(qr.id)
                    }
                    style={[
                      styles.chip,
                      selected &&
                        styles.chipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        selected &&
                          styles.chipTextActive,
                      ]}
                    >
                      {qr.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Input
              label="Experiment name"
              placeholder="e.g. Summer menu vs catalog"
              value={name}
              onChangeText={setName}
            />

            <Input
              label="Description"
              placeholder="What are you testing? (optional)"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />

            <Input
              label="Starts at"
              placeholder="2026-10-06 09:00 (optional)"
              value={startsAt}
              onChangeText={setStartsAt}
            />

            <Input
              label="Ends at"
              placeholder="2026-12-31 23:59 (optional)"
              value={endsAt}
              onChangeText={setEndsAt}
            />
          </>
        )}

        {/* Step 2 — allocation mode */}
        {step === 1 && (
          <>
            <Text style={styles.fieldLabel}>
              Traffic allocation mode
            </Text>

            <Text style={styles.hint}>
              How variant allocations are
              interpreted. The allocations must
              still total 100%.
            </Text>

            <View style={styles.modeRow}>
              {(
                [
                  "PERCENTAGE",
                  "FIXED",
                ] as const
              ).map((option) => {
                const selected =
                  allocationType === option;

                return (
                  <Pressable
                    key={option}
                    onPress={() =>
                      setAllocationType(option)
                    }
                    style={[
                      styles.modeButton,
                      selected &&
                        styles.modeButtonActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.modeButtonText,
                        selected &&
                          styles.modeButtonTextActive,
                      ]}
                    >
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.hint}>
              {allocationType === "PERCENTAGE"
                ? "Each variant's allocation is a share of traffic (e.g. 50 / 50)."
                : "Each variant gets a fixed number of visitors out of 100 (e.g. 60 / 40)."}
            </Text>
          </>
        )}

        {/* Step 3 — variants */}
        {step === 2 && (
          <>
            <View style={styles.variantsHeader}>
              <Text style={styles.fieldLabel}>
                Variants
              </Text>

              <Text
                style={[
                  styles.totalText,
                  allocationValid
                    ? styles.totalValid
                    : styles.totalInvalid,
                ]}
              >
                Total:{" "}
                {allocationTotal.toFixed(1)}%
              </Text>
            </View>

            {variants.map(
              (variant, index) => (
                <View
                  key={index}
                  style={styles.variantCard}
                >
                  <View style={styles.cardRow}>
                    <Text
                      style={styles.cardTitle}
                    >
                      Variant {index + 1}
                    </Text>

                    {variants.length > 2 && (
                      <Pressable
                        onPress={() =>
                          removeVariant(index)
                        }
                      >
                        <Ionicons
                          name="close-circle-outline"
                          size={22}
                          color={COLORS.danger}
                        />
                      </Pressable>
                    )}
                  </View>

                  <Input
                    label="Name"
                    placeholder="e.g. Control"
                    value={variant.name}
                    onChangeText={(text) =>
                      updateVariant(index, {
                        name: text,
                      })
                    }
                  />

                  <Input
                    label={`Allocation (${
                      allocationType ===
                      "PERCENTAGE"
                        ? "%"
                        : "of 100"
                    })`}
                    placeholder="e.g. 50"
                    keyboardType="numeric"
                    value={variant.allocation}
                    onChangeText={(text) =>
                      updateVariant(index, {
                        allocation: text,
                      })
                    }
                  />

                  <Text
                    style={styles.fieldLabel}
                  >
                    Action type
                  </Text>

                  <View
                    style={styles.chipGrid}
                  >
                    {ACTION_OPTIONS.map(
                      (option) => {
                        const selected =
                          variant.actionType ===
                          option.value;

                        return (
                          <Pressable
                            key={option.value}
                            onPress={() =>
                              updateVariant(
                                index,
                                {
                                  actionType:
                                    option.value,
                                }
                              )
                            }
                            style={[
                              styles.chip,
                              selected &&
                                styles.chipActive,
                            ]}
                          >
                            <Text
                              style={[
                                styles.chipText,
                                selected &&
                                  styles.chipTextActive,
                              ]}
                            >
                              {option.label}
                            </Text>
                          </Pressable>
                        );
                      }
                    )}
                  </View>

                  <Input
                    label="Action value"
                    placeholder="URL, experience id..."
                    value={variant.actionValue}
                    onChangeText={(text) =>
                      updateVariant(index, {
                        actionValue: text,
                      })
                    }
                    autoCapitalize="none"
                  />
                </View>
              )
            )}

            <Pressable
              style={styles.outlineButton}
              onPress={() =>
                setVariants((prev) => [
                  ...prev,
                  { ...EMPTY_VARIANT },
                ])
              }
            >
              <Ionicons
                name="add"
                size={18}
                color={COLORS.primary}
              />

              <Text
                style={
                  styles.outlineButtonText
                }
              >
                Add variant
              </Text>
            </Pressable>
          </>
        )}

        {/* Navigation */}
        <View style={styles.navRow}>
          {step > 0 && (
            <Pressable
              style={styles.backButton}
              onPress={() =>
                setStep((prev) =>
                  Math.max(prev - 1, 0)
                )
              }
            >
              <Text
                style={styles.backButtonText}
              >
                Back
              </Text>
            </Pressable>
          )}

          <View style={styles.nextWrap}>
            {step < 2 ? (
              <Button
                title="Next"
                onPress={handleNext}
              />
            ) : (
              <Button
                title="Create experiment"
                onPress={handleSubmit}
                loading={saving}
                disabled={!allocationValid}
              />
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.huge * 2,
  },

  title: {
    fontSize: 26,
    fontWeight: "800",
    color: COLORS.text,
  },

  stepsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: SPACING.lg,
  },

  stepItem: {
    flex: 1,
    alignItems: "center",
  },

  stepDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },

  stepDotActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  stepDotDone: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },

  stepDotText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },

  stepDotTextActive: {
    color: COLORS.white,
  },

  stepLabel: {
    marginTop: SPACING.xs,
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },

  stepLabelActive: {
    color: COLORS.text,
  },

  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },

  hint: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    lineHeight: 18,
  },

  chipRow: {
    marginHorizontal: -SPACING.lg,
    marginBottom: SPACING.md,
  },

  chipRowContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.xs,
  },

  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },

  chip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    borderRadius: 999,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    marginRight: SPACING.xs,
    marginBottom: SPACING.xs,
  },

  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
  },

  chipTextActive: {
    color: COLORS.white,
  },

  modeRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },

  modeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: SPACING.md,
    alignItems: "center",
  },

  modeButtonActive: {
    backgroundColor: COLORS.text,
    borderColor: COLORS.text,
  },

  modeButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },

  modeButtonTextActive: {
    color: COLORS.white,
  },

  variantsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.xs,
  },

  totalText: {
    fontSize: 13,
    fontWeight: "700",
  },

  totalValid: {
    color: COLORS.success,
  },

  totalInvalid: {
    color: COLORS.danger,
  },

  variantCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },

  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.sm,
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },

  outlineButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: SPACING.md,
    marginTop: SPACING.xs,
  },

  outlineButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primary,
  },

  navRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginTop: SPACING.xl,
  },

  backButton: {
    height: 52,
    paddingHorizontal: SPACING.xl,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  backButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
  },

  nextWrap: {
    flex: 1,
  },
});
