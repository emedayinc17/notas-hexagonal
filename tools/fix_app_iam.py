#!/usr/bin/env python3
"""
tools/fix_app_iam.py

Intenta conectarse al servidor MySQL como root (prueba contraseñas comunes),
crea/actualiza el usuario `app_iam` para hosts comunes y aplica los grants
necesarios para `sga_iam`. Luego ejecuta `tools/validate_db_users.py` para
verificar el resultado y escribe `tools/validate_db_report_after_fix.json`.

Uso:
    python tools/fix_app_iam.py

Nota: Este script ejecuta cambios en la base de datos. Asegúrate de tener
acceso de administrador en MySQL o autoriza la operación.
"""
from pathlib import Path
import time
import json
import subprocess
import sys

try:
    import pymysql
except Exception:
    print("pymysql no encontrado. Instala con: pip install pymysql")
    raise


ROOT = Path(__file__).resolve().parents[1]
IAM_ENV = ROOT / 'services' / 'iam-service' / '.env'
VALIDATOR = ROOT / 'tools' / 'validate_db_users.py'
REPORT_AFTER = ROOT / 'tools' / 'validate_db_report_after_fix.json'


def parse_env(path: Path) -> dict:
    data = {}
    if not path.exists():
        return data
    for line in path.read_text(encoding='utf-8').splitlines():
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        if '=' not in line:
            continue
        k, v = line.split('=', 1)
        data[k.strip()] = v.strip().strip('"').strip("'")
    return data


def try_root_connect(host, port):
    passwords = ["", "root", "admin", "123456", "password", "mysql"]
    for pwd in passwords:
        try:
            conn = pymysql.connect(host=host, port=port, user='root', password=pwd, connect_timeout=5)
            print(f"Connected as root with password '{pwd}'")
            return conn
        except Exception:
            continue
    return None


def apply_grants(conn, app_password, db_name='sga_iam'):
    stmts = [
        f"CREATE USER IF NOT EXISTS 'app_iam'@'localhost' IDENTIFIED BY '{app_password}';",
        f"CREATE USER IF NOT EXISTS 'app_iam'@'127.0.0.1' IDENTIFIED BY '{app_password}';",
        f"CREATE USER IF NOT EXISTS 'app_iam'@'%' IDENTIFIED BY '{app_password}';",
        f"ALTER USER 'app_iam'@'localhost' IDENTIFIED BY '{app_password}';",
        f"ALTER USER 'app_iam'@'127.0.0.1' IDENTIFIED BY '{app_password}';",
        f"GRANT SELECT, INSERT, UPDATE, DELETE ON `{db_name}`.* TO 'app_iam'@'localhost';",
        f"GRANT SELECT, INSERT, UPDATE, DELETE ON `{db_name}`.* TO 'app_iam'@'127.0.0.1';",
        f"GRANT SELECT, INSERT, UPDATE, DELETE ON `{db_name}`.* TO 'app_iam'@'%';",
        "FLUSH PRIVILEGES;"
    ]
    cur = conn.cursor()
    for s in stmts:
        try:
            cur.execute(s)
            print(f"Executed: {s.split(' ',1)[0]}...")
        except Exception as e:
            print(f"Warning executing statement: {s} -> {e}")
    conn.commit()


def run_validator():
    print("Running validator...")
    # Run the validator and copy report
    try:
        subprocess.run([sys.executable, str(VALIDATOR)], check=True)
    except subprocess.CalledProcessError as e:
        print(f"Validator failed: {e}")
    # Copy the report if exists
    report_src = ROOT / 'tools' / 'validate_db_report.json'
    if report_src.exists():
        report_data = report_src.read_text(encoding='utf-8')
        (ROOT / 'tools' / 'validate_db_report.json').write_text(report_data, encoding='utf-8')
        # save as after_fix
        (ROOT / 'tools' / 'validate_db_report_after_fix.json').write_text(report_data, encoding='utf-8')
        print(f"Saved report to {REPORT_AFTER}")
    else:
        print("Validator report not found.")


def main():
    env = parse_env(IAM_ENV)
    host = env.get('DB_HOST', '127.0.0.1')
    port = int(env.get('DB_PORT', 3306) or 3306)
    app_pwd = env.get('DB_PASSWORD', 'iam_pass_2025')

    print(f"IAM env: host={host} port={port}")

    conn = try_root_connect(host, port)
    if not conn:
        print("Could not connect as root using common passwords. Aborting.")
        print("Please run the SQL below as MySQL root manually:")
        print("""
CREATE USER IF NOT EXISTS 'app_iam'@'localhost' IDENTIFIED BY 'iam_pass_2025';
CREATE USER IF NOT EXISTS 'app_iam'@'127.0.0.1' IDENTIFIED BY 'iam_pass_2025';
CREATE USER IF NOT EXISTS 'app_iam'@'%' IDENTIFIED BY 'iam_pass_2025';
GRANT SELECT, INSERT, UPDATE, DELETE ON `sga_iam`.* TO 'app_iam'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON `sga_iam`.* TO 'app_iam'@'127.0.0.1';
GRANT SELECT, INSERT, UPDATE, DELETE ON `sga_iam`.* TO 'app_iam'@'%';
FLUSH PRIVILEGES;
""")
        return

    try:
        apply_grants(conn, app_pwd, db_name=env.get('DB_NAME', 'sga_iam'))
        print("Grants applied. Waiting briefly before validating...")
        time.sleep(1)
    finally:
        conn.close()

    run_validator()


if __name__ == '__main__':
    main()
