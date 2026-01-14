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
 * Base metadata interface shared by all field types
 */
interface BaseFieldMetadata {
  /** The field name matching FormDataField */
  name: FormDataField;
  /** Display label in German */
  label: string;
  /** Optional: Condition when this field should be visible based on other form data */
  visibleWhen?: (formData: FormData) => boolean | undefined;
  /** Optional: Default value to use when field is hidden due to visibleWhen returning false */
  defaultWhenHidden?: string | number | boolean | number[];
  /** Optional: Explanation text shown when hovering over the help icon */
  explanation?: string;
}

export interface TextFieldMetadata extends BaseFieldMetadata {
  type: "text";
  placeholder?: string;
}

export interface NumberFieldMetadata extends BaseFieldMetadata {
  type: "number";
  placeholder?: string;
  validation?: FieldValidation;
}

export interface DateFieldMetadata extends BaseFieldMetadata {
  type: "date";
}

export interface SelectFieldMetadata extends BaseFieldMetadata {
  type: "select";
  options: FieldOption[];
}

export interface CheckboxFieldMetadata extends BaseFieldMetadata {
  type: "checkbox";
}

export interface YesNoFieldMetadata extends BaseFieldMetadata {
  type: "yesno";
}

export interface NumberArrayFieldMetadata extends BaseFieldMetadata {
  type: "numberArray";
  placeholder?: string;
}

export type FieldMetadata =
  | TextFieldMetadata
  | NumberFieldMetadata
  | DateFieldMetadata
  | SelectFieldMetadata
  | CheckboxFieldMetadata
  | YesNoFieldMetadata
  | NumberArrayFieldMetadata;

export interface SectionDefinition {
  id: string;
  title: string;
  fields: FormDataField[];
}

export interface SectionStructure {
  /** Ordered list of section definitions */
  sections: SectionDefinition[];
}

export interface VisibleSection {
  id: string;
  title: string;
  fields: FormDataField[];
}

export type FormFieldValue = string | number | boolean | number[] | undefined;
