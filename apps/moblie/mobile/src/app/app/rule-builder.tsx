// src/app/app/rule-builder.tsx
//
// Visual rule builder — mirrors
// /dashboard/qr/rules/new on the web dashboard.
//
// CREATE:  POST /qr-rules (full rule body,
//          always saved as DRAFT).
// EDIT:    when ?edit=<ruleId> is present the form
//          is prefilled via GET /qr-rules/:ruleId and
//          saved via PATCH /qr-rules/:id (this is the
//          fix for the web's broken Edit flow).

import { Ionicons } from "@expo/vector-icons";
import {
  router,
  useLocalSearchParams,
} from "expo-router";
import { useEffect, useState } from "react";
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
  createQRRule,
  getQRRule,
  QRRuleActionType,
  QRRuleCondition,
  QRRuleConditionGroup,
  QRRuleConditionType,
  QRRuleLogic,
  QRRuleOperator,
  updateQRRule,
} from "../../api/qrRulesApi";

import { useCurrentBusiness } from "../../hooks/useCurrentBusiness";

import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import ScreenLoader from "../../components/loaders/ScreenLoader";

import { COLORS } from "../../constants/colors";
import { SPACING } from "../../constants/spacing";

const CONDITION_TYPE_OPTIONS: Array<{
  value: QRRuleConditionType;
  label: string;
}> = [
  { value: "TIME", label: "Time" },
  { value: "DATE", label: "Date" },
  {
    value: "DAY_OF_WEEK",
    label: "Day of week",
  },
  {
    value: "BUSINESS_HOURS",
    label: "Business hours",
  },
  { value: "DEVICE", label: "Device" },
  {
    value: "OPERATING_SYSTEM",
    label: "OS",
  },
  { value: "BROWSER", label: "Browser" },
  { value: "LANGUAGE", label: "Language" },
  { value: "COUNTRY", label: "Country" },
  { value: "STATE", label: "State" },
  { value: "CITY", label: "City" },
  {
    value: "GEO_RADIUS",
    label: "Geo radius",
  },
  { value: "REFERRER", label: "Referrer" },
  {
    value: "UTM_SOURCE",
    label: "UTM source",
  },
  {
    value: "UTM_MEDIUM",
    label: "UTM medium",
  },
  {
    value: "UTM_CAMPAIGN",
    label: "UTM campaign",
  },
  { value: "UTM_TERM", label: "UTM term" },
  {
    value: "UTM_CONTENT",
    label: "UTM content",
  },
  {
    value: "QR_SOURCE",
    label: "QR source",
  },
  {
    value: "QR_PLACEMENT",
    label: "QR placement",
  },
  {
    value: "QR_LOCATION",
    label: "QR location",
  },
  { value: "CAMPAIGN", label: "Campaign" },
  {
    value: "SCAN_COUNT",
    label: "Scan count",
  },
  {
    value: "VISITOR_TYPE",
    label: "Visitor type",
  },
  {
    value: "CUSTOMER_STATE",
    label: "Customer state",
  },
  {
    value: "CUSTOMER_SEGMENT",
    label: "Customer segment",
  },
  {
    value: "AUTHENTICATION_STATE",
    label: "Auth state",
  },
  {
    value: "BUSINESS_STATE",
    label: "Business state",
  },
  {
    value: "CATALOG_STATE",
    label: "Catalog state",
  },
  {
    value: "PRODUCT_AVAILABILITY",
    label: "Product avail.",
  },
  {
    value: "SUBSCRIPTION_PLAN",
    label: "Sub. plan",
  },
  { value: "CUSTOM", label: "Custom" },
];

const OPERATOR_OPTIONS: Array<{
  value: QRRuleOperator;
  label: string;
}> = [
  { value: "EQUALS", label: "Equals" },
  {
    value: "NOT_EQUALS",
    label: "Does not equal",
  },
  {
    value: "GREATER_THAN",
    label: "Greater than",
  },
  {
    value: "GREATER_THAN_OR_EQUAL",
    label: "Greater than or equal",
  },
  {
    value: "LESS_THAN",
    label: "Less than",
  },
  {
    value: "LESS_THAN_OR_EQUAL",
    label: "Less than or equal",
  },
  { value: "IN", label: "Is one of" },
  {
    value: "NOT_IN",
    label: "Is not one of",
  },
  { value: "BETWEEN", label: "Between" },
  {
    value: "NOT_BETWEEN",
    label: "Not between",
  },
  { value: "CONTAINS", label: "Contains" },
  {
    value: "NOT_CONTAINS",
    label: "Does not contain",
  },
  {
    value: "STARTS_WITH",
    label: "Starts with",
  },
  { value: "ENDS_WITH", label: "Ends with" },
  { value: "EXISTS", label: "Exists" },
  {
    value: "NOT_EXISTS",
    label: "Does not exist",
  },
];

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

const NEEDS_VALUE2 = new Set<QRRuleOperator>([
  "BETWEEN",
  "NOT_BETWEEN",
]);

const NEEDS_NO_VALUE = new Set<QRRuleOperator>([
  "EXISTS",
  "NOT_EXISTS",
]);

/* ============================================================
   Condition row editor
============================================================ */

type ConditionEditorProps = {
  condition: QRRuleCondition;
  onChange: (next: QRRuleCondition) => void;
  onRemove: () => void;
};

function ConditionEditor({
  condition,
  onChange,
  onRemove,
}: ConditionEditorProps) {
  return (
    <View style={styles.conditionCard}>
      <View style={styles.cardRow}>
        <Text style={styles.cardTitle}>
          Condition
        </Text>

        <Pressable onPress={onRemove}>
          <Ionicons
            name="close-circle-outline"
            size={22}
            color={COLORS.danger}
          />
        </Pressable>
      </View>

      <Text style={styles.fieldLabel}>
        Field
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipRow}
        contentContainerStyle={
          styles.chipRowContent
        }
      >
        {CONDITION_TYPE_OPTIONS.map(
          (option) => {
            const selected =
              condition.type === option.value;

            return (
              <Pressable
                key={option.value}
                onPress={() =>
                  onChange({
                    ...condition,
                    type: option.value,
                  })
                }
                style={[
                  styles.chip,
                  selected && styles.chipActive,
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
      </ScrollView>

      <Text style={styles.fieldLabel}>
        Operator
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipRow}
        contentContainerStyle={
          styles.chipRowContent
        }
      >
        {OPERATOR_OPTIONS.map(
          (option) => {
            const selected =
              condition.operator ===
              option.value;

            return (
              <Pressable
                key={option.value}
                onPress={() =>
                  onChange({
                    ...condition,
                    operator: option.value,
                  })
                }
                style={[
                  styles.chip,
                  selected && styles.chipActive,
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
      </ScrollView>

      {!NEEDS_NO_VALUE.has(
        condition.operator
      ) && (
        <Input
          label="Value"
          placeholder="e.g. mobile, India, 09:00"
          value={String(
            condition.value ?? ""
          )}
          onChangeText={(text) =>
            onChange({
              ...condition,
              value: text,
            })
          }
        />
      )}

      {NEEDS_VALUE2.has(
        condition.operator
      ) && (
        <Input
          label="Second value"
          placeholder="Upper bound"
          value={String(
            condition.value2 ?? ""
          )}
          onChangeText={(text) =>
            onChange({
              ...condition,
              value2: text,
            })
          }
        />
      )}
    </View>
  );
}

/* ============================================================
   Condition group editor (recursive)
============================================================ */

type GroupEditorProps = {
  group: QRRuleConditionGroup;
  depth: number;
  onChange: (
    next: QRRuleConditionGroup
  ) => void;
  onRemove: () => void;
};

function GroupEditor({
  group,
  depth,
  onChange,
  onRemove,
}: GroupEditorProps) {
  return (
    <View
      style={[
        styles.groupCard,
        depth > 0 && styles.groupCardNested,
      ]}
    >
      <View style={styles.cardRow}>
        <Text style={styles.cardTitle}>
          Condition group
        </Text>

        <Pressable onPress={onRemove}>
          <Ionicons
            name="close-circle-outline"
            size={22}
            color={COLORS.danger}
          />
        </Pressable>
      </View>

      {/* Group logic */}
      <View style={styles.logicRow}>
        {(["AND", "OR"] as const).map(
          (option) => {
            const selected =
              group.logic === option;

            return (
              <Pressable
                key={option}
                onPress={() =>
                  onChange({
                    ...group,
                    logic: option,
                  })
                }
                style={[
                  styles.logicButton,
                  selected &&
                    styles.logicButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.logicButtonText,
                    selected &&
                      styles.logicButtonTextActive,
                  ]}
                >
                  {option}
                </Text>
              </Pressable>
            );
          }
        )}
      </View>

      {/* Conditions inside the group */}
      {group.conditions.map(
        (condition, index) => (
          <ConditionEditor
            key={index}
            condition={condition}
            onChange={(next) => {
              const nextConditions =
                group.conditions.map(
                  (item, i) =>
                    i === index
                      ? next
                      : item
                );

              onChange({
                ...group,
                conditions: nextConditions,
              });
            }}
            onRemove={() => {
              onChange({
                ...group,
                conditions:
                  group.conditions.filter(
                    (_, i) => i !== index
                  ),
              });
            }}
          />
        )
      )}

      {/* Nested groups (recursive) */}
      {(group.children ?? []).map(
        (child, childIndex) => (
          <GroupEditor
            key={childIndex}
            group={child}
            depth={depth + 1}
            onChange={(next) => {
              const nextChildren = (
                group.children ?? []
              ).map((item, i) =>
                i === childIndex ? next : item
              );

              onChange({
                ...group,
                children: nextChildren,
              });
            }}
            onRemove={() => {
              onChange({
                ...group,
                children: (
                  group.children ?? []
                ).filter(
                  (_, i) =>
                    i !== childIndex
                ),
              });
            }}
          />
        )
      )}

      <View style={styles.addRow}>
        <Pressable
          style={styles.addButton}
          onPress={() =>
            onChange({
              ...group,
              conditions: [
                ...group.conditions,
                {
                  type: "DEVICE",
                  operator: "EQUALS",
                  value: "",
                },
              ],
            })
          }
        >
          <Ionicons
            name="add"
            size={16}
            color={COLORS.primary}
          />

          <Text style={styles.addButtonText}>
            Condition
          </Text>
        </Pressable>

        <Pressable
          style={styles.addButton}
          onPress={() =>
            onChange({
              ...group,
              children: [
                ...(group.children ?? []),
                {
                  logic: "AND",
                  conditions: [],
                },
              ],
            })
          }
        >
          <Ionicons
            name="add"
            size={16}
            color={COLORS.primary}
          />

          <Text style={styles.addButtonText}>
            Group
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

/* ============================================================
   Screen
============================================================ */

export default function RuleBuilderScreen() {
  const params = useLocalSearchParams<{
    edit?: string;
    qrId?: string;
  }>();

  const editRuleId = params.edit
    ? String(params.edit)
    : null;

  const isEditMode = Boolean(editRuleId);

  const { businessId } = useCurrentBusiness();

  const qrcodesQuery = useQuery({
    queryKey: ["qrcodes", businessId],
    queryFn: () =>
      getQRCodes(businessId as string),
    enabled: Boolean(businessId),
  });

  const qrcodes = qrcodesQuery.data ?? [];

  const existingRuleQuery = useQuery({
    queryKey: ["qr-rule", editRuleId],
    queryFn: () =>
      getQRRule(editRuleId as string),
    enabled: isEditMode,
  });

  const [name, setName] = useState("");
  const [description, setDescription] =
    useState("");

  const [qrCodeId, setQrCodeId] =
    useState<string | null>(null);

  const [priority, setPriority] =
    useState("0");

  const [logic, setLogic] =
    useState<QRRuleLogic>("AND");

  const [actionType, setActionType] =
    useState<QRRuleActionType>("EXPERIENCE");

  const [actionValue, setActionValue] =
    useState("");

  const [fallbackEnabled, setFallbackEnabled] =
    useState(false);

  const [fallbackType, setFallbackType] =
    useState<QRRuleActionType>("REDIRECT");

  const [fallbackValue, setFallbackValue] =
    useState("");

  const [startsAt, setStartsAt] =
    useState("");

  const [endsAt, setEndsAt] = useState("");

  const [conditions, setConditions] =
    useState<QRRuleCondition[]>([]);

  const [groups, setGroups] = useState<
    QRRuleConditionGroup[]
  >([]);

  const [prefilledFor, setPrefilledFor] =
    useState<string | null>(null);

  const [saving, setSaving] = useState(false);

  /*
   * Default QR selection (create mode): prefer the
   * ?qrId= param, else the first QR.
   */
  useEffect(() => {
    if (isEditMode || qrCodeId) {
      return;
    }

    const fromParam = params.qrId
      ? String(params.qrId)
      : null;

    const match =
      fromParam &&
      qrcodes.some(
        (qr) => qr.id === fromParam
      )
        ? fromParam
        : (qrcodes[0]?.id ?? null);

    setQrCodeId(match);
  }, [
    isEditMode,
    qrCodeId,
    params.qrId,
    qrcodes,
  ]);

  /*
   * Edit mode: prefill the form once the rule loads.
   */
  useEffect(() => {
    const rule = existingRuleQuery.data;

    if (
      !isEditMode ||
      !rule ||
      prefilledFor === rule.id
    ) {
      return;
    }

    setPrefilledFor(rule.id);
    setName(rule.name);
    setDescription(rule.description ?? "");
    setQrCodeId(rule.qrCodeId);
    setPriority(String(rule.priority ?? 0));
    setLogic(rule.logic ?? "AND");
    setActionType(
      rule.actionType ?? "EXPERIENCE"
    );
    setActionValue(rule.actionValue ?? "");
    setFallbackEnabled(
      Boolean(rule.fallbackActionType)
    );
    setFallbackType(
      rule.fallbackActionType ?? "REDIRECT"
    );
    setFallbackValue(
      rule.fallbackActionValue ?? ""
    );
    setStartsAt(rule.startsAt ?? "");
    setEndsAt(rule.endsAt ?? "");
    setConditions(rule.conditions ?? []);
    setGroups(rule.groups ?? []);
  }, [
    isEditMode,
    existingRuleQuery.data,
    prefilledFor,
  ]);

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert(
        "Missing name",
        "Give the rule a name."
      );

      return;
    }

    if (!qrCodeId) {
      Alert.alert(
        "Missing QR code",
        "Pick the QR code this rule applies to."
      );

      return;
    }

    if (
      conditions.length === 0 &&
      groups.length === 0
    ) {
      Alert.alert(
        "No conditions",
        "Add at least one condition or condition group."
      );

      return;
    }

    const parsedPriority = Number(priority);

    const fallbackActionType =
      fallbackEnabled ? fallbackType : null;

    const fallbackActionValue =
      fallbackEnabled &&
      fallbackValue.trim()
        ? fallbackValue.trim()
        : null;

    setSaving(true);

    try {
      if (isEditMode && editRuleId) {
        await updateQRRule(editRuleId, {
          name: name.trim(),
          description:
            description.trim() || null,
          priority: Number.isFinite(
            parsedPriority
          )
            ? parsedPriority
            : 0,
          logic,
          conditions,
          groups,
          actionType,
          actionValue:
            actionValue.trim() || null,
          fallbackActionType,
          fallbackActionValue,
        });

        await queryClient.invalidateQueries({
          queryKey: ["qr-rule", editRuleId],
        });
      } else {
        await createQRRule({
          qrCodeId,
          name: name.trim(),
          description:
            description.trim() || undefined,
          priority: Number.isFinite(
            parsedPriority
          )
            ? parsedPriority
            : 0,
          logic,
          conditions,
          groups,
          actionType,
          actionValue:
            actionValue.trim() || null,
          fallbackActionType:
            fallbackActionType ?? undefined,
          fallbackActionValue:
            fallbackActionValue ??
            undefined,
          startsAt: startsAt.trim()
            ? new Date(
                startsAt.trim()
              ).toISOString()
            : undefined,
          endsAt: endsAt.trim()
            ? new Date(
                endsAt.trim()
              ).toISOString()
            : undefined,
          status: "DRAFT",
        });
      }

      await queryClient.invalidateQueries({
        queryKey: ["qr-rules"],
      });

      router.back();
    } catch (error) {
      Alert.alert(
        "Save failed",
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  }

  if (isEditMode && existingRuleQuery.isLoading) {
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
          {isEditMode
            ? "Edit Rule"
            : "New Rule"}
        </Text>

        <Text style={styles.subtitle}>
          {isEditMode
            ? "Changes save via PATCH — drafts stay drafts until you publish."
            : "Rules save as drafts. Publish them from the list when ready."}
        </Text>

        {/* Basics */}
        <Text style={styles.sectionLabel}>
          Basics
        </Text>

        <Input
          label="Rule name"
          placeholder="e.g. Lunch-hour menu"
          value={name}
          onChangeText={setName}
        />

        <Input
          label="Description"
          placeholder="What this rule does (optional)"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
        />

        <Text style={styles.fieldLabel}>
          QR code
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
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
                  selected && styles.chipActive,
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
          label="Priority"
          placeholder="0"
          keyboardType="numeric"
          value={priority}
          onChangeText={setPriority}
        />

        <Text style={styles.fieldLabel}>
          Top-level logic
        </Text>

        <View style={styles.logicRow}>
          {(["AND", "OR"] as const).map(
            (option) => {
              const selected =
                logic === option;

              return (
                <Pressable
                  key={option}
                  onPress={() =>
                    setLogic(option)
                  }
                  style={[
                    styles.logicButton,
                    selected &&
                      styles.logicButtonActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.logicButtonText,
                      selected &&
                        styles.logicButtonTextActive,
                    ]}
                  >
                    {option}
                  </Text>
                </Pressable>
              );
            }
          )}
        </View>

        {/* Action */}
        <Text style={styles.sectionLabel}>
          Routing action
        </Text>

        <Text style={styles.fieldLabel}>
          Action type
        </Text>

        <View style={styles.chipGrid}>
          {ACTION_OPTIONS.map((option) => {
            const selected =
              actionType === option.value;

            return (
              <Pressable
                key={option.value}
                onPress={() =>
                  setActionType(option.value)
                }
                style={[
                  styles.chip,
                  selected && styles.chipActive,
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
          })}
        </View>

        <Input
          label="Action value"
          placeholder="URL, experience id, campaign id..."
          value={actionValue}
          onChangeText={setActionValue}
          autoCapitalize="none"
        />

        <View style={styles.checkboxRow}>
          <Pressable
            style={styles.checkbox}
            onPress={() =>
              setFallbackEnabled(
                (prev) => !prev
              )
            }
          >
            {fallbackEnabled && (
              <Ionicons
                name="checkmark"
                size={18}
                color={COLORS.primary}
              />
            )}
          </Pressable>

          <Text style={styles.checkboxLabel}>
            Fallback action (used when the rule
            does not match)
          </Text>
        </View>

        {fallbackEnabled && (
          <>
            <Text style={styles.fieldLabel}>
              Fallback type
            </Text>

            <View style={styles.chipGrid}>
              {ACTION_OPTIONS.map(
                (option) => {
                  const selected =
                    fallbackType ===
                    option.value;

                  return (
                    <Pressable
                      key={option.value}
                      onPress={() =>
                        setFallbackType(
                          option.value
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
              label="Fallback value"
              placeholder="URL, experience id..."
              value={fallbackValue}
              onChangeText={setFallbackValue}
              autoCapitalize="none"
            />
          </>
        )}

        {/* Conditions */}
        <Text style={styles.sectionLabel}>
          Conditions
        </Text>

        {conditions.map(
          (condition, index) => (
            <ConditionEditor
              key={index}
              condition={condition}
              onChange={(next) =>
                setConditions((prev) =>
                  prev.map((item, i) =>
                    i === index ? next : item
                  )
                )
              }
              onRemove={() =>
                setConditions((prev) =>
                  prev.filter(
                    (_, i) => i !== index
                  )
                )
              }
            />
          )
        )}

        <Pressable
          style={styles.outlineButton}
          onPress={() =>
            setConditions((prev) => [
              ...prev,
              {
                type: "DEVICE",
                operator: "EQUALS",
                value: "",
              },
            ])
          }
        >
          <Ionicons
            name="add"
            size={18}
            color={COLORS.primary}
          />

          <Text
            style={styles.outlineButtonText}
          >
            Add condition
          </Text>
        </Pressable>

        {/* Nested groups */}
        {groups.map((group, index) => (
          <GroupEditor
            key={index}
            group={group}
            depth={0}
            onChange={(next) =>
              setGroups((prev) =>
                prev.map((item, i) =>
                  i === index ? next : item
                )
              )
            }
            onRemove={() =>
              setGroups((prev) =>
                prev.filter(
                  (_, i) => i !== index
                )
              )
            }
          />
        ))}

        <Pressable
          style={styles.outlineButton}
          onPress={() =>
            setGroups((prev) => [
              ...prev,
              { logic: "AND", conditions: [] },
            ])
          }
        >
          <Ionicons
            name="add"
            size={18}
            color={COLORS.primary}
          />

          <Text
            style={styles.outlineButtonText}
          >
            Add condition group
          </Text>
        </Pressable>

        {/* Schedule */}
        <Text style={styles.sectionLabel}>
          Schedule
        </Text>

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

        <Button
          title={
            isEditMode
              ? "Save changes"
              : "Save as draft"
          }
          onPress={handleSave}
          loading={saving}
        />
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

  subtitle: {
    marginTop: SPACING.xs,
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  sectionLabel: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.sm,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: COLORS.textSecondary,
    textTransform: "uppercase",
  },

  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: SPACING.xs,
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

  logicRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },

  logicButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: SPACING.md,
    alignItems: "center",
  },

  logicButtonActive: {
    backgroundColor: COLORS.text,
    borderColor: COLORS.text,
  },

  logicButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },

  logicButtonTextActive: {
    color: COLORS.white,
  },

  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: SPACING.md,
  },

  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  checkboxLabel: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: 14,
    color: COLORS.text,
  },

  conditionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },

  groupCard: {
    backgroundColor: "#F1F5F9",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },

  groupCardNested: {
    marginTop: SPACING.sm,
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

  addRow: {
    flexDirection: "row",
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },

  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  addButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primary,
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
});
