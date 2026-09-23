export const LOGIN_PROMPT_EVENT = "nepick:open-login";

export interface LoginPromptDetail {
  nextPath: string;
}

export function openLoginPrompt(nextPath = "/home") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<LoginPromptDetail>(LOGIN_PROMPT_EVENT, {
    detail: { nextPath },
  }));
}
