<template>
  <fieldset class="form-fieldset">
    <legend>{{ section.title }}</legend>

    <dynamic-form-field
      v-for="fieldName in section.fields"
      :key="fieldName"
      :field-name="fieldName"
      :label="getFieldMetadata(fieldName).label"
      :field-type="getFieldMetadata(fieldName).type"
      :model-value="formData[fieldName]"
      :placeholder="getFieldMetadata(fieldName).placeholder"
      :options="getFieldMetadata(fieldName).options"
      :validation="getFieldMetadata(fieldName).validation"
      :explanation="getFieldMetadata(fieldName).explanation"
      :visible="shouldShowField(fieldName)"
      :is-prefilled="prefilledFields[fieldName] !== undefined"
      @update:model-value="updateField(fieldName, $event)"
    />
  </fieldset>
</template>

<script setup lang="ts">
import type {
  FormData,
  FormDataField,
} from "@/types/EligibilityCheckInterface";
import type { VisibleSection } from "@/types/FieldMetadata";
import type { PrefilledFields } from "@/eligibility/EligibilityCheckRegistry";

import DynamicFormField from "@/components/forms/dynamic-form-field.vue";
import { getFieldMetadata } from "@/eligibility/FieldMetadataRegistry";

const props = defineProps<{
  section: VisibleSection;
  formData: FormData;
  prefilledFields: PrefilledFields;
  shouldShowField: (field: FormDataField) => boolean;
}>();

const emit = defineEmits<{
  "update:formData": [value: FormData];
}>();

function updateField(
  fieldName: FormDataField,
  value: string | number | boolean | number[] | undefined
) {
  emit("update:formData", {
    ...props.formData,
    [fieldName]: value,
  });
}
</script>
