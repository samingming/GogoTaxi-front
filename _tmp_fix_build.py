from pathlib import Path
path = Path('src/views/RoomDetailView.vue')
text = path.read_text(encoding='utf-8')
marker = 'function buildUberDeepLink'
start = text.find(marker)
if start == -1:
    raise SystemExit('start not found')
end = text.find('function resolveAuthToken', start)
if end == -1:
    raise SystemExit('end not found')
new_fn = """function buildUberDeepLink(room: RoomPreview | null | undefined, clientId?: string) {
  if (!room?.departure?.position || !room?.arrival?.position) return ''
  const params = new URLSearchParams({
    action: 'setPickup',
    'pickup[latitude]': String(room.departure.position.lat),
    'pickup[longitude]': String(room.departure.position.lng),
    'dropoff[latitude]': String(room.arrival.position.lat),
    'dropoff[longitude]': String(room.arrival.position.lng),
  })

  if (room.departure.label) params.set('pickup[nickname]', room.departure.label)
  if (room.arrival.label) params.set('dropoff[nickname]', room.arrival.label)
  if (clientId) params.set('client_id', clientId)

  return `https://m.uber.com/ul/?${params.toString()}`
}

"""
path.write_text(text[:start] + new_fn + text[end:], encoding='utf-8')
print('updated buildUberDeepLink')
