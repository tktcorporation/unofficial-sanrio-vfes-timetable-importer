import { useState } from "react";

export type NotificationType = "success" | "error";

export interface NotificationState {
	type: NotificationType;
	message: string;
}

export function useNotification() {
	const [notification, setNotification] = useState<NotificationState | null>(
		null,
	);

	const showNotification = (type: NotificationType, message: string) => {
		setNotification({ type, message });
	};

	const clearNotification = () => {
		setNotification(null);
	};

	return {
		notification,
		showNotification,
		clearNotification,
	};
}
