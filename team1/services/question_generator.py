import random
import re
from typing import Iterable, List, Dict, Set, Optional

from django.db.models import Min, Max
from team1.models import Word, UserWord


def _word_bounds():
    agg = Word.objects.filter(is_deleted=False).aggregate(min_id=Min("id"), max_id=Max("id"))
    return (agg["min_id"] or 1), (agg["max_id"] or 1)


def _pick_random_word_excluding(exclude_ids: Set[int]) -> Optional[Word]:
    min_id, max_id = _word_bounds()
    if min_id > max_id:
        return None

    for _ in range(40):
        rid = random.randint(min_id, max_id)

        w = (
            Word.objects
            .filter(is_deleted=False, id__gte=rid)
            .exclude(id__in=exclude_ids)
            .order_by("id")
            .first()
        )

        if not w:
            w = (
                Word.objects
                .filter(is_deleted=False, id__lt=rid)
                .exclude(id__in=exclude_ids)
                .order_by("-id")
                .first()
            )

        if w and w.english and w.persian:
            if re.search(r'[\u0600-\u06FF]', w.english):
                continue

            return w

    return None


def _pick_distractors(*, correct_word: Word, exclude_ids: Set[int], k: int = 3) -> List[Word]:
    distractors: List[Word] = []
    local_exclude_ids = set(exclude_ids)
    local_exclude_ids.add(correct_word.id)

    seen_texts = set()
    if correct_word.persian:
        seen_texts.add(correct_word.persian.strip())

    def take_from_queryset(qs, need: int):
        nonlocal distractors, local_exclude_ids, seen_texts
        if need <= 0:
            return 0

        candidates_ids = list(qs.exclude(id__in=local_exclude_ids).values_list("id", flat=True)[: need * 50])

        if not candidates_ids:
            return 0

        random.shuffle(candidates_ids)
        picked_count = 0

        candidate_objs = list(Word.objects.filter(id__in=candidates_ids[:need * 5]))
        random.shuffle(candidate_objs)

        for w in candidate_objs:
            if w.id in local_exclude_ids:
                continue

            if not w.english or not w.persian:
                continue
            if re.search(r'[\u0600-\u06FF]', w.english):
                continue

            text = w.persian.strip()
            if text in seen_texts:
                local_exclude_ids.add(w.id)
                continue

            distractors.append(w)
            local_exclude_ids.add(w.id)
            seen_texts.add(text)
            picked_count += 1

            if picked_count >= need:
                break

        return picked_count

    if correct_word.category_id:
        needed = k - len(distractors)
        take_from_queryset(
            Word.objects.filter(is_deleted=False, category_id=correct_word.category_id),
            needed
        )

    attempts = 0
    while len(distractors) < k and attempts < 100:
        attempts += 1
        w = _pick_random_word_excluding(local_exclude_ids)
        if not w:
            break

        text = (w.persian or "").strip()

        if text in seen_texts:
            local_exclude_ids.add(w.id)
            continue

        distractors.append(w)
        local_exclude_ids.add(w.id)
        seen_texts.add(text)

    return distractors[:k]


def build_mcq_for_word(*, word: Word, exclude_option_texts: Optional[Set[str]] = None) -> Dict:
    if exclude_option_texts is None:
        exclude_option_texts = set()

    correct_text = (word.persian or "").strip()
    correct = {"word_id": word.id, "text": correct_text}

    if not correct["text"]:
        raise ValueError("Word has empty persian")

    # اینجا ۳ گزینه غلط را می‌گیریم. خود تابع _pick_distractors تضمین می‌کند
    # که متن فارسی آن‌ها با `word` و با یکدیگر تکراری نباشد.
    distractors = _pick_distractors(correct_word=word, exclude_ids=set(), k=3)

    options = [correct] + [{"word_id": w.id, "text": (w.persian or "").strip()} for w in distractors]

    # شافل کردن نهایی گزینه‌ها
    random.shuffle(options)

    # اگر به هر دلیلی (که الان بعید است) کمتر از ۴ گزینه شد، اینجا پر می‌کنیم
    # (این بخش به عنوان مکانیزم دفاعی نهایی باقی می‌ماند)
    uniq_texts = {o["text"] for o in options}
    excluded_ids_final = {word.id} | {o["word_id"] for o in options if "word_id" in o}

    while len(options) < 4:
        extra = _pick_random_word_excluding(excluded_ids_final)
        if not extra:
            break
        t = (extra.persian or "").strip()

        if t and t not in uniq_texts and t not in exclude_option_texts:
            options.append({"word_id": extra.id, "text": t})
            uniq_texts.add(t)
            excluded_ids_final.add(extra.id)

    return {
        "prompt": (word.english or "").strip(),
        "word_id": word.id,
        "options": options[:4],  # مطمئن شویم دقیقاً ۴ تاست
        "answer_word_id": word.id,
    }


def build_quiz_questions_for_user(*, user_id, count: int) -> List[Dict]:
    word_ids = list(
        UserWord.objects
        .filter(is_deleted=False, user_id=user_id)
        .values_list("word_id", flat=True)
        .distinct()
    )

    if len(word_ids) == 0:
        return []

    if count > len(word_ids):
        count = len(word_ids)

    chosen_ids = random.sample(word_ids, k=count)
    words = list(Word.objects.filter(is_deleted=False, id__in=chosen_ids))

    by_id = {w.id: w for w in words}
    ordered_words = [by_id[i] for i in chosen_ids if i in by_id]

    questions: List[Dict] = []
    for w in ordered_words:
        q = build_mcq_for_word(word=w)
        questions.append(q)

    return questions


def build_game_questions(*, count: int, used_word_ids: Optional[Set[int]] = None) -> List[Dict]:
    if used_word_ids is None:
        used_word_ids = set()

    questions: List[Dict] = []
    attempts = 0
    while len(questions) < count and attempts < count * 60:
        attempts += 1
        w = _pick_random_word_excluding(used_word_ids)
        if not w:
            break
        try:
            q = build_mcq_for_word(word=w)
        except ValueError:
            used_word_ids.add(w.id)
            continue

        used_word_ids.add(w.id)
        questions.append(q)

    return questions
