"""WeChat Style Distiller.

A local-first pipeline that turns your own WeChat history into a profile of how
you actually talk — and a persona prompt that lets an LLM reply like you.

Stages:
    extract  -> pull messages out of WeChat (via chatlog) into JSON
    clean    -> keep only *your* messages, build a tidy dataset
    analyze  -> quantitative stats (length, emoji, phrases, code-switching...)
    distill  -> a Markdown style profile + a ready-to-use persona prompt
    chat     -> a CLI bot that talks like you, using the prompt + few-shot

Your chat data never leaves your machine and is never committed to git.
"""

__version__ = "0.1.0"
