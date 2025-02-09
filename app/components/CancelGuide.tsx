import { AlertCircle } from "lucide-react";

export function CancelGuide() {
	return (
		<div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg p-4 mb-6">
			<div className="flex items-start gap-3">
				<AlertCircle className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
				<div>
					<h3 className="text-lg font-semibold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">
						予定をキャンセルする場合
					</h3>
					<p className="text-gray-600 text-sm leading-relaxed">
						予定をキャンセルする場合は、「キャンセル用ICSをダウンロード」ボタンをクリックしてください。
						ダウンロードしたICSファイルをカレンダーにインポートすると、選択した予定がキャンセルされます。
					</p>
				</div>
			</div>
		</div>
	);
}
