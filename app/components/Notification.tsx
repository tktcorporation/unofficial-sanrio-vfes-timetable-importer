import { CheckCircle2, X, XCircle } from "lucide-react";
import { cn } from "../lib/utils";

interface NotificationProps {
	type: "success" | "error";
	message: string;
	onClose: () => void;
}

export function Notification({ type, message, onClose }: NotificationProps) {
	return (
		<div
			className={cn(
				"mb-4 kawaii-toast flex items-center justify-between gap-3",
				type === "success" ? "kawaii-toast-success" : "kawaii-toast-error",
			)}
			role="alert"
		>
			<div className="flex items-center gap-3">
				{type === "success" ? (
					<CheckCircle2
						className="size-5 text-kawaii-mint shrink-0"
						aria-hidden="true"
					/>
				) : (
					<XCircle
						className="size-5 text-kawaii-coral shrink-0"
						aria-hidden="true"
					/>
				)}
				<span className="text-pretty">{message}</span>
			</div>
			<button
				type="button"
				onClick={onClose}
				className={cn(
					"p-1.5 rounded-lg transition-colors",
					type === "success"
						? "hover:bg-kawaii-mint/20 text-kawaii-mint"
						: "hover:bg-kawaii-coral/20 text-kawaii-coral",
				)}
				aria-label="通知を閉じる"
			>
				<X className="size-4" />
			</button>
		</div>
	);
}
