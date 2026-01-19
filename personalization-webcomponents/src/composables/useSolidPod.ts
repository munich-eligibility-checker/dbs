import type { FormData } from "@/types/EligibilityCheckInterface";

import { getFile, overwriteFile } from "@inrupt/solid-client";
import { getDefaultSession, handleIncomingRedirect, login, logout, fetch as solidFetch } from "@inrupt/solid-client-authn-browser";
import { ref } from "vue";

import { createErrorMessage, SolidErrorMessages } from "@/util/errorFormatter";

const SOLID_DATA_FILE = "private/personalization/eligibility-data.jsonld";

const DEFAULT_ISSUER = "https://m-pod.lcarilla.de";

/**
 * JSON-LD context for eligibility form data
 * Uses Schema.org where applicable
 */
const JSON_LD_CONTEXT = {
  "@vocab": "https://schema.org/",

  // Schema.org mappings
  "givenName": "https://schema.org/givenName",
  "familyName": "https://schema.org/familyName",
  "birthDate": "https://schema.org/birthDate",
  "gender": "https://schema.org/gender",
  "nationality": "https://schema.org/nationality",
  "numberOfChildren": "https://schema.org/numberOfChildren",

  // TODO: Define vocabulary and add mappings for:
  // - Financial: grossMonthlyIncome, netMonthlyIncome, assets, monthlyRent
  // - Residence: residenceStatus, residenceInGermany
  // - Household: householdSize, childrenAges, livesWithParents
  // - Employment: employmentStatus, educationLevel, isStudent, workAbility
  // - Disability: hasDisability, disabilityDegree, hasCareNeeds
  // - Benefits: receivesUnemploymentBenefit1, receivesUnemploymentBenefit2, receivesPension,
  //            pensionEligible, citizenBenefitLast3Years, receivesChildBenefit,
  //            receivesHousingBenefit, receivesStudentAid, hasFinancialHardship
  // - Insurance: healthInsurance, hasCareInsurance
  // - Special: isPregnant, isSingleParent, maritalStatus
};

/**
 * Converts FormData to JSON-LD format
 */
function formDataToJsonLd(formData: FormData): object {
  return {
    "@context": JSON_LD_CONTEXT,
    "@type": "Person",

    // Schema.org fields (direct mapping)
    ...(formData.firstName && { givenName: formData.firstName }),
    ...(formData.lastName && { familyName: formData.lastName }),
    ...(formData.dateOfBirth && { birthDate: formData.dateOfBirth }),
    ...(formData.gender && { gender: mapGenderToSchemaOrg(formData.gender) }),
    ...(formData.nationality && { nationality: formData.nationality }),
    ...(formData.numberOfChildren !== undefined && { numberOfChildren: formData.numberOfChildren }),

    // TODO: Fields without vocabulary mapping (stored as-is until vocabulary is defined)
    ...(formData.grossMonthlyIncome !== undefined && { grossMonthlyIncome: formData.grossMonthlyIncome }),
    ...(formData.netMonthlyIncome !== undefined && { netMonthlyIncome: formData.netMonthlyIncome }),
    ...(formData.assets !== undefined && { assets: formData.assets }),
    ...(formData.monthlyRent !== undefined && { monthlyRent: formData.monthlyRent }),
    ...(formData.householdSize !== undefined && { householdSize: formData.householdSize }),
    ...(formData.childrenAges && { childrenAges: formData.childrenAges }),
    ...(formData.livesWithParents !== undefined && { livesWithParents: formData.livesWithParents }),
    ...(formData.residenceStatus && { residenceStatus: formData.residenceStatus }),
    ...(formData.residenceInGermany !== undefined && { residenceInGermany: formData.residenceInGermany }),
    ...(formData.employmentStatus && { employmentStatus: formData.employmentStatus }),
    ...(formData.educationLevel && { educationLevel: formData.educationLevel }),
    ...(formData.isStudent !== undefined && { isStudent: formData.isStudent }),
    ...(formData.workAbility && { workAbility: formData.workAbility }),
    ...(formData.hasDisability !== undefined && { hasDisability: formData.hasDisability }),
    ...(formData.disabilityDegree !== undefined && { disabilityDegree: formData.disabilityDegree }),
    ...(formData.hasCareNeeds !== undefined && { hasCareNeeds: formData.hasCareNeeds }),
    ...(formData.maritalStatus && { maritalStatus: formData.maritalStatus }),
    ...(formData.isPregnant !== undefined && { isPregnant: formData.isPregnant }),
    ...(formData.isSingleParent !== undefined && { isSingleParent: formData.isSingleParent }),
    ...(formData.healthInsurance && { healthInsurance: formData.healthInsurance }),
    ...(formData.hasCareInsurance !== undefined && { hasCareInsurance: formData.hasCareInsurance }),
    ...(formData.receivesUnemploymentBenefit1 !== undefined && { receivesUnemploymentBenefit1: formData.receivesUnemploymentBenefit1 }),
    ...(formData.receivesUnemploymentBenefit2 !== undefined && { receivesUnemploymentBenefit2: formData.receivesUnemploymentBenefit2 }),
    ...(formData.receivesPension !== undefined && { receivesPension: formData.receivesPension }),
    ...(formData.pensionEligible !== undefined && { pensionEligible: formData.pensionEligible }),
    ...(formData.citizenBenefitLast3Years !== undefined && { citizenBenefitLast3Years: formData.citizenBenefitLast3Years }),
    ...(formData.receivesChildBenefit !== undefined && { receivesChildBenefit: formData.receivesChildBenefit }),
    ...(formData.receivesHousingBenefit !== undefined && { receivesHousingBenefit: formData.receivesHousingBenefit }),
    ...(formData.receivesStudentAid !== undefined && { receivesStudentAid: formData.receivesStudentAid }),
    ...(formData.hasFinancialHardship !== undefined && { hasFinancialHardship: formData.hasFinancialHardship }),
  };
}

/**
 * Maps internal gender values to Schema.org GenderType
 * @see https://schema.org/GenderType
 */
function mapGenderToSchemaOrg(gender: string): string {
  const genderMap: Record<string, string> = {
    "male": "https://schema.org/Male",
    "female": "https://schema.org/Female",
    "diverse": "https://schema.org/GenderType", // No direct equivalent, using base type
    "unspecified": "https://schema.org/GenderType"
  };
  return genderMap[gender] || gender;
}

/**
 * Converts JSON-LD back to FormData format
 */
function jsonLdToFormData(jsonLd: Record<string, unknown>): FormData {
  const formData: FormData = {};

  // Schema.org fields (reverse mapping)
  if (jsonLd.givenName) formData.firstName = jsonLd.givenName as string;
  if (jsonLd.familyName) formData.lastName = jsonLd.familyName as string;
  if (jsonLd.birthDate) formData.dateOfBirth = jsonLd.birthDate as string;
  if (jsonLd.gender) formData.gender = mapSchemaOrgToGender(jsonLd.gender as string);
  if (jsonLd.nationality) formData.nationality = jsonLd.nationality as FormData["nationality"];
  if (jsonLd.numberOfChildren !== undefined) formData.numberOfChildren = jsonLd.numberOfChildren as number;

  // Custom vocabulary fields (direct mapping)
  if (jsonLd.grossMonthlyIncome !== undefined) formData.grossMonthlyIncome = jsonLd.grossMonthlyIncome as number;
  if (jsonLd.netMonthlyIncome !== undefined) formData.netMonthlyIncome = jsonLd.netMonthlyIncome as number;
  if (jsonLd.assets !== undefined) formData.assets = jsonLd.assets as number;
  if (jsonLd.monthlyRent !== undefined) formData.monthlyRent = jsonLd.monthlyRent as number;
  if (jsonLd.householdSize !== undefined) formData.householdSize = jsonLd.householdSize as number;
  if (jsonLd.childrenAges) formData.childrenAges = jsonLd.childrenAges as number[];
  if (jsonLd.livesWithParents !== undefined) formData.livesWithParents = jsonLd.livesWithParents as boolean;
  if (jsonLd.residenceStatus) formData.residenceStatus = jsonLd.residenceStatus as FormData["residenceStatus"];
  if (jsonLd.residenceInGermany !== undefined) formData.residenceInGermany = jsonLd.residenceInGermany as boolean;
  if (jsonLd.employmentStatus) formData.employmentStatus = jsonLd.employmentStatus as FormData["employmentStatus"];
  if (jsonLd.educationLevel) formData.educationLevel = jsonLd.educationLevel as FormData["educationLevel"];
  if (jsonLd.isStudent !== undefined) formData.isStudent = jsonLd.isStudent as boolean;
  if (jsonLd.workAbility) formData.workAbility = jsonLd.workAbility as FormData["workAbility"];
  if (jsonLd.hasDisability !== undefined) formData.hasDisability = jsonLd.hasDisability as boolean;
  if (jsonLd.disabilityDegree !== undefined) formData.disabilityDegree = jsonLd.disabilityDegree as number;
  if (jsonLd.hasCareNeeds !== undefined) formData.hasCareNeeds = jsonLd.hasCareNeeds as boolean;
  if (jsonLd.maritalStatus) formData.maritalStatus = jsonLd.maritalStatus as FormData["maritalStatus"];
  if (jsonLd.isPregnant !== undefined) formData.isPregnant = jsonLd.isPregnant as boolean;
  if (jsonLd.isSingleParent !== undefined) formData.isSingleParent = jsonLd.isSingleParent as boolean;
  if (jsonLd.healthInsurance) formData.healthInsurance = jsonLd.healthInsurance as FormData["healthInsurance"];
  if (jsonLd.hasCareInsurance !== undefined) formData.hasCareInsurance = jsonLd.hasCareInsurance as boolean;
  if (jsonLd.receivesUnemploymentBenefit1 !== undefined) formData.receivesUnemploymentBenefit1 = jsonLd.receivesUnemploymentBenefit1 as boolean;
  if (jsonLd.receivesUnemploymentBenefit2 !== undefined) formData.receivesUnemploymentBenefit2 = jsonLd.receivesUnemploymentBenefit2 as boolean;
  if (jsonLd.receivesPension !== undefined) formData.receivesPension = jsonLd.receivesPension as boolean;
  if (jsonLd.pensionEligible !== undefined) formData.pensionEligible = jsonLd.pensionEligible as boolean;
  if (jsonLd.citizenBenefitLast3Years !== undefined) formData.citizenBenefitLast3Years = jsonLd.citizenBenefitLast3Years as boolean;
  if (jsonLd.receivesChildBenefit !== undefined) formData.receivesChildBenefit = jsonLd.receivesChildBenefit as boolean;
  if (jsonLd.receivesHousingBenefit !== undefined) formData.receivesHousingBenefit = jsonLd.receivesHousingBenefit as boolean;
  if (jsonLd.receivesStudentAid !== undefined) formData.receivesStudentAid = jsonLd.receivesStudentAid as boolean;
  if (jsonLd.hasFinancialHardship !== undefined) formData.hasFinancialHardship = jsonLd.hasFinancialHardship as boolean;

  return formData;
}

/**
 * Maps Schema.org GenderType back to internal gender values
 */
function mapSchemaOrgToGender(schemaGender: string): FormData["gender"] {
  if (schemaGender === "https://schema.org/Male" || schemaGender === "Male") return "male";
  if (schemaGender === "https://schema.org/Female" || schemaGender === "Female") return "female";
  return "unspecified";
}

export interface UseSolidPodOptions {
  onMessage?: (
    msg: string,
    type: "success" | "info" | "warning" | "emergency"
  ) => void;
}

export function useSolidPod(options: UseSolidPodOptions = {}) {
  const { onMessage } = options;

  const solidIssuer = ref(DEFAULT_ISSUER);
  const solidSession = getDefaultSession();
  const isConnected = ref(false);
  const webId = ref<string | undefined>(undefined);
  const loading = ref(false);
  const podData = ref<FormData | undefined>(undefined);

  /**
   * Extracts the origin from the current issuer URL
   */
  function normalizeIssuer(issuer: string): string {
    try {
      const url = new URL(issuer);
      return url.origin;
    } catch {
      return issuer;
    }
  }

  function getPodRoot(webIdValue: string): string {
    const url = new URL(webIdValue);
    const pathSegments = url.pathname.split('/').filter(s => s.length > 0);

    // If there's at least one path segment (e.g., /test1/), include it in the pod root
    if (pathSegments.length > 0) {
      return `${url.origin}/${pathSegments[0]}/`;
    }

    return url.origin + "/";
  }

  async function connect(): Promise<void> {
    loading.value = true;
    try {
      const issuer = normalizeIssuer(solidIssuer.value);
      await login({
        oidcIssuer: issuer,
        redirectUrl: window.location.href,
        clientName: "Solid Data Manager",
      });
    } catch (err) {
      onMessage?.(
        createErrorMessage(SolidErrorMessages.LOGIN_FAILED, err),
        "emergency"
      );
    } finally {
      loading.value = false;
    }
  }

  async function disconnect(): Promise<void> {
    loading.value = true;
    try {
      await logout();
      isConnected.value = false;
      webId.value = undefined;
      podData.value = undefined;
      onMessage?.("Erfolgreich abgemeldet", "info");
    } catch (err) {
      onMessage?.(
        createErrorMessage(SolidErrorMessages.LOGOUT_FAILED, err),
        "emergency"
      );
    } finally {
      loading.value = false;
    }
  }

  async function saveData(formData: FormData): Promise<void> {
    if (!webId.value) return;

    loading.value = true;
    try {
      const podRoot = getPodRoot(webId.value);
      const fileUrl = `${podRoot}${SOLID_DATA_FILE}`;

      const jsonLd = formDataToJsonLd(formData);
      const blob = new Blob([JSON.stringify(jsonLd, null, 2)], {
        type: "application/ld+json",
      });

      await overwriteFile(fileUrl, blob, { fetch: solidFetch });
      onMessage?.("Daten erfolgreich im Solid Pod gespeichert!", "success");
    } catch (err) {
      onMessage?.(
        createErrorMessage(SolidErrorMessages.SAVE_FAILED, err),
        "emergency"
      );
    } finally {
      loading.value = false;
    }
  }

  async function loadData(): Promise<FormData | undefined> {
    if (!webId.value) return undefined;

    loading.value = true;
    try {
      const podRoot = getPodRoot(webId.value);
      const fileUrl = `${podRoot}${SOLID_DATA_FILE}`;

      const file = await getFile(fileUrl, { fetch: solidFetch });
      const text = await file.text();
      const jsonLd = JSON.parse(text);
      const loadedData: FormData = jsonLdToFormData(jsonLd);

      podData.value = loadedData;
      onMessage?.("Daten erfolgreich aus dem Solid Pod geladen!", "success");
      return loadedData;
    } catch (err) {
      // If file doesn't exist yet (404), silently return undefined
      // This is expected on first connection before any data is saved
      if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as any).response;
        if (response?.status === 404) {
          return undefined;
        }
      }

      onMessage?.(
        createErrorMessage(SolidErrorMessages.LOAD_FAILED, err),
        "warning"
      );
      return undefined;
    } finally {
      loading.value = false;
    }
  }


  async function handleRedirect(): Promise<void> {
    try {
      await handleIncomingRedirect({
        restorePreviousSession: true,
      });
      isConnected.value = solidSession.info.isLoggedIn;
      webId.value = solidSession.info.webId;
    } catch {
      // Solid redirect handling failed - session may not be restored
    }
  }

  return {
    solidIssuer,
    isConnected,
    webId,
    loading,
    podData,

    connect,
    disconnect,
    saveData,
    loadData,
    handleRedirect,
  };
}
