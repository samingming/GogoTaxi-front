from pathlib import Path
path = Path('src/views/RoomDetailView.vue')
text = path.read_text(encoding='utf-8')
start = text.find('const participants = computed(() => {')
end = text.find('const participantCount', start)
if start == -1 or end == -1:
    raise SystemExit('markers not found')
new_block = """const participants = computed(() => {
  if (participantsRaw.value.length) {
    return participantsRaw.value.map((mate, index) => ({
      id: mate.id || `participant-${index}`,
      name: mate.email ?? mate.name ?? `Member ${index + 1}`,
      role: mate.id === hostId.value ? 'Host' : mate.role,
      seat: mate.seatNumber ?? null,
      initials: toInitials(
        mate.email ?? mate.name ?? mate.id ?? `${index + 1}`,
        `${index + 1}`,
      ),
    }))
  }
  if (membership.value) {
    return [
      {
        id: membership.value.roomId,
        name: 'ME',
        role: undefined,
        seat: membership.value.seatNumber ?? null,
        initials: membership.value.seatNumber
          ? membership.value.seatNumber.toString()
          : 'ME',
      },
    ]
  }
  return []
})
"""
path.write_text(text[:start] + new_block + text[end:], encoding='utf-8')
print('done')
