import { ArrowLeft, ArrowRight } from "lucide-react";

interface StepActionsProps {
	currentStep: number;
	onNext: () => void;
	onBack: () => void;
	isNextDisabled?: boolean;
	nextLabel?: string;
	backLabel?: string;
}

export function StepActions({
	currentStep,
	onNext,
	onBack,
	isNextDisabled = false,
	nextLabel = "次へ",
	backLabel = "戻る",
}: StepActionsProps) {
	return (
		<div className="flex justify-between items-center mb-6">
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
					{nextLabel}
					<ArrowRight className="w-4 h-4" />
				</button>
			)}
		</div>
	);
}
