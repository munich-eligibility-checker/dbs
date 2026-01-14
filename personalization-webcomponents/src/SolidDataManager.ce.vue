<template>
  <div>
    <!-- eslint-disable-next-line vue/no-v-html -->
    <div v-html="mucIconsSprite" />
    <!-- eslint-disable-next-line vue/no-v-html -->
    <div v-html="customIconsSprite" />

    <div class="m-component m-component-form">
      <div class="container">
        <muc-banner
          v-if="notification.message.value"
          :type="notification.messageType.value"
          class="message-banner"
        >
          {{ notification.message.value }}
        </muc-banner>
        <div class="progress-bar-sticky">
          <div class="progress-bar-track">
            <div
              class="progress-bar-fill"
              :class="{ 'progress-complete': eligibility.isFormComplete.value }"
              :style="{ width: eligibility.progressPercent.value + '%' }"
            />
          </div>
          <div
            class="progress-info"
            :class="{
              'progress-info-complete': eligibility.isFormComplete.value,
            }"
          >
            <template v-if="eligibility.isFormComplete.value">
              <span class="completion-icon">✓</span>
              Alle Angaben vollständig!
            </template>
            <template v-else>
              {{ eligibility.filledFieldsCount.value }} von
              {{ eligibility.allMissingFieldsSize.value }} Fragen beantwortet
            </template>
          </div>
        </div>

        <div class="two-column-layout">
          <!-- Left Column: Form -->
          <div class="left-column">
            <form class="form-content">
              <dynamic-form-section
                v-for="section in eligibility.visibleSections.value"
                :key="section.id"
                :section="section"
                :form-data="eligibility.formFields.value"
                :prefilled-fields="eligibility.prefilledFields.value"
                :should-show-field="eligibility.shouldShowField"
                @update:form-data="eligibility.updateFormData"
              />
            </form>
          </div>

          <!-- Right Column: Results -->
          <div class="right-column">
            <!-- Solid Pod Integration Hub -->
            <div
              class="eligibility-results solid-pod-section solid-pod-section-spacing"
            >
              <div class="eligibility-header solid-pod-header">
                <div>
                  <h2 class="eligibility-title solid-pod-title">Solid Pod</h2>
                </div>
              </div>

              <div v-if="!solidPod.isConnected.value">
                <div class="m-form-group solid-pod-form-group">
                  <label class="m-label">Provider URL</label>
                  <input
                    v-model="solidPod.solidIssuer.value"
                    type="text"
                    class="m-textfield full-width"
                    placeholder="https://solidcommunity.net"
                  />
                </div>
                <muc-button
                  :disabled="solidPod.loading.value"
                  icon="login"
                  class="full-width"
                  @click="handleConnect"
                >
                  Anmelden
                </muc-button>
                <p class="eligibility-subtitle solid-pod-description">
                  <strong>Was ist ein Solid Pod?</strong> Ihr Pod ist Ihr
                  persönlicher Datentresor. Anstatt dass Ihre Daten den
                  jeweiligen Apps gehören, speichern Sie diese in Ihrem eigenen
                  Pod. Sie entscheiden genau, was diese Website sehen oder tun
                  darf – und Sie können den Zugriff jederzeit widerrufen.
                </p>
              </div>

              <div
                v-else
                class="solid-connected-container"
              >
                <div class="solid-connection-info">
                  <div class="solid-webid">
                    <span class="solid-webid-label">Verbunden als:</span><br />
                    {{ solidPod.webId.value }}
                  </div>
                  <muc-button
                    variant="ghost"
                    :loading="solidPod.loading.value"
                    icon="logout"
                    size="small"
                    class="solid-logout-button"
                    @click="handleDisconnect"
                  >
                    Abmelden
                  </muc-button>
                </div>

                <div class="solid-actions">
                  <muc-button
                    variant="primary"
                    :loading="solidPod.loading.value"
                    icon="upload"
                    class="solid-save-button"
                    @click="handleSave"
                  >
                    Speichern
                  </muc-button>
                </div>
              </div>
            </div>

            <div
              v-if="
                eligibility.eligibilityResults.value.length > 0 ||
                eligibility.allEligibilityResults.value.length > 0
              "
              class="eligibility-results"
            >
              <div class="eligibility-header">
                <div>
                  <h2 class="eligibility-title">
                    Mögliche Leistungen ({{
                      eligibility.eligibilityResults.value.length
                    }})
                  </h2>
                  <p class="eligibility-subtitle">
                    Basierend auf Ihren Angaben könnten folgende Leistungen für
                    Sie in Frage kommen:
                  </p>
                </div>
                <muc-button
                  type="button"
                  variant="ghost"
                  class="toggle-all-button"
                  @click="showAllResults = !showAllResults"
                >
                  {{
                    showAllResults
                      ? "Nur berechtigte anzeigen"
                      : "Alle Leistungen anzeigen"
                  }}
                </muc-button>
              </div>

              <div
                v-for="result in displayedResults"
                :key="result.subsidyName"
                :class="[
                  'eligibility-card',
                  { 'not-eligible': result.eligible === false },
                  { pending: result.eligible === undefined },
                ]"
              >
                <div class="eligibility-card-header">
                  <h3 class="eligibility-card-title">
                    {{ result.subsidyName }}
                  </h3>
                  <span
                    :class="[
                      'eligibility-badge',
                      result.eligible === true
                        ? 'eligible'
                        : result.eligible === false
                          ? 'not-eligible'
                          : 'pending',
                    ]"
                  >
                    {{
                      result.eligible === true
                        ? "Berechtigt"
                        : result.eligible === false
                          ? "Nicht berechtigt"
                          : "Informationen ausstehend"
                    }}
                  </span>
                </div>
                <p
                  v-if="result.reason"
                  class="eligibility-card-reason"
                >
                  {{ result.reason }}
                </p>
                <div
                  v-if="result.url && result.eligible"
                  class="eligibility-card-actions"
                >
                  <a
                    :href="result.url"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <muc-button
                      icon="arrow-right"
                      icon-animated
                    >
                      Zum Antrag
                    </muc-button>
                  </a>
                </div>
              </div>
            </div>
            <div
              v-else-if="
                eligibility.formFields.value.firstName ||
                eligibility.formFields.value.lastName
              "
              class="no-results-placeholder"
            >
              <muc-callout type="info">
                <template #header> Keine Daten zur Prüfung vorhanden</template>
                <template #content>
                  <p>
                    Bitte füllen Sie das Formular aus und klicken Sie auf
                    "Speichern", um Ihre Berechtigung zu prüfen.
                  </p>
                </template>
              </muc-callout>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { EligibilityResult } from "@/types/EligibilityCheckInterface";

import { MucBanner, MucButton, MucCallout } from "@muenchen/muc-patternlab-vue";
import customIconsSprite from "@muenchen/muc-patternlab-vue/assets/icons/custom-icons.svg?raw";
import mucIconsSprite from "@muenchen/muc-patternlab-vue/assets/icons/muc-icons.svg?raw";
import { computed, onMounted, ref } from "vue";

import DynamicFormSection from "@/components/forms/dynamic-form-section.vue";
import { useEligibilityForm } from "@/composables/useEligibilityForm";
import { useNotification } from "@/composables/useNotification";
import { useSolidPod } from "@/composables/useSolidPod";

// Initialize composables
const notification = useNotification();
const solidPod = useSolidPod({
  onMessage: notification.showMessage,
});
const eligibility = useEligibilityForm();

const showAllResults = ref(false);

/**
 * Computed property for sorted/filtered eligibility results
 */
const displayedResults = computed<EligibilityResult[]>(() => {
  if (showAllResults.value) {
    return [...eligibility.allEligibilityResults.value].sort((a, b) => {
      const getOrder = (r: EligibilityResult) =>
        r.eligible === true ? 2 : r.eligible === false ? 1 : 0;
      return getOrder(b) - getOrder(a);
    });
  }
  return eligibility.eligibilityResults.value;
});

/**
 * Handle Solid Pod connection
 */
async function handleConnect() {
  await solidPod.connect();
}

/**
 * Handle Solid Pod disconnection
 */
async function handleDisconnect() {
  await solidPod.disconnect();
}

/**
 * Handle saving form data to Solid Pod
 */
async function handleSave() {
  await solidPod.saveData(eligibility.formFields.value);
}

onMounted(async () => {
  // Handle Solid redirect callback
  await solidPod.handleRedirect();

  // Load data from pod if connected
  if (solidPod.isConnected.value) {
    await solidPod.loadData();
  }

  // Initial eligibility check with pod data as prefill source
  eligibility.checkEligibility(solidPod.podData.value);

  // Set up automatic eligibility checking when form changes
  eligibility.setupAutoCheck(() => solidPod.podData.value);
});
</script>

<style>
@import url("https://assets.muenchen.de/mde/1.1.6/css/style.css");
@import "@muenchen/muc-patternlab-vue/assets/css/custom-style.css";
@import "@muenchen/muc-patternlab-vue/style.css";
@import "../public/checklist-styles.css";
@import "./styles/tooltip.css";

/* Form styles - unscoped so they apply to child components */
.m-form-group {
  margin-bottom: 24px;
  max-width: 100%;
  overflow: visible;
}

.m-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: var(--mde-color-neutral-grey-dark);
  font-size: 1rem;
}

.m-textfield {
  width: 100%;
  max-width: 100%;
  padding: 12px 16px;
  font-size: 1rem;
  border: 2px solid var(--mde-color-neutral-grey-light);
  border-radius: 4px;
  transition: border-color 0.3s ease;
  box-sizing: border-box;
  font-family: "Open Sans", sans-serif;
}

/* Date input specific styles to prevent overflow on mobile */
input[type="date"].m-textfield {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  min-width: 0;
  min-height: 48px;
  line-height: 1.5;
}

.m-textfield:focus {
  outline: none;
  border-color: var(--mde-color-brand-mde-blue);
}

.m-textfield:hover {
  border-color: var(--mde-color-brand-mde-blue-light);
}

.form-fieldset {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 20px;
  margin-bottom: 24px;
}

.form-fieldset legend {
  font-weight: 600;
  font-size: 1.1rem;
  padding: 0 8px;
  color: #333;
}

.m-form-group-checkbox {
  display: flex;
  align-items: center;
}

.m-checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

.m-checkbox {
  margin-right: 8px;
  cursor: pointer;
}
</style>

<style scoped>
/* Utility classes */
.full-width {
  width: 100%;
}

/* Solid Pod section styles */
.solid-pod-section-spacing {
  margin-bottom: 24px;
}

.solid-pod-header {
  margin-bottom: 8px;
}

.solid-pod-title {
  margin-bottom: 0;
}

.solid-pod-form-group {
  margin-bottom: 16px;
}

.solid-pod-description {
  margin-top: 16px;
}

.solid-connected-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.solid-connection-info {
  font-size: 0.85em;
  color: var(--mde-color-neutral-grey-dark);
  background: rgba(255, 255, 255, 0.5);
  padding: 8px;
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}

.solid-webid {
  word-break: break-all;
}

.solid-webid-label {
  font-weight: 600;
}

.solid-logout-button {
  flex-shrink: 0;
}

.solid-actions {
  display: flex;
  gap: 8px;
}

.solid-save-button {
  flex: 1;
}

/* Component layout */
.m-component-form {
  padding-top: 2rem;
}

.message-banner {
  margin-bottom: 32px;
}

.two-column-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 32px;
  align-items: start;
}

.left-column {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.progress-label {
  font-weight: 600;
  font-size: 1rem;
  color: var(--mde-color-neutral-grey-dark);
}

.progress-value {
  font-weight: 700;
  font-size: 1.25rem;
  color: var(--mde-color-brand-mde-blue);
}

.progress-bar-sticky {
  position: sticky;
  top: 0;
  background: white;
  padding: 16px 0;
  margin: 0 -24px;
  padding-left: 24px;
  padding-right: 24px;
}

.progress-bar-track {
  height: 12px;
  background: #efeef5;
  border-radius: 6px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: var(--mde-color-brand-mde-blue);
  border-radius: 6px;
  transition:
    width 0.4s ease-out,
    background-color 0.3s ease;
}

.progress-bar-fill.progress-complete {
  background: var(--mde-color-signal-success, #28a745);
}

.progress-info {
  margin-bottom: 8px;
  margin-top: 8px;
  font-size: 0.875rem;
  color: var(--mde-color-neutral-grey);
  text-align: center;
  transition: color 0.3s ease;
}

.progress-info-complete {
  color: var(--mde-color-signal-success, #28a745);
  font-weight: 600;
}

.completion-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: var(--mde-color-signal-success, #28a745);
  color: white;
  border-radius: 50%;
  font-size: 12px;
  margin-right: 8px;
  vertical-align: middle;
}

.right-column {
  position: sticky;
  top: 100px;
  max-height: calc(100vh - 124px);
  overflow-y: auto;
}

.form-content {
  background: white;
  padding: 0;
}

.button-group {
  display: flex;
  gap: 16px;
  margin-top: 32px;
  flex-wrap: wrap;
}

.data-display {
  padding: 24px;
  background: var(--mde-color-neutral-beau-blue-x-light);
  border-radius: 4px;
}

.data-display-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--mde-color-neutral-grey-dark);
  margin-bottom: 16px;
}

.data-display-content p {
  margin: 8px 0;
  color: var(--mde-color-neutral-grey-dark);
  font-size: 1rem;
  line-height: 1.5;
}

.eligibility-results {
  background: var(--mde-color-neutral-beau-blue-x-light);
  padding: 24px;
  border-radius: 4px;
}

.eligibility-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 24px;
}

.toggle-all-button {
  flex-shrink: 0;
  white-space: nowrap;
}

.eligibility-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--mde-color-neutral-grey-dark);
  margin-bottom: 16px;
  margin-top: 0;
}

.eligibility-subtitle {
  font-size: 1rem;
  color: var(--mde-color-neutral-grey);
  margin-bottom: 0;
  line-height: 1.5;
}

.eligibility-card {
  background: white;
  border: 2px solid var(--mde-color-neutral-beau-blue);
  border-radius: 4px;
  padding: 24px;
  margin-bottom: 16px;
  transition: all 0.3s ease;
}

.eligibility-card.not-eligible {
  border-color: #e0e0e0;
  opacity: 0.85;
}

.eligibility-card.pending {
  border-color: #e0e0e0;
  opacity: 0.9;
}

.eligibility-card:last-child {
  margin-bottom: 0;
}

.eligibility-card:hover {
  border-color: var(--mde-color-brand-mde-blue);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.eligibility-card.not-eligible:hover {
  border-color: #c0c0c0;
}

.eligibility-card.pending:hover {
  border-color: #c0c0c0;
}

.eligibility-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.eligibility-card-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--mde-color-brand-mde-blue-dark);
  margin: 0;
}

.eligibility-badge {
  display: inline-block;
  padding: 6px 16px;
  background-color: var(--mde-color-signal-success);
  color: white;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
}

.eligibility-badge.not-eligible {
  background-color: #b03a3e;
}

.eligibility-badge.pending {
  background-color: rgba(251, 192, 45, 0.85);
  color: #333;
}

.eligibility-card-reason {
  color: var(--mde-color-neutral-grey-dark);
  font-size: 1rem;
  line-height: 1.5;
  margin-bottom: 20px;
}

.eligibility-card-actions {
  margin-top: 16px;
}

.eligibility-card-actions a {
  text-decoration: none;
}

.no-results-placeholder {
  background: var(--mde-color-neutral-beau-blue-x-light);
  padding: 24px;
  border-radius: 4px;
}

/* Desktop: Two columns side by side */
@media (min-width: 992px) {
  .two-column-layout {
    grid-template-columns: 1fr 1fr;
    gap: 48px;
  }
}

/* Tablet and mobile: Stack vertically */
@media (max-width: 991px) {
  .right-column {
    position: static;
    max-height: none;
    overflow-y: visible;
  }
}

@media (max-width: 768px) {
  .button-group {
    flex-direction: column;
  }

  .button-group button {
    width: 100%;
  }

  .two-column-layout {
    gap: 32px;
  }

  .eligibility-header {
    flex-direction: column;
    align-items: stretch;
  }

  .toggle-all-button {
    align-self: flex-start;
  }

  .right-column {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .solid-pod-section {
    order: 2;
  }

  .eligibility-results:not(.solid-pod-section) {
    order: 1;
  }

  .progress-bar-sticky {
    padding: 8px 0;
    margin: 0 -16px;
    padding-left: 16px;
    padding-right: 16px;
  }

  .progress-info {
    margin-top: 4px;
    margin-bottom: 4px;
    font-size: 0.75rem;
  }

  .progress-bar-track {
    height: 8px;
  }
}
</style>
