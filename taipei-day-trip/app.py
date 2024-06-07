import mysql.connector
import os
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, FileResponse

load_dotenv()
DATABASE_HOST = os.getenv("DB_HOST")
DATABASE_USER = os.getenv("DB_USER")
DATABASE_PASSWORD = os.getenv("DB_PASSWORD")
DATABASE_NAME = os.getenv("DB_NAME")

# 初始化連接
mydb = mysql.connector.connect(host=DATABASE_HOST,
                               user=DATABASE_USER,
                               password=DATABASE_PASSWORD,
                               database=DATABASE_NAME,
                               charset='utf8mb4')

mycursor = mydb.cursor()

app = FastAPI()


# Static Pages (Never Modify Code in this Block)
@app.get("/", include_in_schema=False)
async def index(request: Request):
    return FileResponse("./static/index.html", media_type="text/html")


@app.get("/attraction/{id}", include_in_schema=False)
async def attraction(request: Request, id: int):
    return FileResponse("./static/attraction.html", media_type="text/html")


@app.get("/booking", include_in_schema=False)
async def booking(request: Request):
    return FileResponse("./static/booking.html", media_type="text/html")


@app.get("/thankyou", include_in_schema=False)
async def thankyou(request: Request):
    return FileResponse("./static/thankyou.html", media_type="text/html")


# Task 1-2
# 第一支API
@app.get("/api/attractions", response_model=dict)
async def page_keyword(request: Request,
                       page: int = 0,
                       size: int = 12,
                       keyword: str = None):
    offset = page * size

    where_clause = ""
    params = []

    if keyword:
        where_clause += "WHERE mrt = %s OR name LIKE %s"
        params.extend([keyword, f"%{keyword}%"])

    sql = f"SELECT * from attraction {where_clause} LIMIT {size} OFFSET {offset}"

    try:
        mycursor.execute(sql, params)

        myresults = mycursor.fetchall()

        if not myresults:
            return {"nextPage": None, "data": []}
        else:
            attractions = []

            for myresult in myresults:
                images = myresult[9]
                images = [images]
                print(type(images))  # list，這樣一來要取出單張圖片應該就沒問題了！

                attraction = {
                    "id": myresult[0],
                    "name": myresult[1],
                    "category": myresult[2],
                    "description": myresult[3],
                    "address": myresult[4],
                    "transport": myresult[5],
                    "mrt": myresult[6],
                    "latitude": myresult[7],
                    "longitude": myresult[8],
                    "images": images,
                }
                attractions.append(attraction)

            # 計算查詢總筆數
            if keyword:
                total_sql = f"SELECT COUNT(*) FROM attraction {where_clause}"
                mycursor.execute(total_sql, params)
            else:
                total_sql = "SELECT COUNT(*) FROM attraction"
                mycursor.execute(total_sql, [])
            total_records = mycursor.fetchone()[0]
            # 若沒有設定[0]，結果將是(總筆數)

            # 根據當前頁數和總資料數決定nextPage的值
            if total_records % size > 0:
                total_pages = total_records // size + 1
            else:
                total_pages = total_records // size

            # 判斷下一頁的值是否為空，若為空，則此頁是最後一頁或超出最後一頁
            if page >= total_pages - 1:
                next_page = None
            else:
                next_page = page + 1

            # next_page = None if page >= total_pages - 1 else page + 1

            return {"nextPage": next_page, "data": attractions}

    except Exception as err:
        return JSONResponse(content={
            "error": True,
            "message": f"內部伺服器或與資料庫連接錯誤: {str(err)}"
        },
                            status_code=500)


# 第二支API
@app.get("/api/attraction/{attractionId}", response_model=dict)
async def query_attraction_id(attractionId: int):

    sql = "SELECT * from attraction Where id = %s"

    try:
        mycursor.execute(sql, (attractionId, ))

        myresult = mycursor.fetchone()

        if not myresult:
            return JSONResponse(content={
                "error": True,
                "message": "景點編號不正確"
            },
                                status_code=400)
        else:
            images = myresult[9]
            images = [images]
            return {
                "data": {
                    "id": myresult[0],
                    "name": myresult[1],
                    "category": myresult[2],
                    "description": myresult[3],
                    "address": myresult[4],
                    "transport": myresult[5],
                    "mrt": myresult[6],
                    "latitude": myresult[7],
                    "longitude": myresult[8],
                    "images": images,
                }
            }

    except Exception as err:
        return JSONResponse(content={
            "error": True,
            "message": f"內部伺服器或與資料庫連接錯誤: {str(err)}"
        },
                            status_code=500)


# 第三支API
@app.get("/api/mrts", response_model=dict)
async def desc_mrt_count():
    sql = "SELECT mrt, COUNT(*) as count FROM attraction WHERE mrt IS NOT NULL GROUP BY mrt ORDER by count DESC"

    try:
        mycursor.execute(sql)

        mrts = mycursor.fetchall()
        # fetchall()的結果的資料結構為[(mrt,count), (mrt, count), ... ,(mrt, count)]

        mrts_list = []
        for mrt in mrts:
            mrts_list.append(mrt[0])
        return {"data": mrts_list}

    except Exception as err:
        return JSONResponse(content={
            "error": True,
            "message": f"內部伺服器或與資料庫連接錯誤: {str(err)}"
        },
                            status_code=500)


if __name__ == "__main__":
    import uvicorn  # 這行也可以寫在本檔最頂
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
