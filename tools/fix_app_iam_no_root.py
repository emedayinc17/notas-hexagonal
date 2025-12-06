#!/usr/bin/env python3
"""
tools/fix_app_iam_no_root.py

Prueba conectar con las credenciales de `app_iam` usando distintos hosts
(localhost/127.0.0.1) y, si una combinación funciona, actualiza
`services/iam-service/.env` para usar el host válido.

NO usa root ni modifica usuarios en MySQL.

Luego ejecuta `tools/validate_db_users.py` para verificar el resultado.
"""
from pathlib import Path
import pymysql
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[1]
IAM_ENV = ROOT / 'services' / 'iam-service' / '.env'
VALIDATOR = ROOT / 'tools' / 'validate_db_users.py'


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


def write_env(path: Path, data: dict):
    lines = []
    # preserve existing order when possible
    if path.exists():
        orig = path.read_text(encoding='utf-8').splitlines()
        keys_written = set()
        for line in orig:
            if not line.strip() or line.strip().startswith('#') or '=' not in line:
                lines.append(line)
                continue
            k, _ = line.split('=', 1)
            k = k.strip()
            if k in data:
                lines.append(f"{k}={data[k]}")
                keys_written.add(k)
            else:
                lines.append(line)
        # append new keys
        for k, v in data.items():
            if k not in keys_written:
                lines.append(f"{k}={v}")
    else:
        for k, v in data.items():
            lines.append(f"{k}={v}")

    path.write_text('\n'.join(lines) + '\n', encoding='utf-8')


def try_connect(host, port, user, password, db):
    try:
        conn = pymysql.connect(host=host, port=int(port), user=user, password=password, database=db, connect_timeout=5)
        conn.close()
        return True, None
    except Exception as e:
        return False, str(e)


def main():
    env = parse_env(IAM_ENV)
    if not env:
        print(f"No se encontró {IAM_ENV}. Aborta.")
        return

    host_orig = env.get('DB_HOST', 'localhost')
    port = env.get('DB_PORT', '3306')
    user = env.get('DB_USER', 'app_iam')
    password = env.get('DB_PASSWORD', 'iam_pass_2025')
    db = env.get('DB_NAME', 'sga_iam')

    candidates = []
    # prefer original and try common variants
    candidates.append(host_orig)
    if host_orig in ('localhost', '127.0.0.1'):
        candidates.append('127.0.0.1' if host_orig == 'localhost' else 'localhost')
    else:
        candidates.extend(['localhost', '127.0.0.1'])

    seen = []
    working = None
    for h in candidates:
        if h in seen:
            continue
        seen.append(h)
        ok, err = try_connect(h, port, user, password, db)
        print(f"Trying {user}@{h}:{port}/{db} -> {ok}")
        if ok:
            working = h
            break

    if working:
        if working != host_orig:
            print(f"Host working: {working}. Updating {IAM_ENV} DB_HOST value.")
            env['DB_HOST'] = working
            write_env(IAM_ENV, env)
            print(f"Updated {IAM_ENV} DB_HOST={working}")
        else:
            print(f"Original host {host_orig} already works. No change needed.")
    else:
        print("No working host found using provided app_iam credentials. No changes applied.")

    # Run validator
    print("Running validator to refresh report...")
    subprocess.run([sys.executable, str(VALIDATOR)])


if __name__ == '__main__':
    main()
