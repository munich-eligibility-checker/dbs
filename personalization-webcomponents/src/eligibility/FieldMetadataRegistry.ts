import type { FormDataField } from "@/types/EligibilityCheckInterface";
import type { FieldMetadata } from "@/types/FieldMetadata";

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
      { value: undefined, label: "Bitte wählen" },
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
      { value: undefined, label: "Bitte wählen" },
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
    options: [
      { value: undefined, label: "Bitte wählen" },
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
      { value: undefined, label: "Bitte wählen" },
      { value: "residence_permit", label: "Aufenthaltserlaubnis" },
      { value: "permanent_residence", label: "Niederlassungserlaubnis" },
      { value: "none", label: "Keine" },
    ],
  },
  residenceInGermany: {
    name: "residenceInGermany",
    label: "Gewöhnlicher Aufenthalt in Deutschland",
    type: "yesno",
  },

  // Financial Information
  grossMonthlyIncome: {
    name: "grossMonthlyIncome",
    label: "Monatliches Bruttoeinkommen (€)",
    type: "number",
    placeholder: "z.B. 2000",
    validation: { min: 0 },
  },
  netMonthlyIncome: {
    name: "netMonthlyIncome",
    label: "Monatliches Nettoeinkommen (€)",
    type: "number",
    placeholder: "z.B. 1500",
    validation: { min: 0 },
  },
  assets: {
    name: "assets",
    label: "Vermögen (€)",
    type: "number",
    placeholder: "z.B. 5000",
    validation: { min: 0 },
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
    validation: { min: 1 },
  },
  numberOfChildren: {
    name: "numberOfChildren",
    label: "Anzahl Kinder",
    type: "number",
    placeholder: "z.B. 1",
    validation: { min: 0 },
  },
  childrenAges: {
    name: "childrenAges",
    label: "Alter der Kinder (kommagetrennt)",
    type: "numberArray",
    placeholder: "z.B. 5, 8, 12",
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
  },

  // Education & Employment
  employmentStatus: {
    name: "employmentStatus",
    label: "Beschäftigungsstatus",
    type: "select",
    options: [
      { value: undefined, label: "Bitte wählen" },
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
      { value: undefined, label: "Bitte wählen" },
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
  },
  isPregnant: {
    name: "isPregnant",
    label: "Schwanger",
    type: "yesno",
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
  },
  workAbility: {
    name: "workAbility",
    label: "Arbeitsfähigkeit",
    type: "select",
    options: [
      { value: undefined, label: "Bitte wählen" },
      { value: "full", label: "Voll arbeitsfähig" },
      { value: "limited", label: "Eingeschränkt arbeitsfähig" },
      { value: "none", label: "Nicht arbeitsfähig" },
    ],
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
      { value: undefined, label: "Bitte wählen" },
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
  },
};

/**
 * Get field metadata for a specific field
 */
export function getFieldMetadata(field: FormDataField): FieldMetadata {
  return FIELD_METADATA[field];
}
