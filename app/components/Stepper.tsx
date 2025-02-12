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
		<div>
			<div className="flex justify-between">
				{steps.map((step, index) => (
					<div key={step.title} className="flex-1">
						<div className="relative flex flex-col items-center">
							<div
								className={`w-9 h-9 rounded-full flex items-center justify-center ring-4 transition-all duration-700 ease-in-out transform relative z-10 ${
									index < currentStep
										? "bg-[#333] text-white ring-black-400 scale-105"
										: index === currentStep
											? "bg-[#333] text-white ring-black-400 scale-105"
											: "bg-gray-200 text-gray-400 ring-gray-50"
								}`}
							>
								{index < currentStep ? (
									<Check className="w-4 h-4 transition-all duration-700 ease-in-out" />
								) : (
									<div className="transition-all duration-700 ease-in-out">
										{step.icon}
									</div>
								)}
							</div>
							<div className="mt-2 text-center">
								<div
									className={`text-sm font-semibold transition-all duration-700 ease-in-out ${
										index <= currentStep ? "text-gray-900" : "text-gray-400"
									}`}
								>
									{step.title}
								</div>
								<div
									className={`text-xs mt-1 transition-all duration-700 ease-in-out ${
										index <= currentStep ? "text-gray-600" : "text-gray-400"
									}`}
								>
									{step.description}
								</div>
							</div>
							{index < steps.length - 1 && (
								<div
									className={`absolute top-4 w-full h-[2px] transition-all duration-700 ease-in-out ${
										index < currentStep ? "bg-[#333]" : "bg-gray-200"
									}`}
									style={{
										left: "calc(50% + 2.5rem)",
										width: "calc(100% - 5rem)",
									}}
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
		icon: <Calendar className="w-4 h-4" />,
	},
	{
		title: "カレンダーに登録",
		description: "",
		icon: <Download className="w-4 h-4" />,
	},
];
