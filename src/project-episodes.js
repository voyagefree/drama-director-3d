/**
 * Project episodes + project-wide cast library.
 *
 * CozyClay projects are organised around a flat scene list; short-drama
 * authoring needs one more level: EPISODES group scenes (and carry a script
 * text), and a project-wide CAST LIBRARY holds reusable character definitions
 * that any scene can pull from.
 *
 * Persistence mirrors the scene store: localStorage is the always-on session
 * cache; the `.cclayproject` file is the portable source of truth. Both the
 * episodes array and the cast library are OPTIONAL fields of the project
 * envelope (see project.js): older v4 files simply lack them and normalise to
 * empty lists, so this module never bumps PROJECT_VERSION.
 */

export const EPISODES_STORAGE_KEY = "cozyclay.project-episodes.v1";
export const EPISODES_VERSION = 1;
export const CAST_LIBRARY_STORAGE_KEY = "cozyclay.project-cast.v1";

let episodeSequence = 0;
let castSequence = 0;

function plainRecord(value) {
	return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function cleanString(value, fallback = "") {
	return typeof value === "string" ? value : fallback;
}

function cleanNumber(value, fallback = 0) {
	return Number.isInteger(value) && value > 0 ? value : fallback;
}

function cleanId(value, prefix) {
	const text = typeof value === "string" && value.trim() ? value.trim() : `${prefix}-${Date.now().toString(36)}-${(prefix === "ep" ? episodeSequence++ : castSequence++)}`;
	return text;
}

/** A fresh episode. number defaults to one past the highest existing. */
export function createEpisode(existing = [], requestedNumber = null) {
	const numbers = new Set(Array.isArray(existing) ? existing.map((entry) => cleanNumber(entry?.number)) : []);
	let number = requestedNumber ?? 1;
	while (numbers.has(number)) number += 1;
	return { id: cleanId(null, "ep"), number, title: "", script: "", sceneIds: [] };
}

export function addEpisode(list, requestedNumber = null) {
	const episodes = Array.isArray(list) ? list : [];
	return [...episodes, createEpisode(episodes, requestedNumber)];
}

/** Patch title/script/number on one episode; sceneIds go through
 * setEpisodeScenes so the list can be re-validated. */
export function updateEpisode(list, id, patch = {}) {
	const episodes = Array.isArray(list) ? list : [];
	return episodes.map((entry) => {
		if (entry?.id !== id) return entry;
		const next = { ...entry };
		if (typeof patch.title === "string") next.title = patch.title;
		if (typeof patch.script === "string") next.script = patch.script;
		if (Number.isInteger(patch.number) && patch.number > 0) next.number = patch.number;
		return next;
	});
}

export function removeEpisode(list, id) {
	return (Array.isArray(list) ? list : []).filter((entry) => entry?.id !== id);
}

/** Re-number episodes 1..N by array order (after a delete or a reorder). */
export function renumberEpisodes(list) {
	return (Array.isArray(list) ? list : []).map((entry, index) => (entry ? { ...entry, number: index + 1 } : entry));
}

export function setEpisodeScenes(list, id, sceneIds) {
	const ids = Array.isArray(sceneIds) ? [...new Set(sceneIds.filter((sceneId) => typeof sceneId === "string" && sceneId))] : [];
	return (Array.isArray(list) ? list : []).map((entry) => (entry?.id === id ? { ...entry, sceneIds: ids } : entry));
}

export function toggleEpisodeScene(list, id, sceneId) {
	const episode = (Array.isArray(list) ? list : []).find((entry) => entry?.id === id);
	if (!episode) return list;
	const has = Array.isArray(episode.sceneIds) && episode.sceneIds.includes(sceneId);
	return setEpisodeScenes(list, id, has ? (episode.sceneIds ?? []).filter((existing) => existing !== sceneId) : [...(episode.sceneIds ?? []), sceneId]);
}

/** A project-wide cast entry. modelId references a built-in or imported
 * character model id (see scenes.js CHARACTER_MODEL_IDS); subject is the
 * free-text appearance used to drive image/video prompts. */
export function createCastEntry({ name = "", modelId = "y-bot-tpose", subject = "" } = {}) {
	return {
		id: cleanId(null, "cast"),
		name: cleanString(name, "角色"),
		modelId: cleanString(modelId, "y-bot-tpose"),
		subject: cleanString(subject),
	};
}

export function addCastEntry(list, draft = {}) {
	const entries = Array.isArray(list) ? list : [];
	return [...entries, createCastEntry(draft)];
}

export function updateCastEntry(list, id, patch = {}) {
	const entries = Array.isArray(list) ? list : [];
	return entries.map((entry) => {
		if (entry?.id !== id) return entry;
		const next = { ...entry };
		if (typeof patch.name === "string") next.name = patch.name;
		if (typeof patch.modelId === "string" && patch.modelId) next.modelId = patch.modelId;
		if (typeof patch.subject === "string") next.subject = patch.subject;
		return next;
	});
}

export function removeCastEntry(list, id) {
	return (Array.isArray(list) ? list : []).filter((entry) => entry?.id !== id);
}

/* ------------------------- normalisation (project-file boundary) ------------------------- */

/** Sanitise an arbitrary episodes payload before it crosses the project-file
 * boundary; invalid entries are dropped, unknown keys ride along losslessly. */
export function normalizeEpisodes(value) {
	if (!Array.isArray(value)) return [];
	const seen = new Set();
	return value.flatMap((entry) => {
		if (!plainRecord(entry) || typeof entry.id !== "string" || !entry.id || seen.has(entry.id)) return [];
		seen.add(entry.id);
		return [{
			id: entry.id,
			number: cleanNumber(entry.number, 1),
			title: cleanString(entry.title),
			script: cleanString(entry.script),
			sceneIds: Array.isArray(entry.sceneIds) ? [...new Set(entry.sceneIds.filter((sceneId) => typeof sceneId === "string" && sceneId))] : [],
		}];
	});
}

export function normalizeCastLibrary(value) {
	if (!Array.isArray(value)) return [];
	const seen = new Set();
	return value.flatMap((entry) => {
		if (!plainRecord(entry) || typeof entry.id !== "string" || !entry.id || seen.has(entry.id)) return [];
		seen.add(entry.id);
		return [{
			id: entry.id,
			name: cleanString(entry.name, "角色"),
			modelId: cleanString(entry.modelId, "y-bot-tpose"),
			subject: cleanString(entry.subject),
		}];
	});
}

/* ------------------------------ session cache ------------------------------ */

export function loadEpisodes(storage = globalThis.localStorage) {
	try {
		const parsed = JSON.parse(storage?.getItem(EPISODES_STORAGE_KEY) || "null");
		// saveEpisodes wraps { version, episodes }; tolerate a bare array too.
		return normalizeEpisodes(parsed?.episodes ?? parsed);
	} catch {
		return [];
	}
}

export function saveEpisodes(episodes, storage = globalThis.localStorage) {
	const normalized = normalizeEpisodes(episodes);
	try {
		storage?.setItem(EPISODES_STORAGE_KEY, JSON.stringify({ version: EPISODES_VERSION, episodes: normalized }));
	} catch {
		/* private browsing / full quota: session cache only */
	}
	return normalized;
}

export function loadCastLibrary(storage = globalThis.localStorage) {
	try {
		return normalizeCastLibrary(JSON.parse(storage?.getItem(CAST_LIBRARY_STORAGE_KEY) || "null"));
	} catch {
		return [];
	}
}

export function saveCastLibrary(entries, storage = globalThis.localStorage) {
	const normalized = normalizeCastLibrary(entries);
	try {
		storage?.setItem(CAST_LIBRARY_STORAGE_KEY, JSON.stringify(normalized));
	} catch {
		/* ignore */
	}
	return normalized;
}
