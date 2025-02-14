import json

# JSONファイルを読み込む
with open('scraped-artists.json', 'r', encoding='utf-8') as f:
    artists = json.load(f)

with open('server/events.json', 'r', encoding='utf-8') as f:
    events_data = json.load(f)

# アーティスト名とhrefのマッピングを作成
artist_paths = {artist['name']: artist['href'] for artist in artists}

# イベントのpathを更新
for event in events_data['events']:
    if event.get('title') in artist_paths:
        event['path'] = artist_paths[event['title']]

# 更新したJSONを保存
with open('server/events.json', 'w', encoding='utf-8') as f:
    json.dump(events_data, f, ensure_ascii=False, indent=2)

print("イベントのパスを更新しました") 