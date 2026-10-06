// CozyClay UI locale. English is the default; Korean is opt-in; Chinese (zh)
// is a local addition for internal secondary development.
//
// An explicit choice saved in localStorage wins. Without one, the UI follows
// the browser language (zh-* starts in Chinese, ko-* in Korean, anything else
// in English) — a local modification for internal use; upstream kept English
// as the unconditional default.
// The locale is fixed for the lifetime of the page — every label goes through
// ko() at render time, so switching saves the choice and reloads.
import { ZH_DICT } from "./locale-zh.js";

const KEY = "cozyclay.locale";
const LANGS = new Set(["en", "ko", "zh"]);

function stored() {
	try {
		const value = localStorage.getItem(KEY);
		return LANGS.has(value) ? value : null;
	} catch {
		return null;
	}
}

function defaultLocale() {
	try {
		const lang = (typeof navigator !== "undefined" ? (navigator.language ?? "") : "").toLowerCase();
		if (lang.startsWith("zh")) return "zh";
		if (lang.startsWith("ko")) return "ko";
	} catch {
		// Fall through to English when navigator is unavailable.
	}
	return "en";
}

export const LOCALE = stored() ?? defaultLocale();
export const isKo = LOCALE === "ko";
export const isZh = LOCALE === "zh";
// Whether the operator has ever picked a language. A Korean browser that has
// not chosen yet still gets the English default, so the Settings trigger wears
// "한국어" as its first-run cue until a choice is stored (#193).
export const localeChosen = stored() !== null;

/** Pick the label for the active locale: ko("Frame", "프레임", "帧"). */
export function ko(en, koText, zhText) {
	if (isZh) return zhText ?? ZH_DICT[en] ?? en;
	return isKo ? koText : en;
}

export function setLocale(next) {
	if (!LANGS.has(next)) return;
	try {
		localStorage.setItem(KEY, next);
	} catch {
		// Private mode without storage: the toggle still works for this load.
	}
	window.location.reload();
}
