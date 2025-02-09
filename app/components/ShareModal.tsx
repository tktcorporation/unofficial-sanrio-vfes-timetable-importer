import { Check, X } from "lucide-react";
import type { SelectedSchedule } from "./types";
import { SelectedSchedules } from "./SelectedSchedules";
import { useState } from "react";

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
			console.error('Failed to copy URL:', error);
		}
	};
	const handleShareToX = () => {
		const text = '#サンリオVfes 2025に一緒に参加しよう！\n\n';
		const url = `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
		window.open(url, '_blank');
	};

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-xl font-bold">予定を共有</h2>
					<button
						type="button"
						onClick={onClose}
						className="text-gray-500 hover:text-gray-700"
					>
						<X className="w-6 h-6" />
					</button>
				</div>

				<p className="text-gray-600 mb-4">
					以下の{selectedCount}件の予定を共有するためのリンクを発行しました。
					このリンクを共有すると、選択した予定を他の人と共有できます。
				</p>

				<div className="mb-6">
					<SelectedSchedules selectedSchedules={selectedSchedules} />
				</div>

				<div className="flex items-center gap-2 mb-6">
					<input
						type="text"
						value={shareUrl}
						readOnly
						className="flex-1 p-2 border rounded-lg bg-gray-50"
					/>
					<button
						type="button"
						onClick={handleCopyLink}
						className={`flex items-center justify-center gap-2 min-w-[100px] px-4 py-2 rounded-lg text-white transition-all duration-300 ${
							isCopied ? "bg-custom-blue" : "bg-[#333] hover:bg-gray-700"
						}`}
					>
						{isCopied ? (
							<>
								<Check className="w-5 h-5" />
								コピー済み
							</>
						) : (
							"コピー"
						)}
					</button>
				</div>

				<div className="flex justify-center">
					<button
						type="button"
						onClick={handleShareToX}
						className="flex items-center gap-2 px-6 py-3 bg-[#333] text-white rounded-lg hover:bg-gray-700 transition-colors"
					>
						<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-labelledby="x-share-title">
							<title id="x-share-title">Xでシェア</title>
							<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
						</svg>
						Xでシェア
					</button>
				</div>
			</div>
		</div>
	);
} 