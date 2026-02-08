import random
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
            return w
    return None


def _pick_distractors(*, correct_word: Word, exclude_ids: Set[int], k: int = 3) -> List[Word]:
    distractors: List[Word] = []
    local_exclude = set(exclude_ids)
    local_exclude.add(correct_word.id)

    def take_from_queryset(qs, need: int):
        nonlocal distractors, local_exclude
        if need <= 0:
            return 0
        candidates = list(qs.exclude(id__in=local_exclude).values_list("id", flat=True)[: need * 20])
        random.shuffle(candidates)
        picked = []
        for wid in candidates:
            if wid not in local_exclude:
                picked.append(wid)
                local_exclude.add(wid)
            if len(picked) >= need:
                break
        if picked:
            ws = list(Word.objects.filter(id__in=picked))
            distractors.extend(ws)
        return len(picked)

    if correct_word.category_id:
        take_from_queryset(
            Word.objects.filter(is_deleted=False, category_id=correct_word.category_id),
            k - len(distractors)
        )

    while len(distractors) < k:
        w = _pick_random_word_excluding(local_exclude)
        if not w:
            break
        distractors.append(w)
        local_exclude.add(w.id)

    return distractors[:k]


def build_mcq_for_word(*, word: Word, exclude_option_texts: Optional[Set[str]] = None) -> Dict:
    if exclude_option_texts is None:
        exclude_option_texts = set()

    correct = {"word_id": word.id, "text": (word.persian or "").strip()}
    if not correct["text"]:
        raise ValueError("Word has empty persian")

    distractors = _pick_distractors(correct_word=word, exclude_ids=set(), k=3)

    options = [correct] + [{"word_id": w.id, "text": (w.persian or "").strip()} for w in distractors]
    options = [o for o in options if o["text"]]

    uniq = {}
    for o in options:
        t = o["text"].strip()
        if t not in uniq and t not in exclude_option_texts:
            uniq[t] = o

    options = list(uniq.values())
    while len(options) < 4:
        extra = _pick_random_word_excluding({word.id} | {o["word_id"] for o in options if "word_id" in o})
        if not extra:
            break
        t = (extra.persian or "").strip()
        if t and t not in uniq and t not in exclude_option_texts:
            o = {"word_id": extra.id, "text": t}
            uniq[t] = o
            options.append(o)

    options = options[:4]
    random.shuffle(options)

    return {
        "prompt": (word.english or "").strip(),
        "word_id": word.id,
        "options": options,
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
