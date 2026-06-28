"""Generate a synthetic chatlog-shaped JSON file — entirely fictional.

This exists so the pipeline can be run, tested and demoed publicly without any
real chat data. Run:  python examples/make_sample.py
"""
from __future__ import annotations

import json
import random
from pathlib import Path

random.seed(42)

CONTACTS = [
    ("Leo_wxid", "Leo", False),
    ("Mia_wxid", "Mia", False),
    ("lab-group@chatroom", "Lab Group", True),
]

# "me" replies — casual, bilingual, short bursts, emoji, laughter, catchphrases
MY_LINES = [
    "哈哈哈对", "确实", "在的在的", "稍等我看下", "ok 我马上弄", "卧槽 真的假的",
    "嗯嗯 没问题", "我觉得可以试试", "今晚有空一起吃饭吗", "deadline 是周五对吧",
    "我先 push 一下代码", "这个 bug 我来 fix", "笑死 哈哈哈", "好的好的~",
    "感觉 model 还能再 tune 一下", "我跑了下 baseline，acc 0.82", "晚点回你哈",
    "可以可以", "等我喝个咖啡先 ☕", "嗯 这个 idea 不错", "我也是这么想的",
    "233 太真实了", "明天再说吧 困了", "收到~", "我这边 notebook 跑着呢",
    "要不我们开个会？", "嗯嗯嗯", "对对对就是这个意思", "稳",
]
THEIR_LINES = [
    "在吗", "这个 dataset 你处理好了没", "周五交得完吗", "晚上吃啥",
    "帮我看下这段代码", "model 效果怎么样", "开会吗今天", "哈哈哈你又熬夜了",
    "那个 paper 看了吗", "结果出来了吗", "在干嘛", "记得 commit 啊",
]

records: list[dict] = []
t = 1_700_000_000  # fixed base time

for _ in range(140):
    talker, name, is_group = random.choice(CONTACTS)
    # a little back-and-forth
    for _ in range(random.randint(1, 2)):
        records.append({
            "talker": talker, "talkerName": name, "isChatRoom": is_group,
            "isSelf": False, "senderName": name,
            "time": t, "type": 1, "content": random.choice(THEIR_LINES),
        })
        t += random.randint(20, 200)
    # my reply, sometimes multiple bubbles in a row
    for _ in range(random.choices([1, 2, 3], weights=[6, 3, 1])[0]):
        records.append({
            "talker": talker, "talkerName": name, "isChatRoom": is_group,
            "isSelf": True, "senderName": "me",
            "time": t, "type": 1, "content": random.choice(MY_LINES),
        })
        t += random.randint(5, 60)
    # occasional non-text noise that should get filtered out
    if random.random() < 0.2:
        records.append({
            "talker": talker, "talkerName": name, "isChatRoom": is_group,
            "isSelf": True, "senderName": "me",
            "time": t, "type": 3, "content": "[图片]",
        })
        t += 30

out = Path(__file__).with_name("sample_chatlog.json")
out.write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"wrote {len(records)} synthetic records -> {out}")
