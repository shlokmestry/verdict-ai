from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from api.database import Base, engine
from api.routes import predict
from config.settings import settings

Base.metadata.create_all(bind=engine)

app = FastAPI(title="ExplainMyDecision API", version="1.0.0", docs_url="/docs")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(predict.router)

@app.get("/health")
async def health():
    model_path = Path(settings.model_path)
    name_file  = Path("models/trained/best_model_name.txt")
    return {
        "status": "ok",
        "model_loaded": model_path.exists(),
        "model_version": name_file.read_text().strip() if name_file.exists() else "unknown",
        "db_connected": True,
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api.main:app", host="0.0.0.0", port=8000, reload=True)