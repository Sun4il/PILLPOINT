#!/usr/bin/env python3

import contextlib
import io
import json
import re
import sys
from pathlib import Path
from statistics import mean

import easyocr

STOP_WORDS = {
    'rx', 'take', 'tablet', 'tablets', 'tab', 'tabs', 'cap', 'caps', 'capsule', 'capsules',
    'syrup', 'susp', 'suspension', 'injection', 'inj', 'drops', 'drop', 'ointment', 'cream',
    'gel', 'apply', 'daily', 'morning', 'night', 'before', 'after', 'food', 'dose', 'dosage',
    'and', 'with', 'for', 'to', 'mg', 'mcg', 'ml', 'iu', 'unit', 'units', 'po', 'od', 'bd',
    'bid', 'tid', 'qid', 'hs', 'once', 'twice', 'thrice', 'per', 'every', 'at', 'the', 'of',
    'a', 'an', 'in', 'on', 'from', 'use', 'take', 'tablet(s)', 'capsule(s)', 'tablet', 'cap',
    'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'half',
    'quarter', 'meal', 'meals', 'day', 'days', 'week', 'weeks', 'month', 'months'
}

MEDICINE_ALLOWLIST = {
    'paracetamol', 'azithromycin', 'cetirizine', 'amoxicillin', 'omeprazole', 'vitamin', 'vitaminc',
    'ibuprofen', 'metformin', 'atorvastatin', 'aspirin', 'montelukast', 'aceclofenac', 'diclofenac',
    'cotrimoxazole', 'crocin', 'dolo', 'combiflam', 'pan', 'pantoprazole', 'rabeprazole', 'lansoprazole',
}

VARIANT_WORDS = {'p', 'plus', 'sr', 'xl', 'ds', 'forte'}

DOCTOR_WORDS = {
    'doctor', 'dr', 'name', 'patient', 'age', 'sex', 'male', 'female', 'prescription',
    'medicine', 'medication', 'date', 'address', 'reg', 'registration', 'history',
    'diagnosis', 'advice', 'follow', 'review', 'signature', 'stamp', 'hospital', 'clinic',
    'report', 'reports', 'test', 'tests', 'lab', 'labs', 'blood', 'urine', 'bp', 'weight',
    'height', 'dob', 'mobile', 'phone', 'contact'
}

FORM_WORDS = {
    'tablet', 'tablets', 'tab', 'tabs', 'cap', 'caps', 'capsule', 'capsules', 'syrup', 'susp',
    'suspension', 'injection', 'inj', 'ointment', 'cream', 'gel', 'drops', 'drop', 'lotion',
    'spray', 'solution', 'softgel', 'sachet'
}

COMMON_NON_MEDICINE_WORDS = {
    'pain', 'fever', 'cold', 'cough', 'body', 'headache', 'vomiting', 'nausea', 'diarrhea',
    'constipation', 'pressure', 'sugar', 'infection', 'allergy', 'allergies', 'asthma', 'skin',
    'sleep', 'rest', 'water', 'food', 'meal', 'morning', 'evening', 'night', 'afternoon',
    'today', 'tomorrow', 'yesterday', 'doctor', 'patient', 'prescribed', 'medicine', 'medication',
    'painkiller', 'painkillers', 'antibiotic', 'antibiotics', 'antihistamine', 'antihistamines',
    'antacid', 'antacids', 'supplement', 'supplements'
}

MEDICINE_SUFFIXES = (
    'mab', 'pril', 'sartan', 'olol', 'statin', 'prazole', 'cillin', 'mycin', 'vir', 'azole',
    'tidine', 'dine', 'caine', 'floxacin', 'fenac', 'nide', 'semide', 'thiazide', 'oxetine',
    'dipine', 'parin', 'sone', 'done', 'lamide'
)

SEGMENT_SPLIT_RE = re.compile(r'\s*(?:[,+;/|&]|\band\b)\s*', re.IGNORECASE)
DOSAGE_RE = re.compile(r'\b(?P<value>\d+(?:\.\d+)?)\s?(?P<unit>mg|mcg|g|ml|iu|units?)\b', re.IGNORECASE)
FREQUENCY_RE = re.compile(
    r'\b(?:\d+(?:-\d+){1,3}|once|twice|thrice|daily|bid|bd|tid|qid|hs|morning|night|noon|bedtime)\b',
    re.IGNORECASE,
)
DURATION_RE = re.compile(r'\b\d+\s?(?:days?|weeks?|months?)\b', re.IGNORECASE)


def normalize_fragment(text: str) -> str:
    return re.sub(r'\s+', ' ', re.sub(r'[^\w\s./+\-]', ' ', text or '')).strip()


def format_dosage(match: re.Match[str] | None) -> str:
    if not match:
        return ''
    return f"{match.group('value')} {match.group('unit').lower()}"


def looks_like_medicine_word(word: str) -> bool:
    normalized = re.sub(r'[^a-z0-9]', '', word.lower())
    if not normalized:
        return False

    if normalized in MEDICINE_ALLOWLIST:
        return True

    return any(normalized.endswith(suffix) for suffix in MEDICINE_SUFFIXES)


def count_vowels(word: str) -> int:
    return len(re.findall(r'[aeiou]', word.lower()))


def extract_candidate(segment: str) -> dict | None:
    text = normalize_fragment(segment)
    if not text:
        return None

    lowered = text.lower()
    if lowered.startswith(('dr ', 'dr.', 'doctor ')):
        return None
    if lowered in DOCTOR_WORDS:
        return None

    cut_points = []
    for regex in (DOSAGE_RE, FREQUENCY_RE, DURATION_RE):
        match = regex.search(text)
        if match:
            cut_points.append(match.start())

    prefix = text[:min(cut_points)] if cut_points else text
    tokens = re.findall(r"[A-Za-z][A-Za-z0-9'.-]*", prefix)

    if not tokens:
        return None

    normalized_tokens = [re.sub(r'[^a-z0-9]', '', token.lower()) for token in tokens]
    meaningful_tokens = [token for token in normalized_tokens if token]

    if not meaningful_tokens:
        return None

    if any(token in DOCTOR_WORDS or token in COMMON_NON_MEDICINE_WORDS for token in meaningful_tokens):
        if not any(looks_like_medicine_word(token) for token in meaningful_tokens):
            return None

    name_tokens: list[str] = []
    for token in tokens:
      lowered_token = token.lower().strip("'.-")
      if not lowered_token:
          continue
      if lowered_token in STOP_WORDS or lowered_token in DOCTOR_WORDS:
          if name_tokens:
              break
          continue
      if lowered_token in {'mg', 'mcg', 'g', 'ml', 'iu', 'unit', 'units', 'dose', 'dosage'}:
          if name_tokens:
              break
          continue
      if any(lowered_token == form for form in FORM_WORDS):
          if name_tokens:
              break
          continue
      if token.isdigit():
          if name_tokens:
              break
          continue

      if token.isupper() or token[:1].isupper() or len(token) == 1:
          name_tokens.append(token)
      else:
          name_tokens.append(token.capitalize())

      if len(name_tokens) >= 4:
          break

    if not name_tokens:
        return None

    dosage = format_dosage(DOSAGE_RE.search(text))
    frequency_match = FREQUENCY_RE.search(text)
    duration_match = DURATION_RE.search(text)
    frequency = frequency_match.group(0).lower() if frequency_match else ''
    duration = duration_match.group(0).lower() if duration_match else ''

    if len(name_tokens) == 2:
        first_token = re.sub(r'[^a-z0-9]', '', name_tokens[0].lower())
        second_token = re.sub(r'[^a-z0-9]', '', name_tokens[1].lower())
        if second_token in VARIANT_WORDS:
            if first_token not in MEDICINE_ALLOWLIST and not looks_like_medicine_word(first_token) and count_vowels(first_token) < 2:
                return None
        elif not dosage and not frequency and not duration:
            if first_token not in MEDICINE_ALLOWLIST and not looks_like_medicine_word(first_token):
                return None

    if len(name_tokens) == 1:
        candidate_word = re.sub(r'[^a-z0-9]', '', name_tokens[0].lower())
        if candidate_word in COMMON_NON_MEDICINE_WORDS:
            return None
        if any(char.isdigit() for char in candidate_word):
            return None
        if not dosage and not frequency and not duration and candidate_word not in MEDICINE_ALLOWLIST and not looks_like_medicine_word(candidate_word):
            return None

    candidate = {
        'name': ' '.join(name_tokens).strip(),
    }

    if dosage:
        candidate['dosage'] = dosage
    if frequency:
        candidate['frequency'] = re.sub(r'\s+', ' ', frequency).strip()
    if duration:
        candidate['duration'] = re.sub(r'\s+', ' ', duration).strip()

    return candidate


def dedupe_medicines(medicines: list[dict]) -> list[dict]:
    seen: set[tuple[str, str, str, str]] = set()
    unique_medicines: list[dict] = []

    for medicine in medicines:
        name = str(medicine.get('name', '')).strip()
        dosage = str(medicine.get('dosage', '')).strip()
        frequency = str(medicine.get('frequency', '')).strip()
        duration = str(medicine.get('duration', '')).strip()

        if not name:
            continue

        key = (name.lower(), dosage.lower(), frequency.lower(), duration.lower())
        if key in seen:
            continue

        seen.add(key)
        unique_medicines.append({
            'name': name,
            **({'dosage': dosage} if dosage else {}),
            **({'frequency': frequency} if frequency else {}),
            **({'duration': duration} if duration else {}),
        })

    return unique_medicines


def extract_payload(image_path: Path) -> dict:
    with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
        reader = easyocr.Reader(['en'], gpu=False, verbose=False)
        ocr_results = reader.readtext(str(image_path), detail=1, paragraph=False)

    lines: list[str] = []
    confidences: list[float] = []
    medicines: list[dict] = []

    for bbox, text, confidence in ocr_results:
        cleaned = normalize_fragment(text)
        if not cleaned:
            continue

        lines.append(cleaned)
        try:
            confidences.append(float(confidence))
        except (TypeError, ValueError):
            pass

        for segment in SEGMENT_SPLIT_RE.split(cleaned):
            candidate = extract_candidate(segment)
            if candidate:
                medicines.append(candidate)

    return {
        'provider': 'easyocr',
        'lines': lines,
        'fullText': ' '.join(lines).strip(),
        'confidence': round(mean(confidences), 3) if confidences else None,
        'medicines': dedupe_medicines(medicines),
    }


def main() -> int:
    if len(sys.argv) < 2:
        print('Usage: easyocr_reader.py <image-path>', file=sys.stderr)
        return 1

    image_path = Path(sys.argv[1])
    if not image_path.exists():
        print(f'Image file not found: {image_path}', file=sys.stderr)
        return 1

    try:
        payload = extract_payload(image_path)
    except Exception as exc:  # noqa: BLE001
        print(str(exc), file=sys.stderr)
        return 1

    json.dump(payload, sys.stdout, ensure_ascii=False)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())