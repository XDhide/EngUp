# syntax=docker/dockerfile:1
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 \
    PIP_DEFAULT_TIMEOUT=300 PIP_RETRIES=10 PIP_DISABLE_PIP_VERSION_CHECK=1
WORKDIR /srv

COPY requirements.txt .
# cache pip: nếu mạng đứt giữa chừng, chạy lại sẽ KHÔNG tải lại những gói đã tải xong
RUN --mount=type=cache,target=/root/.cache/pip pip install -r requirements.txt

COPY app ./app
RUN useradd -m appuser && mkdir -p /srv/models && chown -R appuser /srv
USER appuser

ENV MODEL_PATH=/srv/models/recall_model.joblib
EXPOSE 8000
HEALTHCHECK --interval=10s --timeout=3s --start-period=30s --retries=5 \
  CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/health').status==200 else 1)"

# Model (recall_model.joblib) được mount vào /srv/models qua docker-compose
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
