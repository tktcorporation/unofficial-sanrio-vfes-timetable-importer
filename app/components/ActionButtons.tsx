import { Download, Loader2, Trash2 } from "lucide-react";
import { Button } from "./ui/button";

interface ActionButtonsProps {
	isLoading: boolean;
	selectedSchedulesCount: number;
	onDownloadICS: () => void;
	onCancelEvents: () => void;
}

export function ActionButtons({
	isLoading,
	selectedSchedulesCount,
	onDownloadICS,
	onCancelEvents,
}: ActionButtonsProps) {
	return (
		<div className="mb-6 flex gap-4">
			<Button
				type="button"
				onClick={onDownloadICS}
				disabled={selectedSchedulesCount === 0 || isLoading}
				size="lg"
				className={`text-white text-lg font-semibold shadow-lg hover:shadow-xl
          ${
						selectedSchedulesCount === 0
							? "bg-gray-400 cursor-not-allowed"
							: "bg-[#333] hover:bg-[#222]"
					}`}
			>
				{isLoading ? (
					<Loader2 className="w-6 h-6 animate-spin" />
				) : (
					<Download className="w-6 h-6" />
				)}
				ICSファイルをダウンロード
			</Button>
			<Button
				type="button"
				onClick={onCancelEvents}
				disabled={selectedSchedulesCount === 0 || isLoading}
				variant="outline"
				size="lg"
				className={`text-white text-lg font-semibold shadow-lg hover:shadow-xl
          ${
						selectedSchedulesCount === 0
							? "bg-gray-400 cursor-not-allowed"
							: "bg-gradient-to-r border border-black"
					}`}
			>
				{isLoading ? (
					<Loader2 className="w-6 h-6 animate-spin" />
				) : (
					<Trash2 className="w-6 h-6" />
				)}
				キャンセル用ICS
			</Button>
		</div>
	);
}
