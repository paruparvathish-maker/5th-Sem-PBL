import uvicorn
import sys
import os

if __name__ == "__main__":
    # Ensure current dir is in sys.path
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    print("=========================================================")
    print("  Starting PBL Portal FastAPI Backend Server")
    print("  Host: http://127.0.0.1:8000")
    print("  Swagger API Docs: http://127.0.0.1:8000/docs")
    print("  ReDoc: http://127.0.0.1:8000/redoc")
    print("=========================================================")
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)

