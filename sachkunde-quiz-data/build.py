import re, json, sys, pathlib
import pymupdf

Q_PDF = 'Sachkundefragen-neu-ab-01.01.2025.pdf'
L_PDF = 'Sachkundefragen-Loesungen-neu-ab-01.01.2025.pdf'
OUT = pathlib.Path('sachkunde-quiz-data')
IMG = OUT / 'images'
IMG.mkdir(parents=True, exist_ok=True)

# ---------- answer key ----------
lines = [l.strip() for p in pymupdf.open(L_PDF) for l in p.get_text().splitlines()]
lines = [l for l in lines if l]
key = {}
for i, l in enumerate(lines[:-1]):
    if re.fullmatch(r'\d{1,3}', l) and re.fullmatch(r'[A-D](\s*[,.]\s*[A-D])*', lines[i + 1]):
        key[int(l)] = re.findall(r'[A-D]', lines[i + 1])

# ---------- questions ----------
SECTIONS = ["Ausdrucksverhalten Bilder", "Ausdrucksverhalten Fragen", "Rassen", "Hund und Kind",
            "Umgang und Verständnis", "Training", "Strafen", "Hundewahl", "Hundebegegnungen", "Aufzucht",
            "Hilfsmittel", "Probleme – Verständnis", "Probleme – Ursachen und Vorbeugen", "Probleme – Maßnahmen",
            "Rechtliches", "Haltung", "Gesundheit", "Geschlechter", "Krankheiten", "Öffentlichkeit"]
norm = lambda s: re.sub(r'[\s\-–]+', ' ', s).strip().lower()
SEC_NORM = {norm(f"{i+1} {t}"): (i + 1, t) for i, t in enumerate(SECTIONS)}

doc = pymupdf.open(Q_PDF)
qlines = []
for pno, page in enumerate(doc):
    for l in page.get_text().splitlines():
        if l.strip():
            qlines.append((pno, l.strip()))

questions, cur, sec, target = [], None, None, None

def add_text(s):
    global target
    if target is None:
        return
    obj, field = target
    old = obj[field]
    if not old:
        obj[field] = s
    elif old.endswith('-') and s[:1].islower() and not old.endswith(' -'):
        obj[field] = old[:-1] + s
    elif old.endswith('-'):
        obj[field] = old + s
    else:
        obj[field] = old + ' ' + s

for pno, l in qlines:
    if norm(l) in SEC_NORM:
        sec = SEC_NORM[norm(l)]
        target = None
        continue
    m = re.match(r'^(\d{1,3})\s*(.*)$', l)
    if m and int(m.group(1)) in key and int(m.group(1)) not in {q['number'] for q in questions} \
            and not re.match(r'^\d+\s*(°|kg|cm|Monat|Woche|Sek|Minut|Stund|Tag)', l):
        cur = {'number': int(m.group(1)), 'sectionId': sec[0], 'section': sec[1],
               'question': '', 'options': [], 'page': pno + 1}
        questions.append(cur)
        target = (cur, 'question')
        if m.group(2):
            add_text(m.group(2))
        continue
    m = re.match(r'^([A-D])\.\s+(.*)$', l)
    if m and cur is not None:
        expected = 'ABCD'[len(cur['options'])] if len(cur['options']) < 4 else None
        if m.group(1) == expected:
            opt = {'id': m.group(1), 'text': ''}
            cur['options'].append(opt)
            target = (opt, 'text')
            add_text(m.group(2))
            continue
    add_text(l)

# ---------- images (picture questions) ----------
img_for = {}
for pno in range(2):
    page = doc[pno]
    infos = sorted(page.get_image_info(xrefs=True), key=lambda x: x['bbox'][1])
    pqs = [q for q in questions if q['page'] == pno + 1]
    assert len(infos) == len(pqs), (pno, len(infos), len(pqs))
    for q, info in zip(pqs, infos):
        fname = f"frage-{q['number']:03d}.png"
        pix = page.get_pixmap(clip=pymupdf.Rect(info['bbox']) + (3, 1, -1, -1), dpi=300)
        pix.save(IMG / fname)
        img_for[q['number']] = {'src': f"images/{fname}", 'width': pix.width, 'height': pix.height}

# ---------- assemble ----------
out_q = []
for q in questions:
    q['question'] = re.sub(r'\s+', ' ', q['question']).strip()
    q['question'] = re.sub(r'\s+([?.,])', r'\1', q['question'])
    for o in q['options']:
        o['text'] = re.sub(r'\s+', ' ', o['text']).strip()
    correct = key[q['number']]
    out_q.append({
        'id': f"q{q['number']:03d}",
        'number': q['number'],
        'categoryId': q['sectionId'],
        'question': q['question'],
        'image': img_for.get(q['number']),
        'options': [{'id': o['id'], 'text': o['text'], 'correct': o['id'] in correct} for o in q['options']],
        'correctAnswers': correct,
        'multipleCorrect': len(correct) > 1,
    })

cats = [{'id': i + 1, 'name': t, 'questionCount': sum(1 for q in out_q if q['categoryId'] == i + 1)}
        for i, t in enumerate(SECTIONS)]
data = {
    'meta': {
        'title': 'Sachkundenachweis Hund NRW – Fragenkatalog',
        'validFrom': '2025-01-01',
        'language': 'de',
        'questionCount': len(out_q),
        'note': 'Mehrfachauswahl möglich: 1–4 Antworten richtig. Eine Frage gilt nur als richtig, wenn genau alle richtigen Optionen gewählt wurden.',
    },
    'categories': cats,
    'questions': out_q,
}
(OUT / 'questions.json').write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')

# ---------- checks ----------
nums = {q['number'] for q in out_q}
print('questions', len(out_q), 'key', len(key))
print('missing in questions', sorted(set(key) - nums))
for q in out_q:
    ids = [o['id'] for o in q['options']]
    if ids not in (list('ABCD'), list('AB')):
        print('OPTION ISSUE', q['number'], ids)
    if not set(q['correctAnswers']) <= set(ids):
        print('KEY ISSUE', q['number'])
print({c['name']: c['questionCount'] for c in cats})
