import mysql.connector
import os
from dotenv import load_dotenv
from fastapi import FastAPI, Request, Depends
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from passlib.context import CryptContext
import jwt
from jwt.exceptions import InvalidTokenError
from datetime import datetime, timedelta, timezone

load_dotenv()
DATABASE_HOST = os.getenv("DB_HOST")
DATABASE_USER = os.getenv("DB_USER")
DATABASE_PASSWORD = os.getenv("DB_PASSWORD")
DATABASE_NAME = os.getenv("DB_NAME")

app = FastAPI()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = 10800

# 掛載靜態文件
app.mount("/static", StaticFiles(directory="static"), name="static")

# 初始化加密上下文
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# Task 5 新增
class AuthException(Exception):

    def __init__(self, message: str, status_code: int):
        self.message = message
        self.status_code = status_code


@app.exception_handler(AuthException)
async def auth_exception_handler(request: Request, exc: AuthException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "message": exc.message
        },
    )


def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(
            timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_user_status(request: Request):
    Authorization = request.headers.get("Authorization")
    print("Authorization: ", Authorization)  # Authorization:  Bearer null

    token = Authorization[len("Bearer "):]
    print("token: ", token)  # token:  null

    if token == "null":
        raise AuthException("未登入系統，拒絕存取", 403)

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("id")
        name = payload.get("name")
        email = payload.get("email")

        if not user_id or not name or not email:
            print("decode no")
            raise AuthException("未登入系統，拒絕存取", 403)
        return user_id

    except InvalidTokenError:
        raise AuthException("無效的Token", 401)

    except Exception as err:
        raise AuthException(f"內部伺服器或與資料庫連接錯誤: {str(err)}", 500)


# Task 5
@app.get("/api/booking", response_model=dict)
async def check_my_tour(request: Request,
                        user_id: int = Depends(get_user_status)):
    sql = """
    SELECT attraction.id AS attraction_id, attraction.name, attraction.address, attraction.images, 
           booking.date, booking.time, booking.price
    FROM booking
    JOIN attraction ON booking.attraction_id = attraction.id
    WHERE booking.user_id = %s;
    """

    try:
        mydb = mysql.connector.connect(host=DATABASE_HOST,
                                       user=DATABASE_USER,
                                       password=DATABASE_PASSWORD,
                                       database=DATABASE_NAME,
                                       charset='utf8mb4')

        cursor = mydb.cursor(dictionary=True)

        with cursor as mycursor:
            mycursor.execute(sql, (user_id, ))
            result = mycursor.fetchone()

        if not result:
            return JSONResponse(content={"data": None}, status_code=200)

        # 將日期對象轉換成字符串格式
        result["date"] = result["date"].strftime("%Y-%m-%d")

        # 取出第一張圖片
        result["images"] = result["images"].split(",")[0]

        response_data = {
            "data": {
                "attraction": {
                    "id": result["attraction_id"],
                    "name": result["name"],
                    "address": result["address"],
                    "image": result["images"]
                },
                "date": result["date"],
                "time": result["time"],
                "price": result["price"]
            }
        }

        print(response_data)
        return JSONResponse(content=response_data, status_code=200)

    except Exception as err:
        return JSONResponse(content={
            "error": True,
            "message": f"內部伺服器或與資料庫連接錯誤: {str(err)}"
        },
                            status_code=500)


@app.post("/api/booking", response_model=dict)
async def book_my_tour(request: Request,
                       user_id: int = Depends(get_user_status)):

    if not user_id:
        return JSONResponse(content={
            "error": True,
            "message": "未登入系統，拒絕存取"
        },
                            status_code=403)

    data = await request.json()
    attraction_id = data.get("attractionId")
    date = data.get("date")
    time = data.get("time")
    price = data.get("price")

    if not attraction_id or not date or not time or not price:
        return JSONResponse(content={
            "error": True,
            "message": "建立失敗，輸入不正確或其他原因"
        },
                            status_code=400)

    sql = "SELECT * FROM booking WHERE user_id = %s"

    try:
        mydb = mysql.connector.connect(host=DATABASE_HOST,
                                       user=DATABASE_USER,
                                       password=DATABASE_PASSWORD,
                                       database=DATABASE_NAME,
                                       charset='utf8mb4')

        cursor = mydb.cursor()

        with cursor as mycursor:
            mycursor.execute(sql, (user_id, ))
            myresult = mycursor.fetchone()
            print(myresult)

            if not myresult:
                sql = """
    INSERT INTO booking (user_id, attraction_id, date, time, price)
    VALUES (%s, %s, %s, %s, %s)
    """
                mycursor.execute(sql,
                                 (user_id, attraction_id, date, time, price))
            else:
                sql = """
    UPDATE booking 
    SET attraction_id=%s, date=%s, time=%s, price=%s
    WHERE user_id=%s
    """
                mycursor.execute(sql,
                                 (attraction_id, date, time, price, user_id))
            mydb.commit()
            print(mycursor.rowcount, "record inserted.")

            return JSONResponse(content={"ok": True}, status_code=200)

    except Exception as err:
        return JSONResponse(content={
            "error": True,
            "message": f"內部伺服器或與資料庫連接錯誤: {str(err)}"
        },
                            status_code=500)


@app.delete("/api/booking", response_model=dict)
async def delete_my_tour(request: Request,
                         user_id: int = Depends(get_user_status)):
    sql = "DELETE FROM booking WHERE user_id = %s"

    try:
        mydb = mysql.connector.connect(host=DATABASE_HOST,
                                       user=DATABASE_USER,
                                       password=DATABASE_PASSWORD,
                                       database=DATABASE_NAME,
                                       charset='utf8mb4')

        cursor = mydb.cursor()

        with cursor as mycursor:
            mycursor.execute(sql, (user_id, ))
            mydb.commit()

            if mycursor.rowcount != 0:
                return JSONResponse(content={"ok": True}, status_code=200)

    except Exception as err:
        return JSONResponse(content={
            "error": True,
            "message": f"內部伺服器或與資料庫連接錯誤: {str(err)}"
        },
                            status_code=500)


# Task 4
@app.get("/api/user/auth", response_model=dict)
async def signup_status(request: Request):
    Authorization = request.headers.get("Authorization")
    # print("Authorization: ", Authorization)  # Authorization:  Bearer null

    token = Authorization[len("Bearer "):]
    # print("token: ", token)  # token:  null

    if token == "null":
        # print("null token:", token)
        return JSONResponse(content={"data": None}, status_code=200)

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("id")
        name = payload.get("name")
        email = payload.get("email")

        if not user_id or not name or not email:
            return JSONResponse(content={"data": None}, status_code=200)

        response_data = {"data": {"id": user_id, "name": name, "email": email}}

        return JSONResponse(content=response_data, status_code=200)

    except InvalidTokenError:
        return JSONResponse(content={"error": "無效的Token"},
                            status_code=401)  # Unauthorized
    except Exception as e:
        return JSONResponse(content={"error": str(e)},
                            status_code=500)  # Internal Server Error


# 登入
@app.put("/api/user/auth", response_model=dict)
async def signup(request: Request):
    data = await request.json()
    print(data)

    email = data.get("email")
    password = data.get("password")

    sql = "SELECT id, name, email, password FROM member WHERE BINARY email = %s"

    try:
        # 初始化連接
        mydb = mysql.connector.connect(host=DATABASE_HOST,
                                       user=DATABASE_USER,
                                       password=DATABASE_PASSWORD,
                                       database=DATABASE_NAME,
                                       charset='utf8mb4')

        cursor = mydb.cursor()

        with cursor as mycursor:
            mycursor.execute(sql, (email, ))
            myresult = mycursor.fetchone()
            print(myresult)

            if not myresult:
                return JSONResponse(content={
                    "error": True,
                    "message": "電子信箱輸入錯誤"
                },
                                    status_code=400)

            user_id, name, email, stored_hashed_password = myresult
            # 類似JS物件解構的概念{a, b, c} = d

            if pwd_context.verify(password, stored_hashed_password):
                access_token_expires = timedelta(
                    minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
                access_token = create_access_token(
                    data={
                        "id": user_id,
                        "name": name,
                        "email": email
                    },
                    expires_delta=access_token_expires)

                return JSONResponse(content={"token": access_token},
                                    status_code=200)
            else:
                return JSONResponse(content={
                    "error": True,
                    "message": "密碼輸入錯誤"
                },
                                    status_code=400)
    except Exception as err:
        print(err)
        return JSONResponse(content={
            "error": True,
            "message": f"內部伺服器或與資料庫連接錯誤: {str(err)}"
        },
                            status_code=500)


# 註冊
@app.post("/api/user", response_model=dict)
async def signup(request: Request):
    data = await request.json()
    print(data)
    # {'name': '�p��', 'email': 'flower@gmail.com', 'password': 'flower'}
    name = data.get("name")
    email = data.get("email")
    password = data.get("password")

    # 使用加密上下文對密碼進行加密
    hashed_password = pwd_context.hash(password)
    print(hashed_password)

    sql = "SELECT email FROM member WHERE BINARY email = %s"

    try:
        # 初始化連接
        mydb = mysql.connector.connect(host=DATABASE_HOST,
                                       user=DATABASE_USER,
                                       password=DATABASE_PASSWORD,
                                       database=DATABASE_NAME,
                                       charset='utf8mb4')

        cursor = mydb.cursor()

        # 使用with確保在使用完畢後自動關閉
        with cursor as mycursor:
            mycursor.execute(sql, (email, ))
            myresult = mycursor.fetchone()

            if myresult == None:
                sql = "INSERT INTO member (name, email, password) VALUES (%s, %s, %s)"
                val = (name, email, hashed_password)  # 使用加密後的密碼
                mycursor.execute(sql, val)
                mydb.commit()
                print(mycursor.rowcount, "record inserted.")
                return JSONResponse(content={"ok": True}, status_code=200)
            else:
                return JSONResponse(content={
                    "error": True,
                    "message": "Email已經註冊帳戶"
                },
                                    status_code=400)

    except Exception as err:
        print(err)
        return JSONResponse(content={
            "error": True,
            "message": f"內部伺服器或與資料庫連接錯誤: {str(err)}"
        },
                            status_code=500)


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
        # 初始化連接
        mydb = mysql.connector.connect(host=DATABASE_HOST,
                                       user=DATABASE_USER,
                                       password=DATABASE_PASSWORD,
                                       database=DATABASE_NAME,
                                       charset='utf8mb4')

        cursor = mydb.cursor()

        # 使用with確保在使用完畢後自動關閉
        with cursor as mycursor:
            mycursor.execute(sql, params)

            myresults = mycursor.fetchall()
            # print(myresults)
            if not myresults:
                return {"nextPage": None, "data": []}
            else:
                attractions = []

                for myresult in myresults:
                    images_original = myresult[9]
                    # print("images_original: ", images_original)
                    images = images_original.split(',')
                    # 上行本來用images = [images]，改用Phild建議的方法看看是否會不同
                    # print("images: ", images)  # list，這樣一來要取出單張圖片應該就沒問題了！

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
                    # print(images)

                # 計算查詢總筆數
                if keyword:
                    total_sql = f"SELECT COUNT(*) FROM attraction {where_clause}"
                    mycursor.execute(total_sql, params)
                else:
                    total_sql = "SELECT COUNT(*) FROM attraction"
                    mycursor.execute(total_sql, [])
                total_records = mycursor.fetchone()[0]
                # 若沒有設定[0]，結果將是(總筆數)
                print("total_records", total_records)

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
        print(err)
        return JSONResponse(content={
            "error": True,
            "message": f"內部伺服器或與資料庫連接錯誤: {str(err)}"
        },
                            status_code=500)
    finally:
        # 確保最終關閉資料庫連接
        if mycursor:
            mycursor.close()
        if mydb:
            mydb.close()


# 第二支API
@app.get("/api/attraction/{attractionId}", response_model=dict)
async def query_attraction_id(attractionId: int):

    sql = "SELECT * from attraction Where id = %s"

    try:
        # 初始化連接
        mydb = mysql.connector.connect(host=DATABASE_HOST,
                                       user=DATABASE_USER,
                                       password=DATABASE_PASSWORD,
                                       database=DATABASE_NAME,
                                       charset='utf8mb4')

        cursor = mydb.cursor()

        # 使用with確保在使用完畢後自動關閉
        with cursor as mycursor:
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
    finally:
        # 確保最終關閉資料庫連接
        if mycursor:
            mycursor.close()
        if mydb:
            mydb.close()


# 第三支API
@app.get("/api/mrts", response_model=dict)
async def desc_mrt_count():
    sql = "SELECT mrt, COUNT(*) as count FROM attraction WHERE mrt IS NOT NULL GROUP BY mrt ORDER by count DESC"

    try:
        # 建立資料庫連接
        mydb = mysql.connector.connect(host=DATABASE_HOST,
                                       user=DATABASE_USER,
                                       password=DATABASE_PASSWORD,
                                       database=DATABASE_NAME,
                                       charset='utf8mb4')
        cursor = mydb.cursor()

        # 使用with確保在使用完畢後自動關閉
        with cursor as mycursor:

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
    finally:
        # 確保最終關閉資料庫連接
        if mycursor:
            mycursor.close()
        if mydb:
            mydb.close()


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


if __name__ == "__main__":
    import uvicorn  # 這行也可以寫在本檔最頂
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
