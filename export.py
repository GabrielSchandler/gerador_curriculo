import json, sys, tempfile, os
from docx import Document
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

data = json.load(sys.stdin)
text = data.get('resume', '').encode('utf-8', 'replace').decode('utf-8')
base = os.path.join(tempfile.gettempdir(), 'curriculo_vagas_' + data.get('id', 'preview'))
docx_path, pdf_path = base + '.docx', base + '.pdf'
doc = Document()
for line in text.splitlines():
    if line.startswith('# '): doc.add_heading(line[2:], 0)
    elif line.startswith('## '): doc.add_heading(line[3:], 1)
    elif line.startswith('### '): doc.add_heading(line[4:], 2)
    elif line.startswith('- '): doc.add_paragraph(line[2:], style='List Bullet')
    elif line.strip() and not line.startswith('> '): doc.add_paragraph(line)
doc.save(docx_path)
c = canvas.Canvas(pdf_path, pagesize=A4)
width, height = A4; x, y = 48, height - 54
for line in text.splitlines():
    if line.startswith('# '): c.setFont('Helvetica-Bold', 18)
    elif line.startswith('## '): c.setFont('Helvetica-Bold', 13)
    elif line.startswith('### '): c.setFont('Helvetica-Bold', 11)
    else: c.setFont('Helvetica', 10)
    clean = line.lstrip('#- >').strip()
    for part in [clean[i:i+105] for i in range(0, max(len(clean), 1), 105)]:
        if y < 48: c.showPage(); y = height - 54
        c.drawString(x, y, part); y -= 15
c.save()
print(json.dumps({'docx': docx_path, 'pdf': pdf_path}))
