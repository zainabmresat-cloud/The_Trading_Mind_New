"""Launcher script for The Trading Mind Analytics backend."""

import uvicorn

if __name__ == "__main__":
    print("Starting The Trading Mind Analytics API on http://127.0.0.1:8000 ...")
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8000, reload=True)
