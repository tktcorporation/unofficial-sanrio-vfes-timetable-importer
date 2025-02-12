import { readFileSync, writeFileSync } from 'node:fs';

interface CombinedEvent {
  alt: string;
  src: string;
  path: string;
  floor: string;
  locationName: string;
  description: string;
}

interface Schedule {
  year: string;
  date: {
    month: string;
    day: string;
  };
  time: {
    hour: string;
    minute: string;
  };
}

interface Event {
  uid: string;
  floor: string;
  platform: string[];
  title: string;
  timeSlotMinutes: number;
  image: string;
  schedules: Schedule[];
  path?: string;
  locationName?: string;
  description?: string;
}

interface EventsData {
  events: Event[];
}

// ファイルを読み込む
const eventsData = JSON.parse(readFileSync('server/events.json', 'utf-8')) as EventsData;
const combinedEvents = JSON.parse(readFileSync('combined-events.json', 'utf-8')) as CombinedEvent[];

// イベント情報を更新
for (const event of eventsData.events) {
  // combined-events.jsonから一致する要素を探す
  const matchingEvent = combinedEvents.find(ce => ce.src === event.image);
  
  if (matchingEvent) {
    // 追加のプロパティを設定
    event.path = matchingEvent.path;
    event.floor = matchingEvent.floor;
    event.locationName = matchingEvent.locationName;
    event.description = matchingEvent.description;
  }
}

// 更新したデータを保存
writeFileSync('server/events.json', JSON.stringify(eventsData, null, 2), 'utf-8');

console.log('イベント情報の更新が完了しました。'); 