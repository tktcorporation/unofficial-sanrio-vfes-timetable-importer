import { X } from "lucide-react";

interface NotificationProps {
	type: "success" | "error";
	message: string;
	onClose: () => void;
}

export function Notification({ type, message, onClose }: NotificationProps) {
	return (
		<div
			className={`mb-4 p-4 rounded-lg flex items-center justify-between backdrop-blur-sm ${
				type === "success"
					? "bg-green-100/80 text-green-800"
					: "bg-red-100/80 text-red-800"
			}`}
		>
			<span>{message}</span>
			<button
				type="button"
				onClick={onClose}
				className="text-gray-500 hover:text-gray-700"
			>
				<X className="w-4 h-4" />
			</button>
		</div>
	);
}
