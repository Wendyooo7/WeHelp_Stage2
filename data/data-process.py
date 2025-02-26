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

            # 使用正規表達式提取所有以.jpg或.JPG結尾的 URL
            image_urls = re.findall(r'https:\/\/.*?\.(?:jpg|JPG)',
                                    images_unfiltered)

            # 將 URL 列表轉換為逗號分隔的字符串
            images = ",".join(image_urls)

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
