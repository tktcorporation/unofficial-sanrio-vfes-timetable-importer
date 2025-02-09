import { AlertCircle, Loader2, Trash2 } from "lucide-react";

interface CancelGuideProps {
	onCancelEvents?: () => void;
	isLoading?: boolean;
	isDisabled?: boolean;
}

export function CancelGuide({
	onCancelEvents,
	isLoading = false,
	isDisabled = false,
}: CancelGuideProps) {
	return (
		<div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg p-4 mb-6">
			<div className="flex items-start gap-3">
				<AlertCircle className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
				<div className="flex-1">
					<h3 className="text-lg font-semibold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">
						予定をキャンセルする場合
					</h3>
					<p className="text-gray-600 text-sm leading-relaxed mb-4">
						予定をキャンセルする場合は、「キャンセル用ICSをダウンロード」ボタンをクリックしてください。
						ダウンロードしたICSファイルをカレンダーにインポートすると、選択した予定がキャンセルされます。
					</p>
					<button
						type="button"
						onClick={onCancelEvents}
						disabled={isDisabled || isLoading}
						className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-white text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl
							${isDisabled ? "bg-gray-400 cursor-not-allowed" : "bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700"
						}`}
					>
						{isLoading ? (
							<Loader2 className="w-6 h-6 animate-spin" />
						) : (
							<Trash2 className="w-6 h-6" />
						)}
						キャンセル用ICSをダウンロード
					</button>
				</div>
			</div>
		</div>
	);
}
