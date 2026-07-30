from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from backend import f1_service, predictions_service
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
async def get_events(year: int, response: Response):
    """Get F1 race calendar for a given season."""
    if not (1950 <= year <= 2030):
        raise HTTPException(status_code=400, detail="Year must be between 1950 and 2030")
    # Cache for 1 hour — race calendars don't change frequently
    response.headers["Cache-Control"] = "public, max-age=3600"
    try:
        return f1_service.get_events(year)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/telemetry/{year}/{round_number}/{session_type}")
async def get_telemetry(year: int, round_number: int, session_type: str, response: Response):
    """Get race telemetry frames for replay engine."""
    if not (1950 <= year <= 2030):
        raise HTTPException(status_code=400, detail="Year must be between 1950 and 2030")
    if not (1 <= round_number <= 25):
        raise HTTPException(status_code=400, detail="Round must be between 1 and 25")
    if session_type not in ['R', 'Q', 'S', 'FP1', 'FP2', 'FP3']:
        raise HTTPException(status_code=400, detail="Invalid session type")
    # Cache for 24 hours — historical telemetry doesn't change
    response.headers["Cache-Control"] = "public, max-age=86400"
    try:
        data = f1_service.get_race_telemetry_json(year, round_number, session_type)
        if data is None:
            raise HTTPException(status_code=404, detail="No telemetry data found for this session")
        return data
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/predictions/{year}/{round_number}")
async def get_predictions(year: int, round_number: int, response: Response):
    """Get ML-predicted race finishing order."""
    if not (1950 <= year <= 2030):
        raise HTTPException(status_code=400, detail="Year must be between 1950 and 2030")
    if not (1 <= round_number <= 25):
        raise HTTPException(status_code=400, detail="Round must be between 1 and 25")
    # Cache for 12 hours — predictions may be updated as race approaches
    response.headers["Cache-Control"] = "public, max-age=43200"
    try:
        return predictions_service.get_prediction(year, round_number)
    except (KeyError, ValueError) as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
