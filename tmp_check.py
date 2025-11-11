from pathlib import Path
text = Path("src/views/PaymentMethodsView.vue").read_text(encoding="utf-8")
substr = "    addHint: '���� ���� ī�带 ����ϼ���',\r\n"
print(substr in text)
