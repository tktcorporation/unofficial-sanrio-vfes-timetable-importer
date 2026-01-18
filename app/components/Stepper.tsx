import { Calendar, Download } from "lucide-react";
import { cn } from "../lib/utils";

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
		<nav aria-label="進捗" className="flex items-center justify-center gap-2">
			{steps.map((step, index) => {
				const isActive = index === currentStep;
				const isCompleted = index < currentStep;

				return (
					<div key={step.title} className="flex items-center gap-2">
						<div
							className={cn(
								"flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors",
								isActive && "bg-kawaii-pink text-white",
								isCompleted && "bg-kawaii-pink-light text-kawaii-pink",
								!isActive && !isCompleted && "text-kawaii-text-muted",
							)}
							aria-current={isActive ? "step" : undefined}
						>
							<span
								className={cn(
									"flex items-center justify-center size-5 rounded-full text-xs font-bold",
									isActive && "bg-white/20",
									isCompleted && "bg-kawaii-pink text-white",
									!isActive && !isCompleted && "bg-kawaii-pink-light/50",
								)}
							>
								{index + 1}
							</span>
							<span className="hidden sm:inline">{step.title}</span>
						</div>
						{index < steps.length - 1 && (
							<div
								className={cn(
									"w-8 h-0.5 rounded-full",
									isCompleted ? "bg-kawaii-pink" : "bg-kawaii-pink-light",
								)}
								aria-hidden="true"
							/>
						)}
					</div>
				);
			})}
		</nav>
	);
}

export const defaultSteps: Step[] = [
	{
		title: "イベントを選択",
		description: "",
		icon: <Calendar className="size-4" />,
	},
	{
		title: "カレンダーに登録",
		description: "",
		icon: <Download className="size-4" />,
	},
];
