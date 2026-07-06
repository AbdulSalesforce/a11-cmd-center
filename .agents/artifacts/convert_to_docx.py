#!/usr/bin/env python3
"""Convert DEPLOYMENT_GUIDE.md to .docx format"""

from docx import Document
from docx.shared import Pt, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
import re

def parse_table(lines, start_idx):
    """Parse markdown table and return rows, end index"""
    rows = []
    idx = start_idx

    while idx < len(lines) and lines[idx].strip().startswith('|'):
        row = [cell.strip() for cell in lines[idx].split('|')[1:-1]]
        rows.append(row)
        idx += 1

        # Skip separator row
        if len(rows) == 1 and idx < len(lines) and '---' in lines[idx]:
            idx += 1

    return rows, idx - 1

def add_table_to_doc(doc, rows):
    """Add table to document"""
    if len(rows) < 2:
        return

    table = doc.add_table(rows=len(rows), cols=len(rows[0]))
    table.style = 'Light Grid Accent 1'

    for i, row_data in enumerate(rows):
        row = table.rows[i]
        for j, cell_data in enumerate(row_data):
            cell = row.cells[j]
            cell.text = cell_data

            # Bold header row
            if i == 0:
                for paragraph in cell.paragraphs:
                    for run in paragraph.runs:
                        run.bold = True

def add_paragraph_with_formatting(doc, line):
    """Add paragraph handling inline markdown formatting"""
    if not line.strip():
        doc.add_paragraph()
        return

    # Handle bold text
    if '**' in line:
        p = doc.add_paragraph()
        parts = line.split('**')
        for idx, part in enumerate(parts):
            run = p.add_run(part)
            if idx % 2 == 1:  # Odd indices are bold
                run.bold = True
        return p

    return doc.add_paragraph(line)

# Read markdown file
md_path = r"C:\Users\jonathan.bell\Desktop\a11y-audit-tool\.agents\artifacts\DEPLOYMENT_GUIDE.md"
with open(md_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Create document
doc = Document()

# Set default font
style = doc.styles['Normal']
font = style.font
font.name = 'Calibri'
font.size = Pt(11)

lines = content.split('\n')
i = 0

while i < len(lines):
    line = lines[i]

    # Skip empty lines
    if not line.strip():
        doc.add_paragraph()
        i += 1
        continue

    # Main title (H1)
    if line.startswith('# ') and not line.startswith('## '):
        h = doc.add_heading(line[2:], level=1)
        h.alignment = WD_ALIGN_PARAGRAPH.LEFT

    # Headings
    elif line.startswith('## '):
        doc.add_heading(line[3:], level=2)

    elif line.startswith('### '):
        doc.add_heading(line[4:], level=3)

    elif line.startswith('#### '):
        doc.add_heading(line[5:], level=4)

    # Horizontal rule
    elif line.strip() == '---':
        p = doc.add_paragraph()
        p.add_run('_' * 80)

    # Tables
    elif line.strip().startswith('|'):
        rows, end_idx = parse_table(lines, i)
        add_table_to_doc(doc, rows)
        i = end_idx

    # Bullet lists
    elif line.strip().startswith('- ') and not line.strip().startswith('- ['):
        text = line.strip()[2:]
        doc.add_paragraph(text, style='List Bullet')

    # Numbered lists
    elif line.strip() and line.strip()[0].isdigit() and '. ' in line:
        text = line.strip().split('. ', 1)[1]
        doc.add_paragraph(text, style='List Number')

    # Checkboxes
    elif line.strip().startswith('- [ ]'):
        text = '☐ ' + line.strip()[5:].strip()
        doc.add_paragraph(text, style='List Bullet')

    elif line.strip().startswith('- [x]') or line.strip().startswith('- [X]'):
        text = '☑ ' + line.strip()[5:].strip()
        doc.add_paragraph(text, style='List Bullet')

    # Code blocks
    elif line.strip().startswith('```'):
        code_lines = []
        i += 1
        while i < len(lines) and not lines[i].strip().startswith('```'):
            code_lines.append(lines[i])
            i += 1

        if code_lines:
            code_text = '\n'.join(code_lines)
            p = doc.add_paragraph(code_text)
            p.style = 'No Spacing'
            for run in p.runs:
                run.font.name = 'Courier New'
                run.font.size = Pt(9)

    # Regular paragraph with formatting
    else:
        add_paragraph_with_formatting(doc, line)

    i += 1

# Save document
output_path = r"C:\Users\jonathan.bell\Desktop\a11y-audit-tool\.agents\artifacts\DEPLOYMENT_GUIDE.docx"
doc.save(output_path)

print(f"Document saved to: {output_path}")
print(f"  Total paragraphs: {len(doc.paragraphs)}")
print(f"  Total tables: {len(doc.tables)}")
