from pathlib import Path
text = Path("src/views/PaymentMethodsView.vue").read_text(encoding="utf-8")
substr = "    addHint: ' ',\r\n"
print(substr in text)
