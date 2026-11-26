# Roomtone music-learning studio — build pipeline.
#
#   work/site-assets/*.{js,css} + work/site-template.html  ─┐
#   music-cheat-sheet.pdf, window-seat.mid (base64)         ├─► index.html
#                                                           ┘
# Every target can be run from anywhere; the scripts resolve their own paths.

SHELL   := /bin/bash
PROJECT := repositories/music-learning
PYTHON  ?= python3
NODE    ?= node
PORT    ?= 8080

.DEFAULT_GOAL := all
.PHONY: all site pdf midi beats package verify check qa qa-tools serve clean \
        docker-image docker-build docker-serve docker-shell shot help

## all: regenerate every artifact and refresh outputs/
all: pdf midi beats site package

## site: inline CSS, JS, PDF and MIDI into the single-file index.html
site:
	$(PYTHON) work/build_site.py

## pdf: render the three-page A4 cheat sheet (needs reportlab)
pdf:
	$(PYTHON) work/make_sheet.py

## midi: export the 16-bar example song from sound.js
midi:
	$(NODE) work/export_midi.js

## beats: export the 37 genre beat templates from templates.js
beats:
	$(NODE) work/export_beats.js

## package: mirror the site into outputs/ and rebuild the delivery zip
package:
	$(PYTHON) work/package.py

## check: verify generated MIDI still matches what is committed (no writes)
check:
	$(NODE) work/export_beats.js --check

## verify: confirm the built index.html really contains every source asset
verify:
	$(PYTHON) work/verify_build.py

## qa-tools: compile the WebKit screenshot and assertion harnesses (macOS only)
qa-tools: work/qa/render work/qa/qa-live

work/qa/render: work/qa/render.m
	clang $< -o $@ -framework Cocoa -framework WebKit -Wno-deprecated-declarations

work/qa/qa-live: work/qa/qa-live.m
	clang $< -o $@ -framework Cocoa -framework WebKit -Wno-deprecated-declarations

## qa: run both headless interaction suites against the built site (macOS only)
qa: qa-tools
	./work/qa/qa-live $(PWD)/$(PROJECT)/index.html $(PWD)/work/qa/final/home.png 1280 $(PWD)/work/qa/check-upgrade.js
	./work/qa/qa-live $(PWD)/$(PROJECT)/index.html $(PWD)/work/qa/final/freestyle-parts.png 1280 $(PWD)/work/qa/check-freestyle.js

## shot: screenshot a route, e.g. make shot ROUTE=freestyle WIDTH=1280
shot: qa-tools
	./work/qa/render $(PWD)/$(PROJECT)/index.html $(PWD)/work/qa/final/$(ROUTE).png $(WIDTH)

## serve: preview the built site at http://localhost:$(PORT)
serve:
	@echo "Serving $(PROJECT) at http://localhost:$(PORT) — Ctrl-C to stop"
	@cd $(PROJECT) && $(PYTHON) -m http.server $(PORT)

## docker-image: build the container that holds the whole toolchain
docker-image:
	docker compose build

## docker-build: run the full pipeline inside the container
docker-build:
	docker compose run --rm build

## docker-serve: serve the built site from the container at http://localhost:$(PORT)
docker-serve:
	docker compose up site

## docker-shell: open a shell in the toolchain container
docker-shell:
	docker compose run --rm build bash

## clean: remove generated outputs and compiled QA binaries
clean:
	rm -rf outputs/music-learning outputs/music-learning.zip work/qa/render work/qa/qa-live

## help: list the available targets
help:
	@grep -E '^## ' $(MAKEFILE_LIST) | sed -E 's/^## ([a-z-]+): /  make \1\t/' | expand -t 20
