.PHONY: help sample demo test install lint clean

help:
	@echo "make install   - install optional deps (jieba, anthropic)"
	@echo "make sample    - generate synthetic sample chat data"
	@echo "make demo      - run the full pipeline on the sample (no API key needed)"
	@echo "make test      - run the test suite"
	@echo "make clean     - remove generated output (keeps your data/)"

install:
	python -m pip install -e ".[full,dev]"

sample:
	python examples/make_sample.py

demo: sample
	python -m wechat_style_distiller.cli run \
		--input examples/sample_chatlog.json \
		--out output/samples --name "Sample User" --no-llm

test:
	python -m pytest -q

lint:
	ruff check .

clean:
	rm -rf output/*.md output/*.txt output/*.json output/*.jsonl
