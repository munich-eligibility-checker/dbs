import type { PrefilledFields } from "@/eligibility/EligibilityCheckRegistry";
import type {
  EligibilityResult,
  FormData,
  FormDataField,
} from "@/types/EligibilityCheckInterface";
import type { VisibleSection } from "@/types/FieldMetadata";

import { computed, ref, watch } from "vue";

import { EligibilityCheckRegistry } from "@/eligibility/EligibilityCheckRegistry";
import { getFieldMetadata } from "@/eligibility/FieldMetadataRegistry";

/**
 * Composable for managing the eligibility checking form state.
 * Handles form data, eligibility evaluation, and field visibility.
 */
export function useEligibilityForm() {
  const formFields = ref<FormData>({});
  const eligibilityResults = ref<EligibilityResult[]>([]);
  const allEligibilityResults = ref<EligibilityResult[]>([]);
  const visibleFields = ref<FormDataField[]>([]);
  const allMissingFieldsSize = ref<number>(0);
  const prefilledFields = ref<PrefilledFields>({});
  const visibleSections = ref<VisibleSection[]>([]);
  const isCheckingEligibility = ref(false);

  const eligibilityRegistry = new EligibilityCheckRegistry();

  const filledFieldsCount = computed(() => {
    return visibleFields.value.filter(
      (field) =>
        formFields.value[field] !== undefined &&
        formFields.value[field] !== null &&
        formFields.value[field] !== ""
    ).length;
  });

  const progressPercent = computed(() => {
    if (allMissingFieldsSize.value === 0) return 0;
    return Math.round(
      (filledFieldsCount.value / allMissingFieldsSize.value) * 100
    );
  });

  const isFormComplete = computed(() => {
    return progressPercent.value === 100 && filledFieldsCount.value > 0;
  });

  function shouldShowField(fieldName: FormDataField): boolean {
    if (!visibleFields.value.includes(fieldName)) return false;
    const metadata = getFieldMetadata(fieldName);
    return !(
      metadata.visibleWhen && metadata.visibleWhen(formFields.value) === false
    );
  }

  function updateFormData(newFormData: FormData): void {
    formFields.value = newFormData;
  }

  function checkEligibility(prefillData?: FormData): void {
    if (isCheckingEligibility.value) {
      return;
    }
    isCheckingEligibility.value = true;

    const result = eligibilityRegistry.refreshEligibilityForm(
      formFields.value,
      prefillData
    );

    const prefilledData = result.prefilledFields;
    formFields.value = { ...formFields.value, ...prefilledData };

    visibleSections.value = result.visibleSections;
    prefilledFields.value = result.prefilledFields;
    allEligibilityResults.value = result.all;
    eligibilityResults.value = result.eligible;
    visibleFields.value = result.visibleFields;
    allMissingFieldsSize.value = new Set([
      ...result.allMissingFields,
      ...result.visibleFields,
    ]).size;

    // Use setTimeout to allow the current evaluation to complete
    setTimeout(() => {
      isCheckingEligibility.value = false;
    }, 0);
  }

  function setupAutoCheck(
    prefillDataGetter?: () => FormData | undefined
  ): void {
    watch(
      formFields,
      () => {
        checkEligibility(prefillDataGetter?.());
      },
      { deep: true }
    );
  }

  return {
    formFields,
    eligibilityResults,
    allEligibilityResults,
    visibleFields,
    allMissingFieldsSize,
    prefilledFields,
    visibleSections,

    filledFieldsCount,
    progressPercent,
    isFormComplete,

    shouldShowField,
    updateFormData,
    checkEligibility,
    setupAutoCheck,
  };
}
