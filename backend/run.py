import uvicorn
import os
import sys

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    port = int(os.getenv("PORT", "8000"))
    host = os.getenv("HOST", "0.0.0.0")
    print(f"Starting ShortsMania backend server on http://{host}:{port}")
    is_dev = os.getenv("ENVIRONMENT") == "development"
    uvicorn.run("app.main:app", host=host, port=port, reload=is_dev)
