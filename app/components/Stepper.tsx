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
	return <div />;
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
