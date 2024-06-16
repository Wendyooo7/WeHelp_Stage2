import mysql.connector
import json
import os
from dotenv import load_dotenv
import re

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

cursor = mydb.cursor()

try:
    # 開始事務
    mydb.start_transaction()

    # 讀取 JSON 文件
    with open('./data/taipei-attractions.json', 'r', encoding='utf-8') as file:
        data = json.load(file)
        attraction_list = data["result"]["results"]

        for attraction in attraction_list:
            # id = attraction["_id"]
            name = attraction["name"]
            category = attraction["CAT"]
            description = attraction["description"]
            address = attraction["address"]
            transport = attraction["direction"]
            mrt = attraction["MRT"]
            latitude = attraction["latitude"]
            longitude = attraction["longitude"]
            images_unfiltered = attraction["file"]
            print("images_unfiltered: ", images_unfiltered)
            # https://www.travel.taipei/d_upload_ttn/sceneadmin/pic/11000848.jpghttps://www.travel.taipei/d_upload_ttn/sceneadmin/pic/11002891.jpghttps://www.travel.taipei/d_upload_ttn/sceneadmin/image/A0/B0/C0/D315/E70/F65/1e0951fb-069f-4b13-b5ca-2d09df1d3d90.JPGhttps://www.travel.taipei/d_upload_ttn/sceneadmin/image/A0/B0/C0/D260/E538/F274/e7d482ba-e3c0-40c3-87ef-3f2a1c93edfa.JPGhttps://www.travel.taipei/d_upload_ttn/sceneadmin/image/A0/B0/C0/D919/E767/F581/9ddde70e-55c2-4cf0-bd3d-7a8450582e55.jpghttps://www.travel.taipei/d_upload_ttn/sceneadmin/image/A0/B0/C1/D28/E891/F188/77a58890-7711-4ca2-aebe-4aa379726575.JPG
            # 使用正規表達式提取所有以.jpg或.JPG結尾的 URL
            image_urls = re.findall(r'https:\/\/.*?\.(?:jpg|JPG)',
                                    images_unfiltered)
            print("image_urls: ", image_urls)
            # ['https://www.travel.taipei/d_upload_ttn/sceneadmin/pic/11000848.jpg', 'https://www.travel.taipei/d_upload_ttn/sceneadmin/pic/11002891.jpg', 'https://www.travel.taipei/d_upload_ttn/sceneadmin/image/A0/B0/C0/D315/E70/F65/1e0951fb-069f-4b13-b5ca-2d09df1d3d90.JPG', 'https://www.travel.taipei/d_upload_ttn/sceneadmin/image/A0/B0/C0/D260/E538/F274/e7d482ba-e3c0-40c3-87ef-3f2a1c93edfa.JPG', 'https://www.travel.taipei/d_upload_ttn/sceneadmin/image/A0/B0/C0/D919/E767/F581/9ddde70e-55c2-4cf0-bd3d-7a8450582e55.jpg', 'https://www.travel.taipei/d_upload_ttn/sceneadmin/image/A0/B0/C1/D28/E891/F188/77a58890-7711-4ca2-aebe-4aa379726575.JPG']
            # 將 URL 列表轉換為逗號分隔的字符串
            images = ",".join(image_urls)
            # https://www.travel.taipei/d_upload_ttn/sceneadmin/pic/11000848.jpg,https://www.travel.taipei/d_upload_ttn/sceneadmin/pic/11002891.jpg,https://www.travel.taipei/d_upload_ttn/sceneadmin/image/A0/B0/C0/D315/E70/F65/1e0951fb-069f-4b13-b5ca-2d09df1d3d90.JPG,https://www.travel.taipei/d_upload_ttn/sceneadmin/image/A0/B0/C0/D260/E538/F274/e7d482ba-e3c0-40c3-87ef-3f2a1c93edfa.JPG,https://www.travel.taipei/d_upload_ttn/sceneadmin/image/A0/B0/C0/D919/E767/F581/9ddde70e-55c2-4cf0-bd3d-7a8450582e55.jpg,https://www.travel.taipei/d_upload_ttn/sceneadmin/image/A0/B0/C1/D28/E891/F188/77a58890-7711-4ca2-aebe-4aa379726575.JPG
            # 原本的寫法：images = "','".join(image_urls)，以','去分隔列表的每個字符，所以頭尾沒有'，之後在app.py轉成列表可以被前端提取，但每個url後面會多個'，就讀不到正確網址，圖片也就渲染不出來
            # https://www.travel.taipei/d_upload_ttn/sceneadmin/image/A0/B0/C0/D14/E810/F21/48d66fbd-1ba3-4efd-837a-3767db5f52e0.jpg','https://www.travel.taipei/d_upload_ttn/sceneadmin/pic/11000721.jpg','https://www.travel.taipei/d_upload_ttn/sceneadmin/pic/11000723.jpg','https://www.travel.taipei/d_upload_ttn/sceneadmin/pic/11000722.jpg
            print("images: ", images)
            print("line")
            # 建立 SQL 插入語句
            insert_sql = """
            INSERT INTO attraction (name, category, description, address, transport, mrt, latitude, longitude, images)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """

            try:
                cursor.execute(insert_sql,
                               (name, category, description, address,
                                transport, mrt, latitude, longitude, images))
            except Exception as e:
                print(f"Error writing data: {e}")
                mydb.rollback()
                break  # 如果遇到錯誤，停止處理並回滾事務

    # 提交事務
    mydb.commit()

except Exception as e:
    print(f"An error occurred: {e}")
    mydb.rollback()
finally:
    cursor.close()
    mydb.close()
