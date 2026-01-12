<template>
  <div class="yes-no-input">
    <label v-if="label" class="m-label">{{ label }}<span v-if="explanation" class="explanation-tooltip" :data-tooltip="explanation">?</span></label>
    <div class="yes-no-options">
      <label class="yes-no-option">
        <input
          type="radio"
          :name="name"
          :value="true"
          :checked="modelValue === true"
          @change="$emit('update:modelValue', true)"
          class="yes-no-radio"
        />
        <span class="yes-no-label">Ja</span>
      </label>
      <label class="yes-no-option">
        <input
          type="radio"
          :name="name"
          :value="false"
          :checked="modelValue === false"
          @change="$emit('update:modelValue', false)"
          class="yes-no-radio"
        />
        <span class="yes-no-label">Nein</span>
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue?: boolean;
  label?: string;
  name: string;
  explanation?: string;
}>();

defineEmits<{
  'update:modelValue': [value: boolean | undefined];
}>();
</script>

<style scoped>
.yes-no-input {
  margin-bottom: 24px;
}

.m-label {
  display: block;
  margin-bottom: 12px;
  font-weight: 600;
  color: var(--mde-color-neutral-grey-dark);
  font-size: 1rem;
}

.yes-no-options {
  display: flex;
  gap: 24px;
  align-items: center;
}

.yes-no-option {
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
  padding: 12px 20px;
  border: 2px solid var(--mde-color-neutral-grey-light);
  border-radius: 4px;
  transition: all 0.3s ease;
  background: white;
  min-width: 100px;
  justify-content: center;
}

.yes-no-option:hover {
  border-color: var(--mde-color-brand-mde-blue-light);
  background: var(--mde-color-neutral-beau-blue-x-light);
}

.yes-no-option:has(input:checked) {
  border-color: var(--mde-color-brand-mde-blue);
  background: var(--mde-color-brand-mde-blue);
  color: white;
}

.yes-no-option:has(input:checked) .yes-no-label {
  color: white;
  font-weight: 600;
}

.yes-no-radio {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.yes-no-label {
  font-size: 1rem;
  font-weight: 500;
  color: var(--mde-color-neutral-grey-dark);
  transition: color 0.3s ease;
}

@media (max-width: 768px) {
  .yes-no-options {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .yes-no-option {
    width: 100%;
  }
}

.explanation-tooltip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  margin-left: 6px;
  font-size: 12px;
  font-weight: 700;
  color: var(--mde-color-brand-mde-blue);
  background: var(--mde-color-neutral-beau-blue-x-light);
  border: 1px solid var(--mde-color-brand-mde-blue);
  border-radius: 50%;
  cursor: help;
  vertical-align: middle;
  position: relative;
}

.explanation-tooltip:hover {
  background: var(--mde-color-brand-mde-blue);
  color: white;
}

.explanation-tooltip::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background: var(--mde-color-brand-mde-blue-dark, #1a365d);
  color: white;
  padding: 10px 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 400;
  line-height: 1.4;
  white-space: normal;
  width: max-content;
  max-width: 280px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s ease, visibility 0.2s ease;
  z-index: 1000;
  pointer-events: none;
}

.explanation-tooltip::before {
  content: '';
  position: absolute;
  bottom: calc(100% + 2px);
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-top-color: var(--mde-color-brand-mde-blue-dark, #1a365d);
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s ease, visibility 0.2s ease;
  z-index: 1001;
}

.explanation-tooltip:hover::after,
.explanation-tooltip:hover::before {
  opacity: 1;
  visibility: visible;
}
</style>

