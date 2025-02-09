import { Check } from "lucide-react";
import type { Event, Schedule } from "../../old_src/types";

interface EventCardProps {
  event: Event;
  selectedSchedules: Map<string, Event>;
  onScheduleToggle: (event: Event, schedule: Schedule) => void;
}

export function EventCard({ event, selectedSchedules, onScheduleToggle }: EventCardProps) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-xl border border-pink-100">
      <div className="relative">
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-40 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white/60 to-transparent"></div>
      </div>

      <div className="p-4">
        <h2 className="text-lg font-bold mb-1 text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">{event.title}</h2>
        <div className="flex items-center text-gray-600 mb-2 gap-1">
          {event.platform.map((platform) => (
            <span
              key={platform}
              className={`text-xs font-medium px-2 py-1 rounded-full ${
                platform === "PC"
                  ? "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800"
                  : "bg-gradient-to-r from-green-100 to-green-200 text-green-800"
              }`}
            >
              {platform}
            </span>
          ))}
        </div>

        <div className="space-y-2">
          {event.schedules.map((schedule) => {
            const times = Array.isArray(schedule.time)
              ? schedule.time
              : [schedule.time];
            return times.map(
              (time) => {
                const key = `${schedule.date.month}/${schedule.date.day}-${time.hour}:${time.minute}`;
                const isSelected = selectedSchedules.has(key);

                return (
                  <button
                    key={`${schedule.date}-${time}`}
                    onClick={() =>
                      onScheduleToggle(event, { ...schedule, time })
                    }
                    type="button"
                    className={`w-full p-2 border rounded-md cursor-pointer transition-all duration-300 text-left text-sm
                    ${isSelected ? "border-pink-500 bg-gradient-to-r from-pink-50 to-purple-50" : "border-gray-200 hover:bg-gray-50"}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span className="font-medium">
                          {`${schedule.date.month}/${schedule.date.day}`}
                        </span>
                        <span className="text-gray-500">
                          {`${time.hour}:${time.minute}`}
                        </span>
                      </div>
                      {isSelected && (
                        <Check className="text-pink-500 w-4 h-4" />
                      )}
                    </div>
                  </button>
                );
              },
            );
          })}
        </div>
      </div>
    </div>
  );
} 