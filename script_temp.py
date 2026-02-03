from pathlib import Path
path = Path('frontend-sigmma/src/Resultados.jsx')
text = path.read_text(encoding='utf-8')
text = text.replace('\r\n', '\n')
