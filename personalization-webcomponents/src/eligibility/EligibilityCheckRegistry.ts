import type { NextSectionStrategy } from "@/eligibility/NextSectionStrategy";
import type {
  EligibilityCheckInterface,
  EligibilityResult,
  FormData,
  FormDataField,
} from "@/types/EligibilityCheckInterface";
import type { VisibleSection } from "@/types/FieldMetadata";

import { ArbeitslosengeldCheck } from "@/eligibility/ArbeitslosengeldCheck";
import { BafoegCheck } from "@/eligibility/BafoegCheck";
import { BerufsausbildungsbeihilfeCheck } from "@/eligibility/BerufsausbildungsbeihilfeCheck";
import { BildungUndTeilhabeCheck } from "@/eligibility/BildungUndTeilhabeCheck";
import { BuergergeldCheck } from "@/eligibility/BuergergeldCheck";
import {
  applyDefaultsForHiddenFields,
  getFieldMetadata,
} from "@/eligibility/FieldMetadataRegistry";
import { GrundsicherungCheck } from "@/eligibility/GrundsicherungCheck";
import { HilfeZumLebensunterhaltCheck } from "@/eligibility/HilfeZumLebensunterhaltCheck";
import { KindergeldCheck } from "@/eligibility/KindergeldCheck";
import { KinderzuschlagCheck } from "@/eligibility/KinderzuschlagCheck";
import { RapidQuestionStrategy } from "@/eligibility/NextSectionStrategy";
import { WohnGeldCheck } from "@/eligibility/WohnGeldCheck";

export type PrefilledFields = {
  [K in FormDataField]?: FormData[K];
};

export interface PrefilledEligibilityEvaluationResult {
  eligible: EligibilityResult[];
  ineligible: EligibilityResult[];
  all: EligibilityResult[];
  visibleFields: FormDataField[];
  /** Sections with metadata (id, title, fields) for dynamic rendering */
  visibleSections: VisibleSection[];
  prefilledFields: PrefilledFields;
  /** The number of all unique fields that checks report as missing */
  allMissingFields: FormDataField[];
}

/**
 * Result of evaluating all eligibility checks
 */
interface EvaluationResult {
  results: EligibilityResult[];
  missingFields: Set<FormDataField>;
}

/**
 * @deprecated Use string section IDs from NextSectionStrategy.getSectionStructure() instead
 */
export type FormSection =
  | "personalInfo"
  | "financialInfo"
  | "householdInfo"
  | "educationEmployment"
  | "specialCircumstances"
  | "insuranceBenefits";

export class EligibilityCheckRegistry {
  private checks: EligibilityCheckInterface[] = [];
  private visibleSectionIds: string[] = [];
  private visibleFields = new Set<FormDataField>();
  private nextSectionStrategy: NextSectionStrategy;

  constructor(strategy?: NextSectionStrategy) {
    this.nextSectionStrategy = strategy ?? new RapidQuestionStrategy();
    this.registerDefaultChecks();
  }

  /**
   * Register all default eligibility checks
   */
  private registerDefaultChecks(): void {
    this.registerCheck(new WohnGeldCheck());
    this.registerCheck(new ArbeitslosengeldCheck());
    this.registerCheck(new BafoegCheck());
    this.registerCheck(new BerufsausbildungsbeihilfeCheck());
    this.registerCheck(new BildungUndTeilhabeCheck());
    this.registerCheck(new BuergergeldCheck());
    this.registerCheck(new GrundsicherungCheck());
    this.registerCheck(new HilfeZumLebensunterhaltCheck());
    this.registerCheck(new KindergeldCheck());
    this.registerCheck(new KinderzuschlagCheck());
  }

  registerCheck(check: EligibilityCheckInterface): void {
    this.checks.push(check);
  }

  private getSectionFields(sectionId: string): FormDataField[] {
    return this.nextSectionStrategy.getSectionFields(sectionId);
  }

  private getTotalSectionCount(): number {
    return this.nextSectionStrategy.getSectionStructure().sections.length;
  }

  /**
   * Evaluate all registered checks against the provided form data
   */
  private evaluateAllChecks(formData: FormData): EvaluationResult {
    const results: EligibilityResult[] = [];
    const missingFields = new Set<FormDataField>();

    for (const check of this.checks) {
      const result = check.evaluate(formData);

      if (result.missingFields) {
        result.missingFields.forEach((field) => {
          missingFields.add(field);
        });
      }

      results.push(result);
    }

    return { results, missingFields };
  }

  /**
   * Add a field to visible fields and prefill if data is available
   */
  private addAndPrefillField(
    field: FormDataField,
    prefilledFields: PrefilledFields,
    prefillFormData?: FormData
  ): PrefilledFields {
    if (!this.visibleFields.has(field)) {
      this.visibleFields.add(field);
      if (prefillFormData === undefined) {
        return prefilledFields;
      }

      return {
        ...prefilledFields,
        [field]: prefillFormData[field],
      };
    }

    return { ...prefilledFields };
  }

  /**
   * Prefill fields from a section based on missing fields and prefill data
   */
  private prefillSectionFields(
    sectionId: string,
    missingFields: Set<FormDataField>,
    prefillFormData?: FormData
  ): PrefilledFields {
    const fieldsInSection = this.getSectionFields(sectionId).filter(
      (field) => missingFields.has(field) || this.visibleFields.has(field)
    );

    let prefilledFields: PrefilledFields = {};
    for (const field of fieldsInSection) {
      prefilledFields = this.addAndPrefillField(
        field,
        prefilledFields,
        prefillFormData
      );
    }

    return prefilledFields;
  }

  /**
   * Check if all visible fields are filled
   */
  private areAllVisibleFieldsFilled(processedFormData: FormData): boolean {
    return Array.from(this.visibleFields).every((visibleField) => {
      const metadata = getFieldMetadata(visibleField);
      // If field is hidden due to visibleWhen condition, consider it as filled
      if (
        metadata.visibleWhen &&
        metadata.visibleWhen(processedFormData) === false
      ) {
        return true;
      }
      return processedFormData[visibleField] !== undefined;
    });
  }

  /**
   * Convert visible section IDs to VisibleSection objects with metadata
   */
  private getVisibleSectionsWithMetadata(): VisibleSection[] {
    return this.visibleSectionIds
      .map((sectionId) => {
        const section = this.nextSectionStrategy.getSectionById(sectionId);
        if (!section) return null;
        return {
          id: section.id,
          title: section.title,
          fields: section.fields,
        };
      })
      .filter((section): section is VisibleSection => section !== null);
  }

  /**
   * Build the final result object
   */
  private buildResult(
    allResults: EligibilityResult[],
    allMissingFields: Set<FormDataField>,
    prefilledFields: PrefilledFields
  ): PrefilledEligibilityEvaluationResult {
    const eligible = allResults.filter((result) => result.eligible === true);
    const ineligible = allResults.filter((result) => result.eligible === false);

    return {
      eligible,
      ineligible,
      all: allResults,
      visibleSections: this.getVisibleSectionsWithMetadata(),
      visibleFields: Array.from(this.visibleFields),
      prefilledFields,
      allMissingFields: Array.from(allMissingFields),
    };
  }

  /**
   * Main method to refresh the eligibility form state.
   * Evaluates all checks, determines which sections/fields should be visible,
   * and prefills data from the provided prefill source.
   */
  refreshEligibilityForm(
    formData: FormData,
    prefillFormData?: FormData
  ): PrefilledEligibilityEvaluationResult {
    // Apply default values for hidden fields before processing
    const processedFormData = applyDefaultsForHiddenFields(formData);

    // Initial evaluation
    let evaluation = this.evaluateAllChecks(processedFormData);
    let prefilledFields: PrefilledFields = {};

    // Prefill existing visible sections
    for (const sectionId of this.visibleSectionIds) {
      const sectionPrefills = this.prefillSectionFields(
        sectionId,
        evaluation.missingFields,
        prefillFormData
      );
      prefilledFields = { ...prefilledFields, ...sectionPrefills };
    }

    const allCurrentSectionsFilled =
      this.areAllVisibleFieldsFilled(processedFormData);
    const skippedSections: string[] = [];

    // Add new sections as needed
    while (
      this.visibleSectionIds.length + skippedSections.length <
        this.getTotalSectionCount() &&
      allCurrentSectionsFilled
    ) {
      const nextSection = this.nextSectionStrategy.getNextSection(
        [...this.visibleSectionIds, ...skippedSections],
        processedFormData,
        evaluation.results
      );

      if (nextSection === null) {
        break;
      }

      const newFields = this.getSectionFields(nextSection).filter((field) =>
        evaluation.missingFields.has(field)
      );

      if (newFields.length === 0) {
        skippedSections.push(nextSection);
        continue;
      }

      this.visibleSectionIds.push(nextSection);

      // Prefill fields in the new section
      let newPrefilledFields: PrefilledFields = {};
      for (const field of newFields) {
        newPrefilledFields = this.addAndPrefillField(
          field,
          newPrefilledFields,
          prefillFormData
        );
      }
      prefilledFields = { ...prefilledFields, ...newPrefilledFields };

      // Re-evaluate with prefilled data
      const allPrefilled =
        Object.values(newPrefilledFields).filter((value) => value !== undefined)
          .length === newFields.length;

      // Re-evaluate checks with updated data
      evaluation = this.evaluateAllChecks({
        ...processedFormData,
        ...prefilledFields,
      });

      // If not all fields were prefilled, return immediately
      if (!allPrefilled) {
        return this.buildResult(
          evaluation.results,
          evaluation.missingFields,
          prefilledFields
        );
      }
    }

    return this.buildResult(
      evaluation.results,
      evaluation.missingFields,
      prefilledFields
    );
  }
}
