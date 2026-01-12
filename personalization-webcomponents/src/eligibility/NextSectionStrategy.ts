import type {
  EligibilityResult,
  FormData,
  FormDataField,
} from "@/types/EligibilityCheckInterface";
import type {
  SectionDefinition,
  SectionStructure,
} from "@/types/FieldMetadata";

/**
 * Strategy interface for determining section order and structure.
 * Each strategy defines its own section structure with custom IDs, titles, and fields.
 */
export interface NextSectionStrategy {
  /**
   * Get the complete section structure defined by this strategy.
   * This includes section IDs, titles, and the fields in each section.
   */
  getSectionStructure(): SectionStructure;

  /**
   * Get the next section to display based on current state.
   * @param consideredSections - Section IDs that have already been considered
   * @param formData - Current form data
   * @param results - Current eligibility results
   * @returns The next section ID to display, or null if no more sections
   */
  getNextSection(
    consideredSections: string[],
    formData: FormData,
    results: EligibilityResult[]
  ): string | null;

  /**
   * Get the fields for a specific section.
   * @param sectionId - The section ID
   * @returns Array of field names in the section
   */
  getSectionFields(sectionId: string): FormDataField[];

  /**
   * Get the section definition by ID.
   * @param sectionId - The section ID
   * @returns The section definition or undefined if not found
   */
  getSectionById(sectionId: string): SectionDefinition | undefined;
}

/**
 * Default strategy that presents sections in a fixed order.
 * Defines the standard 6 sections for German social benefits eligibility.
 */
export class OrderedNextSectionStrategy implements NextSectionStrategy {
  private sectionStructure: SectionStructure = {
    sections: [
      {
        id: "personalInfo",
        title: "Persönliche Informationen",
        fields: [
          "firstName",
          "lastName",
          "dateOfBirth",
          "gender",
          "maritalStatus",
          "nationality",
          "residenceStatus",
          "residenceInGermany",
        ],
      },
      {
        id: "financialInfo",
        title: "Finanzielle Angaben",
        fields: [
          "grossMonthlyIncome",
          "netMonthlyIncome",
          "assets",
          "monthlyRent",
        ],
      },
      {
        id: "householdInfo",
        title: "Haushalt",
        fields: [
          "householdSize",
          "numberOfChildren",
          "childrenAges",
          "isSingleParent",
          "livesWithParents",
        ],
      },
      {
        id: "educationEmployment",
        title: "Bildung & Beschäftigung",
        fields: ["employmentStatus", "educationLevel", "isStudent"],
      },
      {
        id: "specialCircumstances",
        title: "Besondere Umstände",
        fields: [
          "hasDisability",
          "disabilityDegree",
          "isPregnant",
          "hasCareNeeds",
          "pensionEligible",
          "citizenBenefitLast3Years",
          "hasFinancialHardship",
          "workAbility",
        ],
      },
      {
        id: "insuranceBenefits",
        title: "Versicherung & Leistungen",
        fields: [
          "healthInsurance",
          "hasCareInsurance",
          "receivesUnemploymentBenefit1",
          "receivesUnemploymentBenefit2",
          "receivesPension",
          "receivesChildBenefit",
          "receivesHousingBenefit",
          "receivesStudentAid",
        ],
      },
    ],
  };

  private sectionMap: Map<string, SectionDefinition>;

  constructor() {
    // Build a map for quick section lookup
    this.sectionMap = new Map(
      this.sectionStructure.sections.map((section) => [section.id, section])
    );
  }

  getSectionStructure(): SectionStructure {
    return this.sectionStructure;
  }

  getNextSection(
    consideredSections: string[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _formData: FormData,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _eligibilityResults: EligibilityResult[]
  ): string | null {
    for (const section of this.sectionStructure.sections) {
      if (!consideredSections.includes(section.id)) {
        return section.id;
      }
    }
    return null;
  }

  getSectionFields(sectionId: string): FormDataField[] {
    const section = this.sectionMap.get(sectionId);
    return section ? section.fields : [];
  }

  getSectionById(sectionId: string): SectionDefinition | undefined {
    return this.sectionMap.get(sectionId);
  }
}

/**
 * Strategy that asks all yes/no questions first for quick filtering,
 * then collects detailed information in subsequent sections.
 */
export class YesNoFirstStrategy implements NextSectionStrategy {
  private sectionStructure: SectionStructure = {
    sections: [
      {
        id: "quickQuestions",
        title: "Schnelle Fragen",
        fields: [
          // All yes/no fields grouped together for quick answers
          "residenceInGermany",
          "livesWithParents",
          "isSingleParent",
          "isStudent",
          "hasDisability",
          "isPregnant",
          "hasCareNeeds",
          "pensionEligible",
          "citizenBenefitLast3Years",
          "hasFinancialHardship",
          "receivesUnemploymentBenefit1",
          "receivesUnemploymentBenefit2",
          "receivesPension",
          "hasCareInsurance",
          "receivesChildBenefit",
          "receivesHousingBenefit",
          "receivesStudentAid",
        ],
      },
      {
        id: "personalDetails",
        title: "Persönliche Daten",
        fields: [
          "firstName",
          "lastName",
          "dateOfBirth",
          "gender",
          "maritalStatus",
          "nationality",
          "residenceStatus",
        ],
      },
      {
        id: "financialDetails",
        title: "Finanzielle Angaben",
        fields: [
          "grossMonthlyIncome",
          "netMonthlyIncome",
          "assets",
          "monthlyRent",
        ],
      },
      {
        id: "householdDetails",
        title: "Haushalt & Familie",
        fields: ["householdSize", "numberOfChildren", "childrenAges"],
      },
      {
        id: "workEducation",
        title: "Arbeit & Bildung",
        fields: ["employmentStatus", "educationLevel", "workAbility"],
      },
      {
        id: "additionalInfo",
        title: "Weitere Angaben",
        fields: ["disabilityDegree", "healthInsurance"],
      },
    ],
  };

  private sectionMap: Map<string, SectionDefinition>;

  constructor() {
    this.sectionMap = new Map(
      this.sectionStructure.sections.map((section) => [section.id, section])
    );
  }

  getSectionStructure(): SectionStructure {
    return this.sectionStructure;
  }

  getNextSection(
    consideredSections: string[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _formData: FormData,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _eligibilityResults: EligibilityResult[]
  ): string | null {
    for (const section of this.sectionStructure.sections) {
      if (!consideredSections.includes(section.id)) {
        return section.id;
      }
    }
    return null;
  }

  getSectionFields(sectionId: string): FormDataField[] {
    const section = this.sectionMap.get(sectionId);
    return section ? section.fields : [];
  }

  getSectionById(sectionId: string): SectionDefinition | undefined {
    return this.sectionMap.get(sectionId);
  }
}
