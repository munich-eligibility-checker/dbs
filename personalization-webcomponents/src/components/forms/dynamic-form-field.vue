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
        >{{ label }}</label
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
        >{{ label }}</label
      >
      <input
        :id="fieldName"
        :value="modelValue"
        type="number"
        :step="validation?.step ?? 'any'"
        :min="validation?.min"
        :max="validation?.max"
        :placeholder="placeholder"
        class="m-textfield"
        @input="onNumberInput($event)"
      />
      <prefilled-indicator v-if="isPrefilled" />
    </template>

    <!-- Date input -->
    <template v-else-if="fieldType === 'date'">
      <label
        :for="fieldName"
        class="m-label"
        >{{ label }}</label
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
        >{{ label }}</label
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
          <span>{{ label }}</span>
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
        @update:model-value="$emit('update:modelValue', $event)"
      />
      <prefilled-indicator v-if="isPrefilled" />
    </template>

    <!-- Number array (comma-separated) -->
    <template v-else-if="fieldType === 'numberArray'">
      <label
        :for="fieldName"
        class="m-label"
        >{{ label }}</label
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
  visible: boolean;
  isPrefilled?: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [
    value: string | number | boolean | number[] | undefined,
  ];
}>();

function onInput(event: Event) {
  const target = event.target as HTMLInputElement;
  const value = target.value;
  emit("update:modelValue", value || undefined);
}

function onNumberInput(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.value === '') {
    emit("update:modelValue", undefined);
    return;
  }
  let value = parseFloat(target.value);
  
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
  
  // Update the input field to show the corrected value
  target.value = String(value);
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
