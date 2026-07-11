FROM python:3.11-slim AS api

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY agent ./agent
COPY tools ./tools
COPY models ./models
COPY api ./api
COPY data ./data
COPY pytest.ini .
COPY tests ./tests

ENV PYTHONPATH=/app
EXPOSE 8000
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
