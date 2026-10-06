import { useId, useState } from "react";
import { ko } from "./locale.js";
import {
	addEpisode,
	updateEpisode,
	removeEpisode,
	toggleEpisodeScene,
	addCastEntry,
	updateCastEntry,
	removeCastEntry,
} from "./project-episodes.js";
import { CHARACTER_MODEL_IDS } from "./scenes.js";

/**
 * Project workbench — the short-drama organising layer on top of the studio.
 *
 * One modal hosts the pieces CozyClay keeps at project level: EPISODES (each
 * with a number, a title, a script text and the scenes it contains) and the
 * project-wide CAST LIBRARY (reusable character definitions any scene can pull
 * from). Opening a scene from here hands the user to the studio; applying a
 * library character to the current scene lands it in the active cast.
 */
export default function ProjectWorkbench({
	projectName,
	scenes,
	activeSceneId,
	episodes,
	castLibrary,
	onEpisodesChange,
	onCastChange,
	onSwitchScene,
	onNewScene,
	onApplyCast,
	onClose,
}) {
	const titleId = useId();
	const closeRef = useRefForFocus();
	const [expandedId, setExpandedId] = useState(null);
	const [castDraft, setCastDraft] = useState({ name: "", modelId: "y-bot-tpose", subject: "" });

	const sceneNames = new Map((scenes ?? []).map((scene) => [scene?.id, scene?.name ?? ""]));

	function episodeLabel(episode) {
		return episode.title || ko("Episode {number}", "에피소드 {number}", "第 {number} 集").replace("{number}", String(episode.number));
	}

	return (
		<div className="menubar-dialog-backdrop workbench-backdrop" onPointerDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
			<div className="menubar-dialog workbench-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
				<header className="menubar-dialog-head workbench-head">
					<h2 id={titleId}>
						{ko("Project workbench", "프로젝트 워크벤치", "项目工作台")}
						<span className="workbench-project-name">{projectName || ko("Untitled project", "제목 없는 프로젝트", "未命名项目")}</span>
					</h2>
					<button type="button" ref={closeRef} className="menubar-dialog-close" aria-label={ko("Close", "닫기")} onClick={onClose}>
						<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
					</button>
				</header>
				<div className="menubar-dialog-body workbench-body">
					<div className="workbench-columns">
						{/* ---------- episodes ---------- */}
						<section className="workbench-section" aria-label={ko("Episodes", "에피소드", "集数")}>
							<div className="workbench-section-head">
								<h3>{ko("Episodes", "에피소드", "集数")}</h3>
								<button
									type="button"
									className="workbench-add"
									onClick={() => {
										const next = addEpisode(episodes);
										onEpisodesChange(next);
										setExpandedId(next[next.length - 1].id);
									}}
								>
									{ko("Add episode", "에피소드 추가", "添加集数")}
								</button>
							</div>
							{(!episodes || episodes.length === 0) && (
								<p className="workbench-empty">{ko("No episodes yet — add one, then attach scenes to it.", "아직 에피소드가 없어요. 추가하고 장면을 연결하세요.", "还没有集数——添加一集，再把场景挂上去。")}</p>
							)}
							<ul className="workbench-list">
								{(episodes ?? []).map((episode) => {
									const expanded = expandedId === episode.id;
									const sceneCount = Array.isArray(episode.sceneIds) ? episode.sceneIds.length : 0;
									return (
										<li key={episode.id} className={"workbench-card" + (expanded ? " expanded" : "")}>
											<button
												type="button"
												className="workbench-card-head"
												onClick={() => setExpandedId(expanded ? null : episode.id)}
												aria-expanded={expanded}
											>
												<span className="workbench-ep-number">{episode.number}</span>
												<span className="workbench-ep-title">{episodeLabel(episode)}</span>
												<span className="workbench-ep-count">{sceneCount} {ko("scenes", "장면", "场景")}</span>
											</button>
											{expanded && (
												<div className="workbench-card-body">
													<label className="workbench-field">
														<span>{ko("Title", "제목", "标题")}</span>
														<input
															value={episode.title}
															placeholder={ko("Episode title…", "에피소드 제목…", "集标题…")}
															onChange={(event) => onEpisodesChange(updateEpisode(episodes, episode.id, { title: event.target.value }))}
														/>
													</label>
													<label className="workbench-field">
														<span>{ko("Script", "대본", "脚本")}</span>
														<textarea
															rows={6}
															value={episode.script}
															placeholder={ko("Script for this episode…", "이 에피소드의 대본…", "本集脚本…")}
															onChange={(event) => onEpisodesChange(updateEpisode(episodes, episode.id, { script: event.target.value }))}
														/>
													</label>
													<div className="workbench-field">
														<span>{ko("Scenes in this episode", "이 에피소드의 장면", "本集场景")}</span>
														<div className="workbench-scene-picks">
															{(scenes ?? []).map((scene) => {
																const included = Array.isArray(episode.sceneIds) && episode.sceneIds.includes(scene.id);
																return (
																	<label key={scene.id} className="workbench-scene-pick">
																		<input
																			type="checkbox"
																			checked={included}
																			onChange={() => onEpisodesChange(toggleEpisodeScene(episodes, episode.id, scene.id))}
																		/>
																		<span>{scene.name}</span>
																		{scene.id === activeSceneId && <em>{ko("active", "활성", "当前")}</em>}
																	</label>
																);
															})}
														</div>
													</div>
													<div className="workbench-card-actions">
														<button
															type="button"
															className="workbench-ghost"
															onClick={() => { onNewScene(episode.id); setExpandedId(episode.id); }}
														>
															{ko("New scene in this episode", "이 에피소드에 새 장면", "本集新建场景")}
														</button>
														<button
															type="button"
															className="workbench-danger"
															onClick={() => {
																const next = removeEpisode(episodes, episode.id);
																onEpisodesChange(next);
																if (expandedId === episode.id) setExpandedId(null);
															}}
														>
															{ko("Delete episode", "에피소드 삭제", "删除本集")}
														</button>
													</div>
												</div>
											)}
										</li>
									);
								})}
							</ul>
							{/* -------- all scenes (switch from here) -------- */}
							<div className="workbench-section-head workbench-scenes-head">
								<h3>{ko("All scenes", "모든 장면", "全部场景")}</h3>
								<button type="button" className="workbench-add" onClick={() => onNewScene(null)}>
									{ko("New scene", "새 장면", "新建场景")}
								</button>
							</div>
							<ul className="workbench-scene-switch">
								{(scenes ?? []).map((scene) => (
									<li key={scene.id} className={scene.id === activeSceneId ? "current" : ""}>
										<button type="button" onClick={() => onSwitchScene(scene.id)}>
											<span>{scene.name}</span>
											{scene.id === activeSceneId && <em>{ko("open", "열림", "已打开")}</em>}
										</button>
									</li>
								))}
							</ul>
						</section>
						{/* ---------- cast library ---------- */}
						<section className="workbench-section" aria-label={ko("Cast library", "캐스트 라이브러리", "角色库")}>
							<div className="workbench-section-head">
								<h3>{ko("Cast library", "캐스트 라이브러리", "角色库")}</h3>
								<button
									type="button"
									className="workbench-add"
									onClick={() => {
										const entry = addCastEntry(castLibrary, castDraft);
										onCastChange(entry);
										setCastDraft({ name: "", modelId: "y-bot-tpose", subject: "" });
									}}
								>
									{ko("Add character", "캐릭터 추가", "添加角色")}
								</button>
							</div>
							{(!castLibrary || castLibrary.length === 0) && (
								<p className="workbench-empty">{ko("No reusable characters yet — define one and apply it to the current scene.", "재사용할 캐릭터가 아직 없어요. 정의하고 현재 장면에 적용하세요.", "还没有可复用角色——定义一个，再应用到当前场景。")}</p>
							)}
							<ul className="workbench-list">
								{(castLibrary ?? []).map((entry) => (
									<li key={entry.id} className="workbench-card cast-card">
										<div className="workbench-card-body cast-fields">
											<label className="workbench-field">
												<span>{ko("Name", "이름", "名称")}</span>
												<input
													value={entry.name}
													onChange={(event) => onCastChange(updateCastEntry(castLibrary, entry.id, { name: event.target.value }))}
												/>
											</label>
											<label className="workbench-field">
												<span>{ko("Model", "모델", "模型")}</span>
												<select
													value={entry.modelId}
													onChange={(event) => onCastChange(updateCastEntry(castLibrary, entry.id, { modelId: event.target.value }))}
												>
													{CHARACTER_MODEL_IDS.map((id) => <option key={id} value={id}>{id}</option>)}
												</select>
											</label>
											<label className="workbench-field">
												<span>{ko("Appearance", "외형", "外观描述")}</span>
												<input
													value={entry.subject}
													placeholder={ko("e.g. a young woman in a tan coat", "예: 베이지 코트의 젊은 여성", "例如：穿米色外套的年轻女性")}
													onChange={(event) => onCastChange(updateCastEntry(castLibrary, entry.id, { subject: event.target.value }))}
												/>
											</label>
											<div className="workbench-card-actions">
												<button type="button" className="workbench-primary" onClick={() => onApplyCast(entry)}>
													{ko("Apply to current scene", "현재 장면에 적용", "应用到当前场景")}
												</button>
												<button
													type="button"
													className="workbench-danger"
													onClick={() => onCastChange(removeCastEntry(castLibrary, entry.id))}
												>
													{ko("Delete", "삭제", "删除")}
												</button>
											</div>
										</div>
									</li>
								))}
							</ul>
						</section>
					</div>
				</div>
			</div>
		</div>
	);
}

/** A tiny focus-on-open ref (mirrors MenuDialog; Escape is handled by App). */
function useRefForFocus() {
	const [ref] = useState({ current: null });
	return ref;
}
