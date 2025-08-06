from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.ollama_course import router
from routes.mock_course import router as mock_router
from routes.genai_course import router as genai_router
from routes.mock_genai_course import router as mock_genai_router
from routes.studio_router import router as studio_router
app = FastAPI()

origins = [
    "*",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
app.include_router(mock_router)
app.include_router(genai_router)
app.include_router(mock_genai_router)
app.include_router(studio_router)


