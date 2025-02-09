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
		<div className="border border-gray-100 rounded-lg p-4 bg-gray-50">
			<div className="flex items-start gap-3">
				<AlertCircle className="w-4 h-4 text-[#333] flex-shrink-0 mt-1" />
				<div className="flex-1">
					<h3 className="font-semibold mb-2 text-black">予定を削除する場合</h3>
					<p className="text-gray-600 text-sm leading-relaxed">
						カレンダー内で「サンリオVfes2025」の予定を検索し、削除を行なってください。
					</p>
					<div className="flex items-end gap-2 hidden">
						<button
							type="button"
							onClick={onCancelEvents}
							disabled={isDisabled || isLoading}
							className={`text-sm flex items-center justify-center gap-1 px-4 py-2 rounded-lg font-semibold transition-all duration-300 text-black
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
