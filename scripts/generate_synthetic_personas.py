#!/usr/bin/env python3
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""Generate rich synthetic personas for the methodology showcase.

Creates 6 personas with varied linguistic characteristics:
- Message length distributions (short/medium/long)
- Code-switching patterns (EN-only, ZH-only, mixed)
- Emoji usage (rare/moderate/heavy)
- Conversational styles (concise, expressive, technical)

Each persona gets 150+ messages with realistic turn-taking and variation.
Then runs the original pipeline to generate profile.md, persona_prompt.txt and stats.json.
"""
import json
import random
import subprocess
import sys
from pathlib import Path

random.seed(42)

# Persona definitions
PERSONAS = [
    {
        "id": "bilingual_early_adopter",
        "name": "Bilingual Early Adopter",
        "desc": "Tech-savvy, EN/ZH code-switching 40%, emoji-heavy, casual tone",
        "avg_length": 25,
        "code_switch_ratio": 0.4,
        "emoji_rate": 0.3,
        "style": "casual_tech",
    },
    {
        "id": "concise_mandarin",
        "name": "Concise Mandarin",
        "desc": "ZH only, short messages (8-15 chars), rare emoji, formal punctuation",
        "avg_length": 12,
        "code_switch_ratio": 0.0,
        "emoji_rate": 0.05,
        "style": "formal_zh",
    },
    {
        "id": "expressive_english",
        "name": "Expressive English",
        "desc": "EN only, long messages (40-80 chars), reaction emoji, casual punctuation",
        "avg_length": 60,
        "code_switch_ratio": 1.0,  # 100% EN
        "emoji_rate": 0.25,
        "style": "expressive_en",
    },
    {
        "id": "balanced_bilingual",
        "name": "Balanced Bilingual",
        "desc": "EN/ZH 50/50, medium length, moderate emoji, professional tone",
        "avg_length": 35,
        "code_switch_ratio": 0.5,
        "emoji_rate": 0.15,
        "style": "professional",
    },
    {
        "id": "emoji_enthusiast",
        "name": "Emoji Enthusiast",
        "desc": "ZH primary, heavy emoji (50%+ messages), short bursts, playful",
        "avg_length": 18,
        "code_switch_ratio": 0.1,
        "emoji_rate": 0.6,
        "style": "playful_zh",
    },
    {
        "id": "technical_researcher",
        "name": "Technical Researcher",
        "desc": "EN-heavy code-switching, long analytical messages, minimal emoji, jargon",
        "avg_length": 55,
        "code_switch_ratio": 0.7,
        "emoji_rate": 0.08,
        "style": "academic",
    },
]

# Message templates per style
TEMPLATES = {
    "casual_tech": {
        "zh": [
            "哈哈哈对", "确实", "在的在的", "稍等我看下", "卧槽 真的假的", "嗯嗯 没问题",
            "我觉得可以试试", "今晚有空吗", "晚点回你哈", "可以可以", "嗯 这个 idea 不错",
            "我也是这么想的", "233 太真实了", "明天再说吧 困了", "收到~", "嗯嗯嗯",
            "对对对就是这个意思", "稳", "好的好的~", "笑死 哈哈哈", "感觉还行",
        ],
        "en": [
            "ok I'll check it out", "push the code now", "this bug I'll fix",
            "baseline acc 0.82", "model could use more tuning", "deadline is Friday right",
            "let me grab a coffee first", "notebook is running", "wanna have a meeting",
            "yeah that makes sense", "sounds good", "will do", "on it",
            "testing it now", "works on my machine lol", "deployed to staging",
        ],
        "mixed": [
            "ok 我马上弄", "deadline 是周五对吧", "我先 push 一下代码", "这个 bug 我来 fix",
            "感觉 model 还能再 tune 一下", "我跑了下 baseline，acc 0.82", "我这边 notebook 跑着呢",
            "要不我们开个会？", "明天 meeting 几点", "code review 完了吗",
        ],
        "emoji": ["😂", "👍", "😅", "🤔", "✨", "🔥", "☕", "💻", "🚀", "👌"],
    },
    "formal_zh": {
        "zh": [
            "好的，我知道了。", "明白了，谢谢。", "收到，稍后回复。", "已处理完毕。",
            "请问还有其他问题吗？", "我会尽快完成。", "了解，我这边会跟进。",
            "没问题，按计划进行。", "好的，我们保持联系。", "谢谢提醒。",
            "明白，我会注意。", "收到通知。", "已阅。", "好的，辛苦了。",
            "清楚了，感谢说明。", "我稍后确认一下。", "明天见。", "已完成。",
        ],
        "emoji": ["[微笑]", "[OK]"],
    },
    "expressive_en": {
        "en": [
            "omg that's hilarious 😂", "honestly I can't believe it happened",
            "wait are you serious?? that's wild", "I'm dying laughing right now hahaha",
            "no way!! that's insane", "lmaooo I'm dead 💀",
            "that's actually so funny though", "I mean yeah I totally get what you mean",
            "oh for sure, that makes sense!", "right??? exactly what I was thinking!",
            "ugh I know the feeling", "aww that's so sweet 🥺",
            "yesss you got this!! 💪", "ngl that's pretty impressive",
            "wait hold on let me think about this...", "okay so here's the thing though",
        ],
        "emoji": ["😂", "💀", "🥺", "💪", "✨", "🔥", "😭", "👀", "🎉", "💕"],
    },
    "professional": {
        "zh": [
            "我同意这个方案。", "需要进一步讨论细节。", "这个方向值得探索。",
            "我会准备相关材料。", "建议我们先做个调研。", "时间安排上有些紧张。",
            "可以分享一下你的想法吗？", "我们需要明确分工。", "进度基本符合预期。",
        ],
        "en": [
            "Let's schedule a meeting to discuss this.", "I'll prepare the presentation.",
            "Could you share the latest data?", "We need to align on priorities.",
            "The timeline looks reasonable.", "I'll follow up with the team.",
            "Let's review the proposal together.", "I think we should consider alternatives.",
        ],
        "mixed": [
            "我会准备 presentation。", "需要 review 一下 data。",
            "timeline 看起来没问题。", "我们 align 一下 priorities。",
            "可以分享下最新的 update 吗？", "这个 proposal 值得讨论。",
        ],
        "emoji": ["👍", "📊", "📝", "✅"],
    },
    "playful_zh": {
        "zh": [
            "哈哈哈哈哈", "太好笑了", "笑死我了", "真的吗", "哇", "好棒",
            "耶", "加油", "冲鸭", "嘻嘻", "嘿嘿", "哼", "嗯哼",
            "好的呀", "知道啦", "收到收到", "okk", "嗯嗯", "是的是的",
        ],
        "emoji": ["😂", "🤣", "😆", "😊", "😋", "🥰", "😍", "🤗", "👻", "🎉", "✨", "💕", "🌈", "🍕", "🎈"],
    },
    "academic": {
        "en": [
            "Based on the preliminary results, the hypothesis seems plausible.",
            "I think we need to validate this with additional experiments.",
            "The methodology aligns with standard practices in the field.",
            "Could you clarify the assumptions behind this model?",
            "I've reviewed the literature and found several relevant papers.",
            "The error bars indicate significant uncertainty in these measurements.",
            "Let's discuss the implications of these findings in our next meeting.",
            "I'm working on revising the draft based on your feedback.",
            "The data quality is crucial for drawing reliable conclusions.",
        ],
        "mixed": [
            "我看了下 literature，有几篇 relevant papers。",
            "需要 validate 一下这个 hypothesis。",
            "这个 model 的 assumptions 是什么？",
            "data quality 对结论很关键。",
            "我在 revise draft，根据你的 feedback。",
        ],
        "emoji": [],
    },
}

def generate_message(persona_def: dict) -> str:
    """Generate one message for this persona."""
    style = persona_def["style"]
    templates = TEMPLATES[style]

    # Decide language based on code_switch_ratio
    cs_ratio = persona_def["code_switch_ratio"]
    if "en" not in templates:
        lang = "zh"
    elif "zh" not in templates:
        lang = "en"
    else:
        # cs_ratio is the fraction of EN
        r = random.random()
        if r < cs_ratio * 0.5:
            lang = "en"
        elif r < cs_ratio * 0.5 + (1 - cs_ratio) * 0.5:
            lang = "zh"
        else:
            lang = "mixed"

    # Pick a template
    if lang in templates:
        msg = random.choice(templates[lang])
    else:
        msg = random.choice(templates.get("zh", templates.get("en", ["嗯"])))

    # Add emoji?
    if random.random() < persona_def["emoji_rate"]:
        emoji_list = templates["emoji"]
        if emoji_list:
            msg += " " + random.choice(emoji_list)

    # Randomly add laughter or repetition to vary length
    target_len = persona_def["avg_length"]
    if len(msg) < target_len * 0.7:
        # Pad with laughter or repetition
        if random.random() < 0.3:
            msg += " 哈哈" * random.randint(1, 2)
        elif random.random() < 0.3 and "嗯" in msg:
            msg += "嗯" * random.randint(1, 2)

    return msg

def generate_persona_chatlog(persona_def: dict, n_turns: int = 80) -> list[dict]:
    """Generate a synthetic chatlog for one persona."""
    records = []
    t = 1_700_000_000

    contacts = [
        ("friend_wxid", "Friend", False),
        ("colleague_wxid", "Colleague", False),
        ("group@chatroom", "Study Group", True),
    ]

    for _ in range(n_turns):
        talker, name, is_group = random.choice(contacts)

        # Their message (generic prompts)
        their_msg = random.choice([
            "在吗", "怎么样", "有空吗", "看到了吗", "你觉得呢",
            "能帮我看下吗", "进度如何", "还好吗", "明天见？",
        ])
        records.append({
            "talker": talker, "talkerName": name, "isChatRoom": is_group,
            "isSelf": False, "senderName": name,
            "time": t, "type": 1, "content": their_msg,
        })
        t += random.randint(30, 300)

        # My reply (persona-specific), sometimes multiple bubbles
        n_bubbles = random.choices([1, 2, 3], weights=[6, 3, 1])[0]
        for _ in range(n_bubbles):
            my_msg = generate_message(persona_def)
            records.append({
                "talker": talker, "talkerName": name, "isChatRoom": is_group,
                "isSelf": True, "senderName": "me",
                "time": t, "type": 1, "content": my_msg,
            })
            t += random.randint(10, 120)

    return records

def main():
    repo_root = Path(__file__).parent.parent
    data_dir = repo_root / "data"
    data_dir.mkdir(exist_ok=True)

    web_data_dir = repo_root / "web" / "public" / "data" / "personas"
    web_data_dir.mkdir(parents=True, exist_ok=True)

    original_dir = repo_root / "original"

    print(f"Generating {len(PERSONAS)} synthetic personas...")

    for persona_def in PERSONAS:
        persona_id = persona_def["id"]
        print(f"\n=== {persona_def['name']} ({persona_id}) ===")

        # Generate chatlog
        chatlog = generate_persona_chatlog(persona_def, n_turns=80)
        chatlog_path = data_dir / f"{persona_id}_chatlog.json"
        chatlog_path.write_text(json.dumps(chatlog, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"  ✓ Generated {len(chatlog)} messages → {chatlog_path}")

        # Run the original pipeline
        output_dir = data_dir / f"{persona_id}_output"
        output_dir.mkdir(exist_ok=True)

        cmd = [
            sys.executable, "-m", "wechat_style_distiller.cli", "run",
            "--input", str(chatlog_path),
            "--out", str(output_dir),
            "--name", persona_def["name"],
            "--no-llm",  # Skip LLM calls
        ]

        print(f"  Running pipeline: {' '.join(cmd[2:])}")
        result = subprocess.run(cmd, cwd=original_dir, capture_output=True, text=True)

        if result.returncode != 0:
            print(f"  ✗ Pipeline failed:")
            print(result.stderr)
            continue

        print(f"  ✓ Pipeline complete")

        # Copy outputs to web/public/data/personas/
        persona_web_dir = web_data_dir / persona_id
        persona_web_dir.mkdir(exist_ok=True)

        files_to_copy = ["profile.md", "persona_prompt.txt", "stats.json"]
        for fname in files_to_copy:
            src = output_dir / fname
            if src.exists():
                dst = persona_web_dir / fname
                dst.write_text(src.read_text(encoding="utf-8"), encoding="utf-8")
                print(f"  ✓ Copied {fname} → {dst}")

        # Write metadata
        metadata = {
            "id": persona_id,
            "name": persona_def["name"],
            "description": persona_def["desc"],
            "characteristics": {
                "avgLength": persona_def["avg_length"],
                "codeSwitchRatio": persona_def["code_switch_ratio"],
                "emojiRate": persona_def["emoji_rate"],
                "style": persona_def["style"],
            },
        }
        metadata_path = persona_web_dir / "metadata.json"
        metadata_path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")
        print(f"  ✓ Wrote metadata → {metadata_path}")

    print(f"\n✅ All personas generated → {web_data_dir}")
    print(f"\nTo view the web app, run:")
    print(f"  cd {repo_root / 'web'}")
    print(f"  pnpm dev")

if __name__ == "__main__":
    main()
