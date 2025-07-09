from fastapi import FastAPI, Response, HTTPException
from fastapi.responses import HTMLResponse, PlainTextResponse, FileResponse
from pydantic import BaseModel
from typing import List, Optional

import sqlite3
import os
import uvicorn

app = FastAPI()

BASE_DIR = os.path.dirname(__file__)
DB_PATH = os.path.join(BASE_DIR, "data.db")


class Quake(BaseModel):
    id: Optional[int] = None
    date: str
    location: str
    magnitude: float
    depth: Optional[int] = None
    intensity: Optional[str] = None


def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def initialize_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS quakes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            location TEXT NOT NULL,
            magnitude REAL NOT NULL,
            depth INTEGER,
            intensity TEXT
        )
        """
    )
    conn.commit()
    conn.close()


@app.get("/quakes", response_model=List[Quake])
def read_quakes():
    conn = get_db_connection()
    items = conn.execute("SELECT * FROM quakes ORDER BY date DESC").fetchall()
    conn.close()
    return [Quake(**dict(item)) for item in items]


@app.post("/quakes", response_model=Quake, status_code=201)
def create_quake(item: Quake):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO quakes (date, location, magnitude, depth, intensity) VALUES (?, ?, ?, ?, ?)",
        (item.date, item.location, item.magnitude, item.depth, item.intensity),
    )
    conn.commit()
    item_id = cursor.lastrowid
    conn.close()
    return Quake(
        id=item_id,
        date=item.date,
        location=item.location,
        magnitude=item.magnitude,
        depth=item.depth,
        intensity=item.intensity,
    )


@app.delete("/quakes/{quake_id}", status_code=204)
def delete_quake(quake_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM quakes WHERE id = ?", (quake_id,))
    conn.commit()
    deleted = cursor.rowcount
    conn.close()
    if deleted == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return Response(status_code=204)


@app.get("/image.jpg")
def get_image_jpg():
    image_path = os.path.join(BASE_DIR, "image.jpg")
    if not os.path.exists(image_path):
        raise HTTPException(status_code=404, detail="Not found")
    return FileResponse(image_path, media_type="image/jpeg")

@app.get("/image2.jpg")
def get_image2_jpg():
    image_path = os.path.join(BASE_DIR, "image2.jpg")
    if not os.path.exists(image_path):
        raise HTTPException(status_code=404, detail="Not found")
    return FileResponse(image_path, media_type="image/jpeg")


# ここから下は書き換えない
@app.get("/", response_class=HTMLResponse)
async def read_html():
    html_file_path = os.path.join(BASE_DIR, "client.html")
    with open(html_file_path, "r", encoding="utf-8") as f:
        html_content = f.read()
    return HTMLResponse(content=html_content, status_code=200)


@app.get("/style.css")
def read_css():
    css_file_path = os.path.join(BASE_DIR, "style.css")
    with open(css_file_path, "r", encoding="utf-8") as f:
        css_content = f.read()
    return Response(content=css_content, media_type="text/css")


@app.get("/script.js", response_class=PlainTextResponse)
def read_js():
    js_file_path = os.path.join(BASE_DIR, "script.js")
    with open(js_file_path, "r", encoding="utf-8") as f:
        js_content = f.read()
    return PlainTextResponse(
        content=js_content, status_code=200, media_type="application/javascript"
    )


@app.get("/favicon.ico")
def read_favicon():
    favicon_path = os.path.join(BASE_DIR, "favicon.ico")
    with open(favicon_path, "rb") as f:
        favicon_content = f.read()
    return Response(content=favicon_content, media_type="image/x-icon")


if __name__ == "__main__":
    initialize_db()
    uvicorn.run("server:app", host="127.0.0.1", port=8000, reload=True, workers=1)