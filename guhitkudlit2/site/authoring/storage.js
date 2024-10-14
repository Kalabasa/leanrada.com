const appDataKey = "gk2_authoring_v1_appData";

export function loadAppDataFromStorage() {
  try {
    const json = window.localStorage.getItem(appDataKey);
    if (json) {
      return JSON.parse(json);
    } else {
      throw new Error("No data");
    }
  } catch (e) {
    alert(e);
  }
  return null;
}

export function saveAppDataToStorage(appState) {
  try {
    window.localStorage.setItem(appDataKey, JSON.stringify(appState));
  } catch (e) {
    alert(e);
  }
}
