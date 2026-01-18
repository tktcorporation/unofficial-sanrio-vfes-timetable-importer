import { ArrowLeft, ArrowRight, Download, Loader2, Share2 } from "lucide-react";
import { cn } from "../lib/utils";
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
		<div className="fixed bottom-0 left-0 right-0 kawaii-bottom-bar z-50">
			<div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center gap-4">
				{currentStep > 0 ? (
					<Button
						type="button"
						onClick={onBack}
						variant="ghost"
						className="text-kawaii-text-muted hover:text-kawaii-pink rounded-xl"
					>
						<ArrowLeft className="size-4 mr-2" />
						{backLabel}
					</Button>
				) : (
					<div className="flex items-center gap-2 text-sm text-kawaii-text-muted">
						{selectedCount > 0 && (
							<span className="tabular-nums">{selectedCount}件選択中</span>
						)}
					</div>
				)}

				<div className="flex gap-3">
					{currentStep === 1 && selectedCount > 0 && onShare && (
						<button
							type="button"
							onClick={onShare}
							className="kawaii-btn-secondary px-4 py-3 flex items-center gap-2"
							aria-label="選択した予定を共有"
						>
							<Share2 className="size-4" />
						</button>
					)}

					{currentStep === 0 && (
						<button
							type="button"
							onClick={onNext}
							disabled={isNextDisabled}
							className={cn(
								"kawaii-cta flex items-center gap-2",
								isNextDisabled && "opacity-50 cursor-not-allowed",
							)}
						>
							{selectedCount > 0 && (
								<span className="inline-flex items-center justify-center bg-white/20 rounded-full size-6 text-sm font-bold tabular-nums">
									{selectedCount}
								</span>
							)}
							<span>{getNextLabel()}</span>
							<ArrowRight className="size-4" />
						</button>
					)}

					{currentStep === 1 && onDownloadICS && (
						<button
							type="button"
							onClick={onDownloadICS}
							disabled={selectedCount === 0 || isLoading}
							className={cn(
								"kawaii-cta flex items-center gap-2",
								(selectedCount === 0 || isLoading) &&
									"opacity-50 cursor-not-allowed",
							)}
						>
							{isLoading ? (
								<Loader2 className="size-4 animate-spin" />
							) : (
								<Download className="size-4" />
							)}
							<span>カレンダーに登録</span>
						</button>
					)}
				</div>
			</div>
		</div>
	);
}
