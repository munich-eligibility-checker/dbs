import type {
  FormData,
  FormDataField,
} from "@/types/EligibilityCheckInterface";
import type {
  FieldMetadata,
  FieldOption,
  FieldValidation,
} from "@/types/FieldMetadata";

import { EligibilityConstants } from "./constants";

/**
 * Helper function to calculate age from date of birth
 */
function calculateAge(dateOfBirth: string | undefined): number {
  if (!dateOfBirth) return 0;
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
}

/**
 * Global registry mapping FormDataFields to their rendering metadata.
 * This consolidates field definitions from all form components.
 */
export const FIELD_METADATA: Record<FormDataField, FieldMetadata> = {
  // Personal Information
  firstName: {
    name: "firstName",
    label: "Vorname",
    type: "text",
    placeholder: "Vorname eingeben",
  },
  lastName: {
    name: "lastName",
    label: "Nachname",
    type: "text",
    placeholder: "Nachname eingeben",
  },
  dateOfBirth: {
    name: "dateOfBirth",
    label: "Geburtsdatum",
    type: "date",
  },
  gender: {
    name: "gender",
    label: "Geschlecht",
    type: "select",
    options: [
      { value: "male", label: "Männlich" },
      { value: "female", label: "Weiblich" },
      { value: "diverse", label: "Divers" },
      { value: "unspecified", label: "Keine Angabe" },
    ],
  },
  maritalStatus: {
    name: "maritalStatus",
    label: "Familienstand",
    type: "select",
    options: [
      { value: "single", label: "Ledig" },
      { value: "married", label: "Verheiratet" },
      { value: "divorced", label: "Geschieden" },
      { value: "widowed", label: "Verwitwet" },
      { value: "separated", label: "Getrennt" },
    ],
  },
  nationality: {
    name: "nationality",
    label: "Staatsangehörigkeit",
    type: "select",
    explanation:
      "Wenn sie neben deutscher Staatsangehörigkeit noch andere Staatsangehörigkeiten haben, wählen Sie Deutsch.",
    options: [
      { value: "German", label: "Deutsch" },
      { value: "EU", label: "Europäisch (EU)" },
      { value: "Non-EU", label: "Nicht-EU" },
    ],
  },
  residenceStatus: {
    name: "residenceStatus",
    label: "Aufenthaltsstatus",
    type: "select",
    options: [
      { value: "residence_permit", label: "Aufenthaltserlaubnis" },
      { value: "permanent_residence", label: "Niederlassungserlaubnis" },
      { value: "none", label: "Keine" },
    ],
    visibleWhen: (data: FormData) =>
      data.nationality === undefined
        ? undefined
        : data.nationality !== "German",
    defaultWhenHidden: "residence_permit",
  },
  residenceInGermany: {
    name: "residenceInGermany",
    label: "Gewöhnlicher Aufenthalt in Deutschland",
    type: "yesno",
    explanation:
      "Ihr gewöhnlicher Aufenthalt ist dort, wo Sie sich dauerhaft aufhalten und Ihren Lebensmittelpunkt haben.",
  },

  // Financial Information
  grossMonthlyIncome: {
    name: "grossMonthlyIncome",
    label: "Monatliches Bruttoeinkommen (€)",
    type: "number",
    placeholder: "z.B. 2000",
    validation: { min: 0 },
    explanation:
      "Das Bruttoeinkommen ist Ihr Gehalt vor Abzug von Steuern und Sozialabgaben.",
  },
  netMonthlyIncome: {
    name: "netMonthlyIncome",
    label: "Monatliches Nettoeinkommen (€)",
    type: "number",
    placeholder: "z.B. 1500",
    validation: { min: 0 },
    explanation:
      "Das Nettoeinkommen ist der Betrag, der nach Abzug aller Steuern und Sozialabgaben auf Ihrem Konto eingeht.",
  },
  assets: {
    name: "assets",
    label: "Vermögen (€)",
    type: "number",
    placeholder: "z.B. 5000",
    validation: { min: 0 },
    explanation:
      "Zum Vermögen zählen Bargeld, Sparguthaben, Wertpapiere, Immobilien und andere Sachwerte.",
  },
  monthlyRent: {
    name: "monthlyRent",
    label: "Monatliche Miete (€)",
    type: "number",
    placeholder: "z.B. 800",
    validation: { min: 0 },
  },

  // Household Information
  householdSize: {
    name: "householdSize",
    label: "Anzahl Personen im Haushalt",
    type: "number",
    placeholder: "z.B. 2",
    validation: { min: 1, step: 1 },
    explanation:
      "Alle Personen, die dauerhaft in Ihrer Wohnung leben und gemeinsam wirtschaften (inkl. Sie selbst).",
  },
  numberOfChildren: {
    name: "numberOfChildren",
    label: "Anzahl Kinder",
    type: "number",
    placeholder: "z.B. 1",
    validation: { min: 0, step: 1 },
    visibleWhen: (data: FormData) =>
      data.householdSize === undefined ? undefined : data.householdSize > 1,
    defaultWhenHidden: 0,
  },
  childrenAges: {
    name: "childrenAges",
    label: "Alter der Kinder (kommagetrennt)",
    type: "numberArray",
    placeholder: "z.B. 5, 8, 12",
    visibleWhen: (data: FormData) =>
      data.numberOfChildren === undefined ? undefined : data.numberOfChildren > 0,
    defaultWhenHidden: [],
  },
  livesWithParents: {
    name: "livesWithParents",
    label: "Wohnen Sie bei Ihren Eltern?",
    type: "yesno",
  },
  isSingleParent: {
    name: "isSingleParent",
    label: "Sind Sie Alleinerziehend?",
    type: "yesno",
    visibleWhen: (data: FormData) =>
      data.numberOfChildren === undefined
        ? undefined
        : data.numberOfChildren > 0,
    defaultWhenHidden: false,
  },

  // Education & Employment
  employmentStatus: {
    name: "employmentStatus",
    label: "Beschäftigungsstatus",
    type: "select",
    options: [
      { value: "employed", label: "Angestellt" },
      { value: "self_employed", label: "Selbstständig" },
      { value: "unemployed", label: "Arbeitslos" },
      { value: "student", label: "Student/in" },
      { value: "retired", label: "Rentner/in" },
      { value: "other", label: "Sonstiges" },
    ],
  },
  educationLevel: {
    name: "educationLevel",
    label: "Bildungsstand",
    type: "select",
    options: [
      { value: "no_degree", label: "Kein Abschluss" },
      { value: "lower_secondary", label: "Hauptschule" },
      { value: "secondary", label: "Realschule" },
      { value: "high_school", label: "Abitur" },
      { value: "vocational_training", label: "Ausbildung" },
      { value: "university", label: "Studium" },
    ],
  },
  isStudent: {
    name: "isStudent",
    label: "Ich bin Student/in",
    type: "yesno",
  },

  // Special Circumstances
  hasDisability: {
    name: "hasDisability",
    label: "Behinderung",
    type: "yesno",
  },
  disabilityDegree: {
    name: "disabilityDegree",
    label: "Grad der Behinderung (%)",
    type: "number",
    placeholder: "z.B. 50",
    validation: { min: 0, max: 100 },
    visibleWhen: (data: FormData) =>
      data.hasDisability === undefined ? undefined : data.hasDisability,
    defaultWhenHidden: 0,
  },
  isPregnant: {
    name: "isPregnant",
    label: "Schwanger",
    type: "yesno",
    visibleWhen: (data: FormData) =>
      data.gender === undefined
        ? undefined
        : data.gender === "female" || data.gender === "diverse",
    defaultWhenHidden: false,
  },
  hasCareNeeds: {
    name: "hasCareNeeds",
    label: "Pflegebedürftigkeit",
    type: "yesno",
  },
  pensionEligible: {
    name: "pensionEligible",
    label: "Rentenberechtigt (Rentenalter erreicht)",
    type: "yesno",
  },
  citizenBenefitLast3Years: {
    name: "citizenBenefitLast3Years",
    label: "Bürgergeld in den letzten 3 Jahren bezogen",
    type: "yesno",
  },
  hasFinancialHardship: {
    name: "hasFinancialHardship",
    label: "Finanzielle Notlage",
    type: "yesno",
    explanation:
      "Eine finanzielle Notlage bedeutet, dass jemand nicht genug Geld hat, um die grundlegenden Lebenshaltungskosten zu decken (Miete, Strom, Essen), oft aufgrund von Arbeitslosigkeit, geringem Einkommen, unerwarteten Ausgaben (Krankheit, Verlust) oder Schulden, was zu akuten Zahlungsschwierigkeiten und existenziellen Existenzängsten führt.",
  },
  workAbility: {
    name: "workAbility",
    label: "Arbeitsfähigkeit",
    type: "select",
    options: [
      { value: "full", label: "Voll arbeitsfähig" },
      { value: "limited", label: "Eingeschränkt arbeitsfähig" },
      { value: "none", label: "Nicht arbeitsfähig" },
    ],
    visibleWhen: (data: FormData) =>
      data.receivesPension === undefined || data.dateOfBirth === undefined
        ? undefined
        : data.receivesPension !== true &&
          calculateAge(data.dateOfBirth) < EligibilityConstants.PENSION_AGE,
    defaultWhenHidden: "none",
  },
  receivesUnemploymentBenefit1: {
    name: "receivesUnemploymentBenefit1",
    label: "Beziehe Arbeitslosengeld I",
    type: "yesno",
  },
  receivesUnemploymentBenefit2: {
    name: "receivesUnemploymentBenefit2",
    label: "Beziehe Bürgergeld (ALG II)",
    type: "yesno",
  },
  receivesPension: {
    name: "receivesPension",
    label: "Beziehe Rente",
    type: "yesno",
  },

  // Insurance & Benefits
  healthInsurance: {
    name: "healthInsurance",
    label: "Krankenversicherung",
    type: "select",
    options: [
      { value: "public", label: "Gesetzlich" },
      { value: "private", label: "Privat" },
      { value: "none", label: "Keine" },
    ],
  },
  hasCareInsurance: {
    name: "hasCareInsurance",
    label: "Habe Pflegeversicherung",
    type: "yesno",
  },
  receivesChildBenefit: {
    name: "receivesChildBenefit",
    label: "Beziehe Kindergeld",
    type: "yesno",
    visibleWhen: (data: FormData) =>
      data.numberOfChildren === undefined
        ? undefined
        : data.numberOfChildren > 0,
    defaultWhenHidden: false,
  },
  receivesHousingBenefit: {
    name: "receivesHousingBenefit",
    label: "Beziehe Wohngeld",
    type: "yesno",
  },
  receivesStudentAid: {
    name: "receivesStudentAid",
    label: "Beziehe BAföG",
    type: "yesno",
    defaultWhenHidden: false,
    visibleWhen: (data: FormData) =>
      data.isStudent === undefined ? undefined : data.isStudent === true,
  },
};

export function getFieldMetadata(field: FormDataField): FieldMetadata {
  return FIELD_METADATA[field];
}

export function getFieldPlaceholder(field: FormDataField): string | undefined {
  const metadata = FIELD_METADATA[field];
  if (
    metadata.type === "text" ||
    metadata.type === "number" ||
    metadata.type === "numberArray"
  ) {
    return metadata.placeholder;
  }
  return undefined;
}

export function getFieldOptions(
  field: FormDataField
): FieldOption[] | undefined {
  const metadata = FIELD_METADATA[field];
  if (metadata.type === "select") {
    return metadata.options;
  }
  return undefined;
}

export function getFieldValidation(
  field: FormDataField
): FieldValidation | undefined {
  const metadata = FIELD_METADATA[field];
  if (metadata.type === "number") {
    return metadata.validation;
  }
  return undefined;
}

/**
 * Apply default values for fields that are hidden due to visibleWhen conditions.
 * Returns a new FormData object with defaults applied for hidden fields.
 */
export function applyDefaultsForHiddenFields(formData: FormData): FormData {
  const result = { ...formData };

  for (const [fieldName, metadata] of Object.entries(FIELD_METADATA)) {
    const field = fieldName as FormDataField;
    // If field has a visibleWhen condition that returns false, and has a defaultWhenHidden
    if (
      metadata.visibleWhen &&
      metadata.visibleWhen(formData) === false &&
      metadata.defaultWhenHidden !== undefined
    ) {
      // Apply the default value
      (result as Record<string, unknown>)[field] = metadata.defaultWhenHidden;
    }
  }

  return result;
}
