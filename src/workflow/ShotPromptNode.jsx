import { FiCopy, FiFileText, FiPlay } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { ko } from "../locale.js";
import { shotPromptTarget } from "./shot-prompt-node.js";

/**
 * Shot Prompt node (#166): reads the connected Scene node's capture metadata
 * (and an optional Text intent) and shows the structured prompt built by
 * src/shot-prompt.js, ready to copy or to feed an Image/Video node.
 *
 * NodeShell is injected by WorkflowBuilder so this file stays free of the
 * canvas' ReactFlow wiring.
 */
export default function ShotPromptNode({ id, data = {}, NodeShell }) {
	const target = shotPromptTarget(data.target);
	const referenceOwnsCamera = data.referenceOwnsCamera !== false;
	const prompt = typeof data.prompt === "string" ? data.prompt : "";
	const copy = async () => {
		if (!prompt) { toast.error(ko("Run the node to build a prompt first", "节点运行后才能生成提示词")); return; }
		try { await navigator.clipboard.writeText(prompt); toast.success(ko("Prompt copied", "提示词已复制")); }
		catch (error) { toast.error(ko("Could not copy the prompt ({error})", "无法复制提示词（{error}）").replace("{error}", error.message)); }
	};
	return <NodeShell id={id} type="shot-prompt" title={ko("Shot Prompt", "镜头提示词")} icon={FiFileText}>
		<label htmlFor={`${id}-target`}>{ko("Target", "目标")}</label>
		<select id={`${id}-target`} aria-label={ko("Prompt target", "提示词目标")} value={target} onChange={(event) => data.onChange?.(id, { target: event.target.value })}>
			<option value="image">{ko("Image", "图像")}</option>
			<option value="video">{ko("Video", "视频")}</option>
		</select>
		<label className="workflow-schema-check"><input type="checkbox" aria-label={ko("Reference owns camera", "参考图控制镜头")} checked={referenceOwnsCamera} onChange={(event) => data.onChange?.(id, { referenceOwnsCamera: event.target.checked })} />{ko("Reference owns camera", "参考图控制镜头")}</label>
		<label htmlFor={`${id}-prompt`}>{ko("Prompt", "提示词")}</label>
		<textarea id={`${id}-prompt`} className="workflow-textarea workflow-shot-prompt-text" aria-label={ko("Shot prompt", "镜头提示词")} readOnly value={prompt} placeholder={ko("Connect a Scene node and run to build the prompt", "连接场景节点并运行以生成提示词")} />
		{data.errorMsg && <div className="workflow-error">{data.errorMsg}</div>}
		<button type="button" className="workflow-shot-prompt-copy" onClick={copy}><FiCopy size={11} /> {ko("Copy", "复制")}</button>
		<div className="workflow-node-foot"><span>{target === "video" ? ko("Video prompt", "视频提示词") : ko("Image prompt", "图像提示词")}</span><button className="workflow-mini-button" type="button" onClick={() => data.onRun?.(id)}><FiPlay size={12} /></button></div>
	</NodeShell>;
}
