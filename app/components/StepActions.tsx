import { ArrowLeft, ArrowRight, Download, Loader2, Share2 } from "lucide-react";

export type StepActionsProps = {
	currentStep: number;
	onNext: () => void;
	onBack: () => void;
	isNextDisabled?: boolean;
	nextLabel?: string;
	backLabel?: string;
	selectedCount?: number;
	isLoading?: boolean;
	onDownloadICS?: () => void;
	onCancelEvents?: () => void;
	onShare?: () => void;
};

export function StepActions({
	currentStep,
	onNext,
	onBack,
	isNextDisabled = false,
	nextLabel = "カレンダーに登録",
	backLabel = "戻る",
	selectedCount = 0,
	isLoading = false,
	onDownloadICS,
	onCancelEvents,
	onShare,
}: StepActionsProps) {
	const getNextLabel = () => {
		if (currentStep === 0 && selectedCount > 0) {
			return `${selectedCount}件をカレンダーに登録`;
		}
		return nextLabel;
	};

	return (
		<div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm shadow-lg z-50">
			<div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center gap-4">
				{currentStep > 0 ? (
					<button
						type="button"
						onClick={onBack}
						className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors cursor-pointer"
					>
						<ArrowLeft className="w-4 h-4" />
						{backLabel}
					</button>
				) : (
					<div /> // スペースを確保するための空のdiv
				)}

				<div className="flex gap-4">
					{currentStep === 1 && selectedCount > 0 && onShare && (
						<button
							type="button"
							onClick={onShare}
							className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-white font-semibold transition-all duration-300 bg-[#333] hover:bg-gray-700 cursor-pointer"
						>
							<Share2 className="w-4 h-4" />
						</button>
					)}

					{currentStep === 0 && (
						<button
							type="button"
							onClick={onNext}
							disabled={isNextDisabled}
							className={`flex items-center gap-2 px-6 py-3 rounded-lg text-white font-semibold transition-all duration-300 ${
								isNextDisabled
									? "bg-gray-400 cursor-not-allowed"
									: "bg-gradient-to-r bg-[#333] cursor-pointer hover:bg-gray-700"
							}`}
						>
							{getNextLabel()}
							<ArrowRight className="w-4 h-4" />
						</button>
					)}

					{currentStep === 1 && onDownloadICS && (
						<button
							type="button"
							onClick={onDownloadICS}
							disabled={selectedCount === 0 || isLoading}
							className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-white font-semibold transition-all duration-300
								${
									selectedCount === 0
										? "bg-gray-400 cursor-not-allowed"
										: "bg-gradient-to-r bg-[#333] cursor-pointer hover:bg-gray-700"
								}`}
						>
							{isLoading ? (
								<Loader2 className="w-4 h-4 animate-spin" />
							) : (
								<Download className="w-4 h-4 cursor-pointer" />
							)}
							カレンダーに登録
						</button>
					)}
				</div>
			</div>
		</div>
	);
}
