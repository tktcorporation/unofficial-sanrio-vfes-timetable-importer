import { Download, Loader2, Trash2 } from "lucide-react";

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
      <button
        type="button"
        onClick={onDownloadICS}
        disabled={selectedSchedulesCount === 0 || isLoading}
        className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-white text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl
          ${
            selectedSchedulesCount === 0
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
          }`}
      >
        {isLoading ? (
          <Loader2 className="w-6 h-6 animate-spin" />
        ) : (
          <Download className="w-6 h-6" />
        )}
        ICSファイルをダウンロード
      </button>
      <button
        type="button"
        onClick={onCancelEvents}
        disabled={selectedSchedulesCount === 0 || isLoading}
        className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-white text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl
          ${
            selectedSchedulesCount === 0
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700"
          }`}
      >
        {isLoading ? (
          <Loader2 className="w-6 h-6 animate-spin" />
        ) : (
          <Trash2 className="w-6 h-6" />
        )}
        キャンセル用ICSをダウンロード
      </button>
    </div>
  );
} 