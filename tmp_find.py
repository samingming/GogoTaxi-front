from pathlib import Path
import re
text = Path("src/views/PaymentMethodsView.vue").read_text(encoding="utf-8")
match = re.search(r"addHint: '([^']*)'", text)
print(match.group(0) if match else 'not found')
