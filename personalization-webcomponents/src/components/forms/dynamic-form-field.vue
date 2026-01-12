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
        >{{ label }}<span v-if="explanation" class="explanation-tooltip" :data-tooltip="explanation">?</span></label
      >
      <input
        :id="fieldName"
        :value="modelValue"
        type="text"
        :placeholder="placeholder"
        class="m-textfield"
        @input="onInput($event)"
      />
      <prefilled-indicator v-if="isPrefilled" />
    </template>

    <!-- Number input -->
    <template v-else-if="fieldType === 'number'">
      <label
        :for="fieldName"
        class="m-label"
        >{{ label }}<span v-if="explanation" class="explanation-tooltip" :data-tooltip="explanation">?</span></label
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
        class="m-textfield"
        @input="onNumberInput($event)"
      />
      <input
        v-else
        :id="fieldName"
        :value="displayValue"
        type="text"
        inputmode="decimal"
        :placeholder="placeholder"
        class="m-textfield"
        @input="onDecimalInput($event)"
        @blur="onDecimalBlur($event)"
      />
      <prefilled-indicator v-if="isPrefilled" />
    </template>

    <!-- Date input -->
    <template v-else-if="fieldType === 'date'">
      <label
        :for="fieldName"
        class="m-label"
        >{{ label }}<span v-if="explanation" class="explanation-tooltip" :data-tooltip="explanation">?</span></label
      >
      <input
        :id="fieldName"
        :value="modelValue"
        type="date"
        class="m-textfield"
        @input="onInput($event)"
      />
      <prefilled-indicator v-if="isPrefilled" />
    </template>

    <!-- Select dropdown -->
    <template v-else-if="fieldType === 'select'">
      <label
        :for="fieldName"
        class="m-label"
        >{{ label }}<span v-if="explanation" class="explanation-tooltip" :data-tooltip="explanation">?</span></label
      >
      <select
        :id="fieldName"
        :value="modelValue"
        class="m-textfield"
        @change="onSelectChange($event)"
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
            @change="onCheckboxChange($event)"
          />
          <span>{{ label }}<span v-if="explanation" class="explanation-tooltip" :data-tooltip="explanation">?</span></span>
        </label>
      </div>
      <prefilled-indicator v-if="isPrefilled" />
    </template>

    <!-- Yes/No input -->
    <template v-else-if="fieldType === 'yesno'">
      <yes-no-input
        :model-value="modelValue as boolean | undefined"
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
        >{{ label }}<span v-if="explanation" class="explanation-tooltip" :data-tooltip="explanation">?</span></label
      >
      <input
        :id="fieldName"
        v-model="numberArrayText"
        type="text"
        :placeholder="placeholder"
        class="m-textfield"
        @blur="onNumberArrayBlur"
      />
      <prefilled-indicator v-if="isPrefilled" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import type { FieldOption, FieldValidation } from "@/types/FieldMetadata";

import YesNoInput from "@/components/YesNoInput.vue";
import PrefilledIndicator from "./PrefilledIndicator.vue";

const props = defineProps<{
  fieldName: string;
  label: string;
  fieldType: string;
  modelValue?: string | number | boolean | number[] | undefined;
  placeholder?: string;
  options?: FieldOption[];
  validation?: FieldValidation;
  explanation?: string;
  visible: boolean;
  isPrefilled?: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [
    value: string | number | boolean | number[] | undefined,
  ];
}>();

// Display value for decimal text inputs - stores the raw text while user is typing
const displayValue = ref<string>("");

// Sync displayValue with modelValue when it changes externally
watch(() => props.modelValue, (newVal) => {
  if (typeof newVal === 'number') {
    // Format with German comma as decimal separator (no thousands separator)
    displayValue.value = String(newVal).replace('.', ',');
  } else if (newVal === undefined) {
    displayValue.value = "";
  }
}, { immediate: true });

function onInput(event: Event) {
  const target = event.target as HTMLInputElement;
  const value = target.value;
  emit("update:modelValue", value || undefined);
}

// For decimal text inputs - update display and emit parsed value
function onDecimalInput(event: Event) {
  const target = event.target as HTMLInputElement;
  displayValue.value = target.value;
  
  // Also emit the parsed value so the form knows it's filled
  if (target.value === '') {
    emit("update:modelValue", undefined);
    return;
  }
  // German format: remove thousands dots, replace decimal comma with dot
  const normalizedValue = target.value.replace(/\./g, '').replace(',', '.');
  const value = parseFloat(normalizedValue);
  if (!isNaN(value)) {
    emit("update:modelValue", value);
  }
}

// On blur, parse and emit the value
function onDecimalBlur(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.value === '') {
    emit("update:modelValue", undefined);
    return;
  }
  // German format: remove thousands dots, replace decimal comma with dot
  const normalizedValue = target.value.replace(/\./g, '').replace(',', '.');
  let value = parseFloat(normalizedValue);
  
  // If parsing failed, emit undefined
  if (isNaN(value)) {
    emit("update:modelValue", undefined);
    return;
  }
  
  // Enforce min value
  if (props.validation?.min !== undefined && value < props.validation.min) {
    value = props.validation.min;
  }
  
  // Enforce max value
  if (props.validation?.max !== undefined && value > props.validation.max) {
    value = props.validation.max;
  }
  
  // Keep display with German comma format (no thousands separator)
  displayValue.value = String(value).replace('.', ',');
  emit("update:modelValue", value);
}

function onNumberInput(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.value === '') {
    emit("update:modelValue", undefined);
    return;
  }
  // Replace comma with dot for German decimal notation
  const normalizedValue = target.value.replace(',', '.');
  let value = parseFloat(normalizedValue);
  
  // If parsing failed, emit undefined
  if (isNaN(value)) {
    emit("update:modelValue", undefined);
    return;
  }
  
  const originalValue = value;
  
  // If step is 1 (integer field), round to nearest integer
  if (props.validation?.step === 1) {
    value = Math.round(value);
  }
  
  // Enforce min value
  if (props.validation?.min !== undefined && value < props.validation.min) {
    value = props.validation.min;
  }
  
  // Enforce max value
  if (props.validation?.max !== undefined && value > props.validation.max) {
    value = props.validation.max;
  }
  
  // Only update the input field if value was corrected
  if (value !== originalValue) {
    target.value = String(value);
  }
  emit("update:modelValue", value);
}

function onSelectChange(event: Event) {
  const target = event.target as HTMLSelectElement;
  const value = target.value;
  // Handle undefined option value
  if (value === "" || value === "undefined") {
    emit("update:modelValue", undefined);
  } else {
    emit("update:modelValue", value);
  }
}

function onCheckboxChange(event: Event) {
  const target = event.target as HTMLInputElement;
  emit("update:modelValue", target.checked);
}

// Local state for numberArray text input to allow free typing
const numberArrayText = ref(formatNumberArray(props.modelValue as number[] | undefined));

// Sync local text when modelValue changes externally
watch(
  () => props.modelValue,
  (newValue) => {
    if (props.fieldType === "numberArray") {
      const formatted = formatNumberArray(newValue as number[] | undefined);
      // Only update if the parsed values are different (avoid overwriting while typing)
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
  const parsed = parseNumberArray(numberArrayText.value);
  emit("update:modelValue", parsed);
  // Format the text nicely after blur
  numberArrayText.value = formatNumberArray(parsed);
}
</script>
