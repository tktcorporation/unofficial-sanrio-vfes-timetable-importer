import { Check, X } from "lucide-react";
import { useState } from "react";
import { cn } from "../lib/utils";
import { SelectedSchedules } from "./SelectedSchedules";
import type { SelectedSchedule } from "./types";

type ShareModalProps = {
	isOpen: boolean;
	onClose: () => void;
	shareUrl: string;
	selectedCount: number;
	selectedSchedules: SelectedSchedule[];
};

export function ShareModal({
	isOpen,
	onClose,
	shareUrl,
	selectedCount,
	selectedSchedules,
}: ShareModalProps) {
	const [isCopied, setIsCopied] = useState(false);

	if (!isOpen) return null;

	const handleCopyLink = async () => {
		try {
			await navigator.clipboard.writeText(shareUrl);
			setIsCopied(true);
			// 3秒後に状態をリセット
			setTimeout(() => {
				setIsCopied(false);
			}, 3000);
		} catch (error) {
			console.error("Failed to copy URL:", error);
		}
	};
	const handleShareToX = () => {
		const text = `#サンリオVfes 2026に一緒に参加しよう！\n\nここからカレンダー登録->${shareUrl}`;
		const encodedText = encodeURIComponent(text);
		const url = `https://x.com/intent/post?text=${encodedText}`;
		window.open(url, "_blank");
	};

	return (
		<div className="fixed inset-0 kawaii-modal-backdrop flex items-center justify-center z-50">
			<div className="kawaii-modal p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
				<div className="flex justify-between items-center mb-6">
					<h2 className="kawaii-modal-header text-2xl text-balance">
						予定を共有
					</h2>
					<button
						type="button"
						onClick={onClose}
						className="p-2 rounded-xl text-kawaii-text-muted hover:text-kawaii-pink transition-colors"
						aria-label="閉じる"
					>
						<X className="size-6" />
					</button>
				</div>

				<p className="text-kawaii-text-muted mb-6 text-pretty">
					以下の
					<span className="inline-flex items-center justify-center bg-kawaii-pink text-white rounded-full size-6 text-sm font-bold mx-1 tabular-nums">
						{selectedCount}
					</span>
					件の予定を共有するためのリンクを発行しました。
					このリンクを共有すると、選択した予定を他の人と共有できます。
				</p>

				<div className="flex items-center gap-2 mb-6">
					<input
						type="text"
						value={shareUrl}
						readOnly
						className="kawaii-input flex-1"
					/>
					<button
						type="button"
						onClick={handleCopyLink}
						className={cn(
							"kawaii-btn-primary flex items-center justify-center gap-2 min-w-[120px] px-4 py-3",
							isCopied && "!bg-kawaii-mint",
						)}
					>
						{isCopied ? (
							<>
								<Check className="size-5" />
								コピー済み
							</>
						) : (
							"コピー"
						)}
					</button>
				</div>

				<div className="flex justify-center mb-6">
					<button
						type="button"
						onClick={handleShareToX}
						className="kawaii-btn-secondary flex items-center gap-3 px-6 py-3"
					>
						<svg
							className="size-5"
							fill="currentColor"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
						</svg>
						Xでシェア
					</button>
				</div>

				<div className="border-t-2 border-kawaii-pink-light/50 pt-6">
					<SelectedSchedules selectedSchedules={selectedSchedules} />
				</div>
			</div>
		</div>
	);
}
