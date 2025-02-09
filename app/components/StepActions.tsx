import { ArrowLeft, ArrowRight } from "lucide-react";

interface StepActionsProps {
	currentStep: number;
	onNext: () => void;
	onBack: () => void;
	isNextDisabled?: boolean;
	nextLabel?: string;
	backLabel?: string;
	selectedCount?: number;
}

export function StepActions({
	currentStep,
	onNext,
	onBack,
	isNextDisabled = false,
	nextLabel = "次へ",
	backLabel = "戻る",
	selectedCount = 0,
}: StepActionsProps) {
	const getNextLabel = () => {
		if (currentStep === 0 && selectedCount > 0) {
			return `${selectedCount}件をカレンダーに登録する`;
		}
		return nextLabel;
	};

	return (
		<div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm shadow-lg z-50">
			<div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
				{currentStep > 0 ? (
					<button
						type="button"
						onClick={onBack}
						className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
					>
						<ArrowLeft className="w-4 h-4" />
						{backLabel}
					</button>
				) : (
					<div /> // スペースを確保するための空のdiv
				)}
				{currentStep < 2 && (
					<button
						type="button"
						onClick={onNext}
						disabled={isNextDisabled}
						className={`flex items-center gap-2 px-6 py-3 rounded-lg text-white font-semibold transition-all duration-300 shadow-lg hover:shadow-xl ${
							isNextDisabled
								? "bg-gray-400 cursor-not-allowed"
								: "bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
						}`}
					>
						{getNextLabel()}
						<ArrowRight className="w-4 h-4" />
					</button>
				)}
			</div>
		</div>
	);
}
