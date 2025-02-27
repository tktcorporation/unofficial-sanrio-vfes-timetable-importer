import { ArrowLeft, ArrowRight, Download, Loader2, Share2 } from "lucide-react";
import { Button } from "./ui/button";

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
		<div className="fixed bottom-0 left-0 right-0 shadow-lg z-50">
			<div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center gap-4">
				{currentStep > 0 ? (
					<Button
						type="button"
						onClick={onBack}
						variant="ghost"
						className="text-gray-600 hover:text-gray-800"
					>
						<ArrowLeft className="w-4 h-4 mr-2" />
						{backLabel}
					</Button>
				) : (
					<div /> // スペースを確保するための空のdiv
				)}

				<div className="flex gap-4">
					{currentStep === 1 && selectedCount > 0 && onShare && (
						<Button
							type="button"
							onClick={onShare}
							size="lg"
							className="bg-[#333] hover:bg-gray-700"
						>
							<Share2 className="w-4 h-4" />
						</Button>
					)}

					{currentStep === 0 && (
						<Button
							type="button"
							onClick={onNext}
							disabled={isNextDisabled}
							size="lg"
							className={`${
								isNextDisabled
									? "bg-gray-400 cursor-not-allowed"
									: "bg-[#333] hover:bg-gray-700"
							}`}
						>
							{getNextLabel()}
							<ArrowRight className="w-4 h-4 ml-2" />
						</Button>
					)}

					{currentStep === 1 && onDownloadICS && (
						<Button
							type="button"
							onClick={onDownloadICS}
							disabled={selectedCount === 0 || isLoading}
							size="lg"
							className={`
								${
									selectedCount === 0
										? "bg-gray-400 cursor-not-allowed"
										: "bg-[#333] hover:bg-gray-700"
								}`}
						>
							{isLoading ? (
								<Loader2 className="w-4 h-4 animate-spin" />
							) : (
								<Download className="w-4 h-4" />
							)}
							カレンダーに登録
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}
