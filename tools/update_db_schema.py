import pymysql
import os

# Do NOT load .env to avoid picking up restricted app_notas user
# load_dotenv(dotenv_path='e:/Notas-hexagonal/services/notas-service/.env')

# Use root credentials for schema updates
DB_HOST = "localhost"
DB_USER = "root"
DB_PASSWORD = "admin" # Assuming standard dev password
DB_PORT = 3306

def update_schema():
    conn = None
    try:
        conn = pymysql.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            port=DB_PORT,
            cursorclass=pymysql.cursors.DictCursor
        )
        cursor = conn.cursor()

        print(f"Connected to database as {DB_USER}.")

        # Check if columns exist in sga_notas.notas
        cursor.execute("SELECT count(*) as count FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'sga_notas' AND TABLE_NAME = 'notas' AND COLUMN_NAME = 'columna_nota'")
        result = cursor.fetchone()
        if result['count'] == 0:
            print("Adding columna_nota column...")
            cursor.execute("ALTER TABLE sga_notas.notas ADD COLUMN columna_nota VARCHAR(20) DEFAULT 'N1' AFTER observaciones")
        else:
            print("columna_nota column already exists.")

        cursor.execute("SELECT count(*) as count FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'sga_notas' AND TABLE_NAME = 'notas' AND COLUMN_NAME = 'metadata_json'")
        result = cursor.fetchone()
        if result['count'] == 0:
            print("Adding metadata_json column...")
            cursor.execute("ALTER TABLE sga_notas.notas ADD COLUMN metadata_json JSON AFTER columna_nota")
        else:
            print("metadata_json column already exists.")
        
        # Add unique index if not exists
        print("Updating unique index...")
        try:
            cursor.execute("ALTER TABLE sga_notas.notas ADD UNIQUE KEY unique_nota_columna (matricula_clase_id, tipo_evaluacion_id, periodo_id, columna_nota)")
            print("Unique index unique_nota_columna added.")
        except pymysql.err.OperationalError as err:
            # Error 1061: Duplicate key name
            if err.args[0] == 1061:
                print("Unique index unique_nota_columna already exists.")
            else:
                print(f"Index creation warning: {err}")
        except Exception as e:
             print(f"Index creation error: {e}")

        conn.commit()
        print("Schema update completed successfully.")

    except pymysql.Error as err:
        print(f"Error: {err}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    update_schema()
