# Toolchain for the Roomtone build: Python + reportlab for the cheat sheet,
# Node for the MIDI exporters, and metric-compatible fonts so the PDF renders
# without the macOS system fonts.
FROM python:3.12-slim-bookworm

RUN apt-get update && apt-get install -y --no-install-recommends \
        make \
        nodejs \
        fonts-liberation \
        fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY Makefile ./
COPY work/ ./work/
COPY repositories/ ./repositories/

CMD ["make", "all"]
