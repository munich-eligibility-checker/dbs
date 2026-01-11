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
        step="0.01"
        :min="validation?.min"
        :max="validation?.max"
        :placeholder="placeholder"
        class="m-textfield"
        @input="onNumberInput($event)"
      />
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
    </template>

    <!-- Yes/No input -->
    <template v-else-if="fieldType === 'yesno'">
      <yes-no-input
        :model-value="modelValue as boolean | undefined"
        :label="label"
        :name="fieldName"
        @update:model-value="$emit('update:modelValue', $event)"
      />
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
        :value="formatNumberArray(modelValue as number[] | undefined)"
        type="text"
        :placeholder="placeholder"
        class="m-textfield"
        @input="onNumberArrayInput($event)"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import type { FieldOption, FieldValidation } from "@/types/FieldMetadata";

import YesNoInput from "@/components/YesNoInput.vue";

const props = defineProps<{
  fieldName: string;
  label: string;
  fieldType: string;
  modelValue?: string | number | boolean | number[] | undefined;
  placeholder?: string;
  options?: FieldOption[];
  validation?: FieldValidation;
  visible: boolean;
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
  const value = target.value ? parseFloat(target.value) : undefined;
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

function formatNumberArray(value: number[] | undefined): string {
  if (!value || value.length === 0) return "";
  return value.join(", ");
}

function onNumberArrayInput(event: Event) {
  const target = event.target as HTMLInputElement;
  const value = target.value;
  if (!value || value.trim() === "") {
    emit("update:modelValue", undefined);
    return;
  }
  const numbers = value
    .split(",")
    .map((s) => parseInt(s.trim()))
    .filter((n) => !isNaN(n));
  emit("update:modelValue", numbers.length > 0 ? numbers : undefined);
}
</script>
