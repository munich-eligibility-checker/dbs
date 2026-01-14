<template>
  <div
    v-if="visible"
    :class="fieldType === 'yesno' ? '' : 'm-form-group'"
  >
    <!-- Text input -->
    <template v-if="fieldType === 'text'">
      <label
        :for="fieldName"
        class="m-label"
        >{{ label
        }}<span
          v-if="explanation"
          class="explanation-tooltip"
          :data-tooltip="explanation"
          >?</span
        ></label
      >
      <input
        :id="fieldName"
        :value="modelValue"
        type="text"
        :placeholder="placeholder"
        :class="['m-textfield', { 'field-required': isTouched && !modelValue }]"
        @blur="onBlur"
        @input="onTextInput"
      />
      <prefilled-indicator v-if="isPrefilled" />
    </template>

    <!-- Number input -->
    <template v-else-if="fieldType === 'number'">
      <label
        :for="fieldName"
        class="m-label"
        >{{ label
        }}<span
          v-if="explanation"
          class="explanation-tooltip"
          :data-tooltip="explanation"
          >?</span
        ></label
      >
      <!-- Use type="text" for decimal fields to allow comma input, type="number" for integers -->
      <input
        v-if="validation?.step === 1"
        :id="fieldName"
        :value="modelValue"
        type="number"
        step="1"
        :min="validation?.min"
        :max="validation?.max"
        :placeholder="placeholder"
        :class="[
          'm-textfield',
          { 'field-required': isTouched && modelValue === undefined },
        ]"
        @blur="onBlur"
        @input="onIntegerInput"
      />
      <input
        v-else
        :id="fieldName"
        :value="displayValue"
        type="text"
        inputmode="decimal"
        :placeholder="placeholder"
        :class="[
          'm-textfield',
          { 'field-required': isTouched && modelValue === undefined },
        ]"
        @input="onDecimalInput"
        @blur="onDecimalBlur"
      />
      <prefilled-indicator v-if="isPrefilled" />
    </template>

    <!-- Date input -->
    <template v-else-if="fieldType === 'date'">
      <label
        :for="fieldName"
        class="m-label"
        >{{ label
        }}<span
          v-if="explanation"
          class="explanation-tooltip"
          :data-tooltip="explanation"
          >?</span
        ></label
      >
      <input
        :id="fieldName"
        :value="modelValue"
        type="date"
        class="m-textfield date-input"
        :class="{ 'field-required': isTouched && !modelValue }"
        @blur="onBlur"
        @input="onTextInput"
      />
      <prefilled-indicator v-if="isPrefilled" />
    </template>

    <!-- Select dropdown -->
    <template v-else-if="fieldType === 'select'">
      <label
        :for="fieldName"
        class="m-label"
        >{{ label
        }}<span
          v-if="explanation"
          class="explanation-tooltip"
          :data-tooltip="explanation"
          >?</span
        ></label
      >
      <select
        :id="fieldName"
        :value="modelValue"
        :class="['m-textfield', { 'field-required': isTouched && !modelValue }]"
        @blur="onBlur"
        @change="onSelectChange"
      >
        <option
          v-for="option in options"
          :key="String(option.value)"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>
      <prefilled-indicator v-if="isPrefilled" />
    </template>

    <!-- Checkbox -->
    <template v-else-if="fieldType === 'checkbox'">
      <div class="m-form-group-checkbox">
        <label class="m-checkbox-label">
          <input
            :id="fieldName"
            :checked="modelValue === true"
            type="checkbox"
            class="m-checkbox"
            @change="onCheckboxChange"
          />
          <span
            >{{ label
            }}<span
              v-if="explanation"
              class="explanation-tooltip"
              :data-tooltip="explanation"
              >?</span
            ></span
          >
        </label>
      </div>
      <prefilled-indicator v-if="isPrefilled" />
    </template>

    <!-- Yes/No input -->
    <template v-else-if="fieldType === 'yesno'">
      <yes-no-input
        :model-value="modelValue === undefined ? undefined : !!modelValue"
        :label="label"
        :name="fieldName"
        :explanation="explanation"
        @update:model-value="$emit('update:modelValue', $event)"
      />
      <prefilled-indicator v-if="isPrefilled" />
    </template>

    <!-- Number array (comma-separated) -->
    <template v-else-if="fieldType === 'numberArray'">
      <label
        :for="fieldName"
        class="m-label"
        >{{ label
        }}<span
          v-if="explanation"
          class="explanation-tooltip"
          :data-tooltip="explanation"
          >?</span
        ></label
      >
      <input
        :id="fieldName"
        v-model="numberArrayText"
        type="text"
        :placeholder="placeholder"
        :class="[
          'm-textfield',
          {
            'field-required':
              isTouched &&
              (!modelValue ||
                (Array.isArray(modelValue) && modelValue.length === 0)),
          },
        ]"
        @blur="onNumberArrayBlur"
      />
      <prefilled-indicator v-if="isPrefilled" />
    </template>
  </div>
</template>

<script setup lang="ts">
import type {
  FieldOption,
  FieldType,
  FieldValidation,
  FormFieldValue,
} from "@/types/FieldMetadata";

import { ref, watch } from "vue";

import YesNoInput from "@/components/YesNoInput.vue";
import PrefilledIndicator from "./PrefilledIndicator.vue";

const props = defineProps<{
  fieldName: string;
  label: string;
  fieldType: FieldType;
  modelValue?: FormFieldValue;
  placeholder?: string;
  options?: FieldOption[];
  validation?: FieldValidation;
  explanation?: string;
  visible: boolean;
  isPrefilled?: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: FormFieldValue];
}>();

// Track if the field has been focused/touched at least once
const isTouched = ref(false);

// Display value for decimal text inputs - stores the raw text while user is typing
const displayValue = ref("");

// Sync displayValue with modelValue when it changes externally
watch(
  () => props.modelValue,
  (newVal) => {
    if (typeof newVal === "number") {
      // Format with German comma as decimal separator (no thousands separator)
      displayValue.value = String(newVal).replace(".", ",");
    } else if (newVal === undefined) {
      displayValue.value = "";
    }
  },
  { immediate: true }
);

function onBlur(): void {
  isTouched.value = true;
}

function onTextInput(event: Event): void {
  const target = event.target as HTMLInputElement;
  emit("update:modelValue", target.value || undefined);
}


function onDecimalInput(event: Event): void {
  const target = event.target as HTMLInputElement;
  displayValue.value = target.value;

  if (target.value === "") {
    emit("update:modelValue", undefined);
    return;
  }
  // German format: remove thousands dots, replace decimal comma with dot
  const normalizedValue = target.value.replace(/\./g, "").replace(",", ".");
  const value = parseFloat(normalizedValue);
  if (!isNaN(value)) {
    emit("update:modelValue", value);
  }
}

function onDecimalBlur(event: Event): void {
  onBlur();
  const target = event.target as HTMLInputElement;
  if (target.value === "") {
    emit("update:modelValue", undefined);
    return;
  }
  // German format: remove thousands dots, replace decimal comma with dot
  const normalizedValue = target.value.replace(/\./g, "").replace(",", ".");
  let value = parseFloat(normalizedValue);

  if (isNaN(value)) {
    emit("update:modelValue", undefined);
    return;
  }

  // Enforce min/max values
  if (props.validation?.min !== undefined && value < props.validation.min) {
    value = props.validation.min;
  }
  if (props.validation?.max !== undefined && value > props.validation.max) {
    value = props.validation.max;
  }

  // Keep display with German comma format
  displayValue.value = String(value).replace(".", ",");
  emit("update:modelValue", value);
}

function onIntegerInput(event: Event): void {
  const target = event.target as HTMLInputElement;
  if (target.value === "") {
    emit("update:modelValue", undefined);
    return;
  }

  const normalizedValue = target.value.replace(",", ".");
  let value = parseFloat(normalizedValue);

  if (isNaN(value)) {
    emit("update:modelValue", undefined);
    return;
  }

  const originalValue = value;

  // Round to integer if step is 1
  if (props.validation?.step === 1) {
    value = Math.round(value);
  }

  // Enforce min/max values
  if (props.validation?.min !== undefined && value < props.validation.min) {
    value = props.validation.min;
  }
  if (props.validation?.max !== undefined && value > props.validation.max) {
    value = props.validation.max;
  }

  // Update input field if value was corrected
  if (value !== originalValue) {
    target.value = String(value);
  }
  emit("update:modelValue", value);
}

function onSelectChange(event: Event): void {
  const target = event.target as HTMLSelectElement;
  emit("update:modelValue", target.value);
}

function onCheckboxChange(event: Event) {
  const target = event.target as HTMLInputElement;
  emit("update:modelValue", target.checked);
}

// Local state for numberArray text input to allow free typing
const numberArrayText = ref(
  props.fieldType === "numberArray"
    ? formatNumberArray(props.modelValue as number[] | undefined)
    : ""
);

// Sync local text when modelValue changes externally
watch(
  () => props.modelValue,
  (newValue) => {
    if (props.fieldType === "numberArray") {
      const formatted = formatNumberArray(newValue as number[] | undefined);
      const currentParsed = parseNumberArray(numberArrayText.value);
      const newParsed = newValue as number[] | undefined;
      if (JSON.stringify(currentParsed) !== JSON.stringify(newParsed)) {
        numberArrayText.value = formatted;
      }
    }
  }
);

function formatNumberArray(value: number[] | undefined): string {
  if (!value || value.length === 0) return "";
  return value.join(", ");
}

function parseNumberArray(value: string): number[] | undefined {
  if (!value || value.trim() === "") {
    return undefined;
  }
  const numbers = value
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n));
  return numbers.length > 0 ? numbers : undefined;
}

function onNumberArrayBlur() {
  onBlur();
  const parsed = parseNumberArray(numberArrayText.value);
  emit("update:modelValue", parsed);
  numberArrayText.value = formatNumberArray(parsed);
}
</script>

<style scoped>
.field-required {
  border: 2px solid rgb(187, 67, 67) !important;
  border-radius: 3px;
}

.date-input {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}
</style>
