import type { NextSectionStrategy } from "@/eligibility/NextSectionStrategy";
import type { EligibilityCheckInterface, EligibilityResult, FormData, FormDataField } from "@/types/EligibilityCheckInterface";
import type { VisibleSection } from "@/types/FieldMetadata";

import { ArbeitslosengeldCheck } from "@/eligibility/ArbeitslosengeldCheck";
import { BafoegCheck } from "@/eligibility/BafoegCheck";
import { BerufsausbildungsbeihilfeCheck } from "@/eligibility/BerufsausbildungsbeihilfeCheck";
import { BildungUndTeilhabeCheck } from "@/eligibility/BildungUndTeilhabeCheck";
import { BuergergeldCheck } from "@/eligibility/BuergergeldCheck";
import { applyDefaultsForHiddenFields, getFieldMetadata } from "@/eligibility/FieldMetadataRegistry";
import { GrundsicherungCheck } from "@/eligibility/GrundsicherungCheck";
import { HilfeZumLebensunterhaltCheck } from "@/eligibility/HilfeZumLebensunterhaltCheck";
import { KindergeldCheck } from "@/eligibility/KindergeldCheck";
import { KinderzuschlagCheck } from "@/eligibility/KinderzuschlagCheck";
import { OrderedNextSectionStrategy, RapidQuestionStrategy, YesNoFirstStrategy } from "@/eligibility/NextSectionStrategy";
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
  allMissingFieldsSize: number;
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

    // Register all eligibility checks here
    // All checks now use the generator-based pattern for lazy evaluation
    // of missing fields. This pattern provides better memory efficiency
    // and early termination capabilities.
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

  addAndPrefillField(
    field: FormDataField,
    prefilledFields: PrefilledFields,
    prefillFormData?: FormData
  ): PrefilledFields {
    if (!this.visibleFields.has(field)) {
      this.visibleFields.add(field);
      if (prefillFormData === undefined) {
        console.log("prefill undefined");

        return prefilledFields;
      }

      console.log("prefill", field);
      return {
        ...prefilledFields,
        [field]: prefillFormData[field],
      };
    }

    return {
      ...prefilledFields,
    };
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

  refreshEligibilityForm(
    formData: FormData,
    prefillFormData?: FormData
  ): PrefilledEligibilityEvaluationResult {
    // Apply default values for hidden fields before processing
    const processedFormData = applyDefaultsForHiddenFields(formData);

    let allResults = [];
    let allMissingFields = new Set<FormDataField>();

    let prefilledFields: PrefilledFields = {};

    for (const check of this.checks) {
      const result = check.evaluate(processedFormData);

      console.log("result", result);

      if (result.missingFields) {
        result.missingFields.forEach((field) => {
          allMissingFields.add(field);
        });
      }

      allResults.push(result);
    }

    const eligible = allResults.filter((result) => result.eligible === true);
    const ineligible = allResults.filter((result) => result.eligible === false);

    for (const sectionId of this.visibleSectionIds) {
      const fieldsInSection = this.getSectionFields(sectionId).filter(
        (field) => allMissingFields.has(field) || this.visibleFields.has(field)
      );

      fieldsInSection.forEach(
        (field) =>
          (prefilledFields = this.addAndPrefillField(
            field,
            prefilledFields,
            prefillFormData
          ))
      );
    }

    const allCurrentSectionsFilled = Array.from(this.visibleFields).every(
      (visibleField) => {
        const metadata = getFieldMetadata(visibleField);
        // If field is hidden due to visibleWhen condition, consider it as filled
        if (metadata.visibleWhen && !metadata.visibleWhen(processedFormData)) {
          return true;
        }
        return processedFormData[visibleField] !== undefined;
      }
    );
    console.log("m", allMissingFields);
    console.log("v", this.visibleFields);
    const skippedSections: string[] = [];

    while (
      this.visibleSectionIds.length + skippedSections.length <
        this.getTotalSectionCount() &&
      allCurrentSectionsFilled
    ) {
      const nextSection = this.nextSectionStrategy.getNextSection(
        [...this.visibleSectionIds, ...skippedSections],
        processedFormData,
        allResults
      );

      if (nextSection === null) {
        break;
      }

      const newFields = this.getSectionFields(nextSection).filter((field) =>
        allMissingFields.has(field)
      );

      console.log("newFields", newFields);
      if (newFields.length === 0) {
        skippedSections.push(nextSection);
        continue;
      }

      this.visibleSectionIds.push(nextSection);
      let newPrefilledFields = {};
      for (const field of newFields) {
        newPrefilledFields = this.addAndPrefillField(
          field,
          newPrefilledFields,
          prefillFormData
        );
      }

      prefilledFields = { ...prefilledFields, ...newPrefilledFields };

      // if we could prefill all fields from new section, we can add the next section already
      if (
        Object.values(newPrefilledFields).filter((value) => value !== undefined)
          .length === newFields.length
      ) {
        allMissingFields = new Set<FormDataField>();
        allResults = [];
        for (const check of this.checks) {
          const result = check.evaluate({ ...processedFormData, ...prefilledFields });

          if (result.missingFields) {
            result.missingFields.forEach((field) => {
              allMissingFields.add(field);
            });
          }

          allResults.push(result);
        }
        continue;
      }

      console.log("allMissingFields.size", allMissingFields.size);
      return {
        eligible,
        ineligible,
        all: allResults,
        visibleSections: this.getVisibleSectionsWithMetadata(),
        visibleFields: Array.from(this.visibleFields),
        prefilledFields,
        allMissingFieldsSize: allMissingFields.size,
      };
    }

    return {
      eligible,
      ineligible,
      all: allResults,
      visibleSections: this.getVisibleSectionsWithMetadata(),
      visibleFields: Array.from(this.visibleFields),
      prefilledFields,
      allMissingFieldsSize: allMissingFields.size,
    };
  }
}
