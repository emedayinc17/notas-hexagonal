#!/usr/bin/env python3
"""
tools/validate_db_users.py

Escanea los archivos `.env` dentro de `services/*/` (o `.env.example` si falta)
e intenta conectar a la base de datos MySQL para validar credenciales.

Salida:
 - Imprime resumen en consola
 - Escribe `tools/validate_db_report.json` con detalles por servicio

Uso:
    python tools/validate_db_users.py

Requiere: pymysql (usa el entorno del proyecto). Si falta, instala con:
    pip install pymysql
"""
import os
import glob
import json
import time
from pathlib import Path

try:
    import pymysql
    from pymysql.err import OperationalError
except Exception as e:
    print("Error: pymysql no está disponible. Instálalo con: pip install pymysql")
    raise


ROOT = Path(__file__).resolve().parents[1]
SERVICES_GLOB = ROOT / 'services' / '*'  # services/*
REPORT_PATH = ROOT / 'tools' / 'validate_db_report.json'


def parse_env_file(path: Path) -> dict:
    data = {}
    try:
        with open(path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#'):
                    continue
                if '=' not in line:
                    continue
                key, val = line.split('=', 1)
                key = key.strip()
                val = val.strip().strip('"').strip("'")
                data[key] = val
    except FileNotFoundError:
        pass
    return data


def detect_env_for_service(service_path: Path) -> Path | None:
    # Prefer `.env`, fallback to `.env.example`
    env_path = service_path / '.env'
    if env_path.exists():
        return env_path
    env_ex = service_path / '.env.example'
    if env_ex.exists():
        return env_ex
    return None


def test_connection(cfg: dict) -> dict:
    host = cfg.get('DB_HOST', 'localhost')
    port = int(cfg.get('DB_PORT', 3306) or 3306)
    user = cfg.get('DB_USER')
    password = cfg.get('DB_PASSWORD')
    db = cfg.get('DB_NAME')

    result = {
        'ok': False,
        'error': None,
        'duration_seconds': None,
        'current_user': None,
        'grants': None,
    }

    start = time.time()
    try:
        conn = pymysql.connect(host=host, port=port, user=user, password=password, database=db, connect_timeout=5)
        try:
            with conn.cursor() as cur:
                cur.execute('SELECT 1')
                cur.fetchone()
                # Intentar obtener usuario/host
                try:
                    cur.execute('SELECT CURRENT_USER()')
                    result['current_user'] = cur.fetchone()[0]
                except Exception:
                    pass
                # Intentar SHOW GRANTS (puede fallar si el usuario no tiene privileges para verlos)
                try:
                    cur.execute('SHOW GRANTS FOR CURRENT_USER()')
                    grants = [r[0] for r in cur.fetchall()]
                    result['grants'] = grants
                except Exception:
                    # Intentar fallback: SHOW GRANTS
                    try:
                        cur.execute('SHOW GRANTS')
                        result['grants'] = [r[0] for r in cur.fetchall()]
                    except Exception:
                        result['grants'] = None
        finally:
            conn.close()
        result['ok'] = True
    except OperationalError as oe:
        result['error'] = f"OperationalError: {oe.args}"
    except Exception as e:
        result['error'] = f"Exception: {str(e)}"
    finally:
        result['duration_seconds'] = round(time.time() - start, 3)

    return result


def main():
    services = []
    for svc in sorted(glob.glob(str(SERVICES_GLOB))):
        svc_path = Path(svc)
        if not svc_path.is_dir():
            continue
        services.append(svc_path)

    report = {
        'generated_at': time.strftime('%Y-%m-%d %H:%M:%S'),
        'services': {}
    }

    for svc_path in services:
        svc_name = svc_path.name
        env_file = detect_env_for_service(svc_path)
        if not env_file:
            report['services'][svc_name] = {'found_env': False, 'checked': False, 'note': 'No .env or .env.example found'}
            print(f"[SKIP] {svc_name}: no .env file")
            continue

        cfg = parse_env_file(env_file)
        # Keep minimal info
        db_cfg = {k: cfg.get(k) for k in ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_NAME']}
        print(f"[CHECK] {svc_name}: host={db_cfg.get('DB_HOST')} user={db_cfg.get('DB_USER')} db={db_cfg.get('DB_NAME')}")

        result = test_connection(cfg)
        report['services'][svc_name] = {
            'found_env': True,
            'env_path': str(env_file.relative_to(ROOT)),
            'db': db_cfg,
            'result': result
        }

        if result['ok']:
            print(f"  OK: connected in {result['duration_seconds']}s. current_user={result.get('current_user')}")
        else:
            print(f"  FAIL: {result['error']}")

    # Also check top-level .env if exists
    top_env = ROOT / '.env'
    if top_env.exists():
        cfg = parse_env_file(top_env)
        print("\n[CHECK] top-level .env detected")
        result = test_connection(cfg)
        report['top_env'] = {
            'env_path': str(top_env.relative_to(ROOT)),
            'db': {k: cfg.get(k) for k in ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_NAME']},
            'result': result
        }
        if result['ok']:
            print(f"  OK: connected in {result['duration_seconds']}s. current_user={result.get('current_user')}")
        else:
            print(f"  FAIL: {result['error']}")

    # Write report JSON
    try:
        with open(REPORT_PATH, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        print(f"\nReport written to: {REPORT_PATH}")
    except Exception as e:
        print(f"Failed to write report: {e}")


if __name__ == '__main__':
    main()
