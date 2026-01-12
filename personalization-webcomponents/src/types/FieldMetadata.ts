import type { FormData, FormDataField } from "./EligibilityCheckInterface";

/**
 * Supported form field types for dynamic rendering
 */
export type FieldType =
  | "text"
  | "number"
  | "date"
  | "select"
  | "checkbox"
  | "yesno"
  | "numberArray";

/**
 * Option for select/radio field types
 */
export interface FieldOption {
  value: string | number | boolean | undefined;
  label: string;
}

/**
 * Validation rules for form fields
 */
export interface FieldValidation {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: string;
  step?: number;
}

/**
 * Metadata defining how a form field should be rendered
 */
export interface FieldMetadata {
  /** The field name matching FormDataField */
  name: FormDataField;
  /** Display label in German */
  label: string;
  /** Type of input to render */
  type: FieldType;
  /** Placeholder text for text inputs */
  placeholder?: string;
  /** Options for select/radio fields */
  options?: FieldOption[];
  /** Validation rules */
  validation?: FieldValidation;
  /** Optional: Condition when this field should be visible based on other form data */
  visibleWhen?: (formData: FormData) => boolean|undefined;
  /** Optional: Default value to use when field is hidden due to visibleWhen returning false */
  defaultWhenHidden?: string | number | boolean | number[];
  /** Optional: Explanation text shown when hovering over the help icon */
  explanation?: string;
}

/**
 * Section definition with ID, title, and fields
 */
export interface SectionDefinition {
  /** Unique section identifier */
  id: string;
  /** Display title in German */
  title: string;
  /** List of field names in this section */
  fields: FormDataField[];
}

/**
 * Complete section structure defined by a strategy
 */
export interface SectionStructure {
  /** Ordered list of section definitions */
  sections: SectionDefinition[];
}

/**
 * Section with metadata for frontend rendering
 * (includes title, not just ID)
 */
export interface VisibleSection {
  id: string;
  title: string;
  fields: FormDataField[];
}
