import { AlertCircle, Download, Loader2 } from "lucide-react";
import { cn } from "../lib/utils";

interface CancelGuideProps {
	onCancelEvents?: () => void;
	isLoading?: boolean;
	isDisabled?: boolean;
}

export function CancelGuide({
	onCancelEvents,
	isLoading = false,
	isDisabled = false,
}: CancelGuideProps) {
	return (
		<div className="kawaii-card p-5 bg-kawaii-lavender-light/30 border-2 border-kawaii-lavender/30">
			<div className="flex items-start gap-3">
				<AlertCircle
					className="size-5 text-kawaii-lavender flex-shrink-0 mt-0.5"
					aria-hidden="true"
				/>
				<div className="flex-1">
					<h3 className="font-bold mb-2 text-kawaii-text text-balance">
						予定を削除する場合
					</h3>
					<p className="text-kawaii-text-muted text-sm leading-relaxed text-pretty">
						カレンダー内で「サンリオVfes2026」の予定を検索し、削除を行なってください。
					</p>
					<div className="flex items-end gap-2 hidden">
						<button
							type="button"
							onClick={onCancelEvents}
							disabled={isDisabled || isLoading}
							className={cn(
								"text-sm flex items-center justify-center gap-1 px-4 py-2 rounded-xl font-semibold",
								isDisabled
									? "bg-gray-300 cursor-not-allowed text-gray-500"
									: "kawaii-btn-secondary cursor-pointer",
							)}
						>
							{isLoading ? (
								<Loader2 className="size-5 animate-spin" />
							) : (
								<Download className="size-5" />
							)}
							キャンセル用ICS
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
