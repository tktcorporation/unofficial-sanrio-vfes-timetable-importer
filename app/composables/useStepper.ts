import { useState } from "react";

export function useStepper() {
	const [currentStep, setCurrentStep] = useState(0);

	const nextStep = () => {
		if (currentStep < 1) {
			setCurrentStep(currentStep + 1);
		}
	};

	const backStep = () => {
		setCurrentStep(Math.max(0, currentStep - 1));
	};

	const setStep = (step: number) => {
		if (step >= 0 && step <= 1) {
			setCurrentStep(step);
		}
	};

	return {
		currentStep,
		nextStep,
		backStep,
		setStep,
	};
}
