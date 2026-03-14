from pydantic_settings import BaseSettings
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    # OpenAI
    openai_api_key: str = ""

    # Database
    database_url: str = "sqlite:///./explainmydecision.db"

    # Model
    model_path: str = str(BASE_DIR / "models/trained/best_model.joblib")

    # MLflow
    mlflow_tracking_uri: str = str(BASE_DIR / "mlruns")

    # Logging
    log_level: str = "INFO"

    # Clerk (auth) — added in Week 4
    clerk_frontend_api: str = ""
    clerk_secret_key: str = ""

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
```

---

### Step 4 — Create `.env.example`

New file at the root called `.env.example`:
```
OPENAI_API_KEY=your_openai_api_key_here
DATABASE_URL=sqlite:///./explainmydecision.db
MLFLOW_TRACKING_URI=./mlruns
MODEL_PATH=./models/trained/best_model.joblib
LOG_LEVEL=INFO
CLERK_FRONTEND_API=your-app.clerk.accounts.dev
CLERK_SECRET_KEY=sk_test_...
```

---

### Step 5 — Update `.gitignore`

Open the existing `.gitignore` and add these lines at the bottom:
```
# Environment
.env
.venv/
venv/

# Python
__pycache__/
*.pyc
*.pyo
*.egg-info/
dist/
.pytest_cache/

# Models & data
*.joblib
*.pkl
mlruns/
data/raw/*
data/processed/*
!data/raw/.gitkeep
!data/processed/.gitkeep

# Database
*.db
*.sqlite

# OS
.DS_Store

# Node
node_modules/
frontend/dist/