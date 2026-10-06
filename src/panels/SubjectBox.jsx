import { ko, isKo } from "../locale.js";

export default function SubjectBox({ label, value, onChange, onRemove, onPose, posing, color, onColorChange, onColorEditStart }) {
	return (
		<div className="subject-box v2-subject-box">
			<div className="subject-box-head">
				<span className="sb-name">{label}</span>
				<div className="sb-actions">
					{onColorChange && (
						<input
							type="color"
							className="sb-color"
							title={ko("Character color", "인물 색상")}
							aria-label={ko("Character color", "인물 색상")}
							value={color}
							/* Focus opens the session for keyboard/eyedropper use; the
							   native swatch dialog can drive onChange without focus, so the
							   first change of a session opens it too (the handler is
							   session-idempotent). */
							onFocus={onColorEditStart}
							onChange={(e) => {
								onColorEditStart?.();
								onColorChange(e.target.value);
							}}
						/>
					)}
					{onPose && (
						<button
							type="button"
							className={"cam-toggle" + (posing ? " active" : "")}
							aria-label={ko("Open pose studio", "포즈 스튜디오 열기") + " " + label}
							title={ko("Pose", "포즈") + " " + label}
							onClick={onPose}
						>
							⌘
						</button>
					)}
					{onRemove && (
						<button type="button" className="sb-remove" title={ko("Remove subject", "인물 제거")} onClick={onRemove}>
							✕
						</button>
					)}
				</div>
			</div>
		</div>
	);
}
