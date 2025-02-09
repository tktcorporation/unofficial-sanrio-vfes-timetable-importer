import { AlertCircle, Download, Loader2 } from "lucide-react";

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
		<div className="bg-white border border-gray-100 rounded-lg p-4 mb-6">
			<div className="flex items-start gap-3">
				<AlertCircle className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
				<div className="flex-1">
					<h3 className="text-lg font-semibold mb-2 text-black">
						予定をキャンセルする場合
					</h3>
					<p className="text-gray-600 text-sm leading-relaxed mb-4">
						予定をキャンセルする場合は、「キャンセル用ICSをダウンロード」ボタンをクリックしてください。
						ダウンロードしたICSファイルをカレンダーにインポートすると、選択した予定がキャンセルされます。
					</p>
					<div className="flex items-end gap-2">
						<button
							type="button"
							onClick={onCancelEvents}
							disabled={isDisabled || isLoading}
							className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-300 text-black
							${
								isDisabled
									? "bg-gray-400 cursor-not-allowed"
									: "bg-gradient-to-r border border-black cursor-pointer"
							}`}
						>
							{isLoading ? (
								<Loader2 className="w-6 h-6 animate-spin" />
							) : (
								<Download className="w-6 h-6" />
							)}
							キャンセル用ICS
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
