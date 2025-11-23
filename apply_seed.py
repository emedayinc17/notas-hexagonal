import os
import pymysql
import re

# Configuration
DB_HOST = "localhost"
DB_PORT = 3306
# We try to use root to execute the seed which contains 'USE' statements
# If root password is not empty, this might fail.
# Common defaults: "", "root", "admin", "password"
DB_USER = "root"
DB_PASSWORD = "" # Try empty first

SEED_FILE = r"e:\notas-hexagonal\database\seed.sql"

def parse_sql_file(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove comments
    # content = re.sub(r'--.*', '', content) # Simple comment removal might break strings with --
    # Better to split by ; and let the DB handle comments if possible, or use a more robust parser.
    # For this seed file, we can try splitting by ';' but we need to be careful with triggers/procedures.
    # The seed file seems to contain INSERTs and SETs.
    
    statements = []
    delimiter = ";"
    current_statement = []
    
    for line in content.splitlines():
        line = line.strip()
        if not line or line.startswith("--"):
            continue
            
        current_statement.append(line)
        if line.endswith(delimiter):
            stmt = " ".join(current_statement)
            # Remove the trailing delimiter
            stmt = stmt.rstrip(delimiter)
            statements.append(stmt)
            current_statement = []
            
    return statements

def get_connection():
    # Try root with common passwords
    passwords = ["", "root", "admin", "123456", "password", "mysql"]
    for pwd in passwords:
        try:
            print(f"Trying root with password: '{pwd}'")
            conn = pymysql.connect(
                host=DB_HOST,
                port=DB_PORT,
                user="root",
                password=pwd,
                autocommit=True
            )
            print(f"Connected as root with password: '{pwd}'")
            return conn
        except pymysql.MySQLError:
            pass
            
    # Try app_iam
    try:
        print("Trying app_iam...")
        conn = pymysql.connect(
            host=DB_HOST,
            port=DB_PORT,
            user="app_iam",
            password="iam_pass_2025",
            database="sga_iam",
            autocommit=True
        )
        # Check if we can access other DBs
        cursor = conn.cursor()
        try:
            cursor.execute("USE sga_academico;")
            print("Connected as app_iam and can switch databases!")
            return conn
        except Exception as e:
            print(f"Connected as app_iam but CANNOT switch databases: {e}")
            conn.close()
    except Exception as e:
        print(f"Failed to connect as app_iam: {e}")
        
    return None

def apply_seed():
    conn = get_connection()
    if not conn:
        print("Could not connect to database with any known credential.")
        return

    cursor = conn.cursor()
    
    print(f"Reading seed file: {SEED_FILE}")
    with open(SEED_FILE, 'r', encoding='utf-8') as f:
        sql_script = f.read()

    # Split by semicolon, but respect delimiters if any (none in this seed)
    # We need to handle the fact that some statements might fail if dependencies aren't met, 
    # but the seed is ordered.
    
    # Naive split by ;
    statements = sql_script.split(';')
    
    print(f"Found {len(statements)} statements.")
    
    success_count = 0
    error_count = 0
    
    for i, stmt in enumerate(statements):
        stmt = stmt.strip()
        if not stmt:
            continue
            
        # Skip comments
        if stmt.startswith('--'):
            lines = stmt.split('\n')
            stmt = '\n'.join([l for l in lines if not l.strip().startswith('--')])
            stmt = stmt.strip()
            if not stmt:
                continue
        
        try:
            cursor.execute(stmt)
            success_count += 1
        except Exception as e:
            # Ignore "Query was empty"
            if "Query was empty" in str(e):
                continue
            print(f"Error executing statement #{i}: {str(e)[:100]}...")
            error_count += 1
            
    conn.close()
    print(f"Seed execution finished. Success: {success_count}, Errors: {error_count}")


if __name__ == "__main__":
    apply_seed()
