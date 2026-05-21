from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from backend import f1_service
import uvicorn

app = FastAPI(title="F1 Race Replay API")

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/events/{year}")
async def get_events(year: int):
    try:
        return f1_service.get_events(year)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/telemetry/{year}/{round_number}/{session_type}")
async def get_telemetry(year: int, round_number: int, session_type: str):
    try:
        data = f1_service.get_race_telemetry_json(year, round_number, session_type)
        if data is None:
            raise HTTPException(status_code=404, detail="No telemetry data found for this session")
        return data
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
