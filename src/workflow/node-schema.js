// A compact, Vibe-compatible subset of the node schema contract.
// A host can replace this object at runtime via window.__COZYCLAY_NODE_SCHEMAS__;
// the local defaults keep the canvas useful when the bridge is offline.
import { ko } from "../locale.js";

const field = (type, title, extra = {}) => ({ type, title: ko(title), ...extra });

export const DEFAULT_NODE_SCHEMAS = {
	version: 1,
	categories: {
		text: { models: {
			"text-passthrough": { name: ko("Input Text", "输入文本"), input_schema: { schemas: { input_data: { properties: { prompt: field("string", "Prompt") } } } } },
			"text-generation": { name: ko("Text Generation", "文本生成"), input_schema: { schemas: { input_data: { properties: { prompt: field("string", "Prompt"), temperature: field("number", "Temperature", { default: 0.7, minimum: 0, maximum: 2, step: 0.1 }) } } } } },
		} },
		image: { models: {
			"image-passthrough": { name: ko("Input Image", "输入图像"), input_schema: { schemas: { input_data: { properties: { image_url: field("string", "Image URL", { format: "uri" }) } } } } },
			"image-generation": { name: ko("Image Generation", "图像生成"), input_schema: { schemas: { input_data: { properties: { prompt: field("string", "Prompt"), image_url: field("string", "Reference image", { format: "uri" }), aspect_ratio: field("string", "Aspect ratio", { enum: ["auto", "1:1", "16:9", "9:16"] }) } } } } },
		} },
		video: { models: {
			"video-passthrough": { name: ko("Input Video", "输入视频"), input_schema: { schemas: { input_data: { properties: { video_url: field("string", "Video URL", { format: "uri" }) } } } } },
			"video-generation": { name: ko("Video Generation", "视频生成"), input_schema: { schemas: { input_data: { properties: { provider: field("string", "Provider", { enum: ["comfy", "fal"], default: "comfy" }), prompt: field("string", "Motion prompt"), duration_seconds: field("number", "Duration", { default: 5, minimum: 1, maximum: 15, step: 1 }), aspect: field("string", "Aspect ratio", { enum: ["16:9", "9:16", "1:1", "21:9", "12:7"], default: "16:9" }), extract_mocap: field("boolean", "Extract GVHMR motion", { default: false }) } } } } },
		} },
		audio: { models: {
			"audio-passthrough": { name: ko("Input Audio", "输入音频"), input_schema: { schemas: { input_data: { properties: { audio_url: field("string", "Audio URL", { format: "uri" }) } } } } },
			"audio-generation": { name: ko("Audio Generation", "音频生成"), input_schema: { schemas: { input_data: { properties: { prompt: field("string", "Prompt"), duration: field("integer", "Duration", { default: 10, minimum: 1, maximum: 60 }) } } } } },
		} },
		api: { models: {
			"api-model": { name: ko("API Model", "API 模型"), input_schema: { properties: { input: field("string", "Input"), params: field("object", "Parameters", { default: {} }) } } },
		} },
		utility: { models: {
			"prompt-concatenator": { name: ko("Prompt Concat", "提示词拼接"), input_schema: { schemas: { input_data: { properties: { template: field("string", "Template", { default: "{prompt} {style}" }) } } } } },
			"video-combiner": { name: ko("Video Combiner", "视频合成"), input_schema: { schemas: { input_data: { properties: { videos_list: field("array", "Video URLs", { items: { type: "string" } }), aspect_ratio: field("string", "Aspect ratio", { enum: ["auto", "16:9", "9:16", "1:1"] }) } } } } },
		} },
	},
};

export function schemaModelEntries(nodeSchemas, category) {
	const models = nodeSchemas?.categories?.[category]?.models || {};
	return Object.entries(models).map(([id, model]) => ({ ...model, id, name: model.name || id.replace(/-/g, " ") }));
}

export function schemaForModel(nodeSchemas, category, modelId) {
	const model = nodeSchemas?.categories?.[category]?.models?.[modelId];
	const input = model?.input_schema || {};
	return input?.schemas?.input_data || input;
}

export function schemaProperties(nodeSchemas, category, modelId) {
	return schemaForModel(nodeSchemas, category, modelId)?.properties || {};
}

export function defaultFormValues(properties = {}) {
	return Object.fromEntries(Object.entries(properties).map(([key, meta]) => {
		if (meta.default !== undefined) return [key, meta.default];
		if (meta.enum?.length) return [key, meta.enum[0]];
		if (meta.type === "array") return [key, []];
		if (meta.type === "object") return [key, {}];
		if (meta.type === "boolean") return [key, false];
		return [key, ""];
	}));
}

export function schemaCategoryForType(type) {
	return ["concat", "video-combiner", "shot-prompt"].includes(type) ? "utility" : type;
}
