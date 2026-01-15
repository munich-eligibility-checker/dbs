import type { FormData } from "@/types/EligibilityCheckInterface";

import { getFile, overwriteFile } from "@inrupt/solid-client";
import { getDefaultSession, handleIncomingRedirect, login, logout, fetch as solidFetch } from "@inrupt/solid-client-authn-browser";
import { ref } from "vue";

import { createErrorMessage, SolidErrorMessages } from "@/util/errorFormatter";

const SOLID_DATA_FILE = "private/personalization/eligibility-data.json";

const DEFAULT_ISSUER = "https://m-pod.lcarilla.de";

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

      const blob = new Blob([JSON.stringify(formData, null, 2)], {
        type: "application/json",
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
      const loadedData: FormData = JSON.parse(text);

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
