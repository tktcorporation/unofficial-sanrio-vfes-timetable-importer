import { Calendar, Check, Download } from "lucide-react";

interface Step {
	title: string;
	description: string;
	icon: React.ReactNode;
}

interface StepperProps {
	currentStep: number;
	steps: Step[];
}

export function Stepper({ currentStep, steps }: StepperProps) {
	return (
		<div className="mb-8">
			<div className="flex justify-between">
				{steps.map((step, index) => (
					<div key={step.title} className="flex-1">
						<div className="relative flex flex-col items-center">
							<div
								className={`w-12 h-12 rounded-full flex items-center justify-center ring-4 ${
									index < currentStep
										? "bg-gradient-to-r from-pink-500 to-purple-600 text-white ring-purple-100"
										: index === currentStep
											? "bg-gradient-to-r from-pink-400 to-purple-500 text-white ring-purple-100"
											: "bg-gray-200 text-gray-400 ring-gray-50"
								}`}
							>
								{index < currentStep ? (
									<Check className="w-6 h-6" />
								) : (
									step.icon
								)}
							</div>
							<div className="mt-2 text-center">
								<div
									className={`text-sm font-semibold ${
										index <= currentStep ? "text-gray-900" : "text-gray-400"
									}`}
								>
									{step.title}
								</div>
								<div
									className={`text-xs mt-1 ${
										index <= currentStep ? "text-gray-600" : "text-gray-400"
									}`}
								>
									{step.description}
								</div>
							</div>
							{index < steps.length - 1 && (
								<div
									className={`absolute top-6 left-[calc(50%+1.5rem)] h-[2px] ${
										index < currentStep
											? "bg-gradient-to-r from-pink-500 to-purple-600"
											: "bg-gray-200"
									}`}
									style={{ width: "calc(100% - 1.5rem)" }}
								/>
							)}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

export const defaultSteps: Step[] = [
	{
		title: "イベントを選択",
		description: "",
		icon: <Calendar className="w-6 h-6" />,
	},
	{
		title: "カレンダーに登録",
		description: "",
		icon: <Download className="w-6 h-6" />,
	},
];
