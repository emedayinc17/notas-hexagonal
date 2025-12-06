import csv
import os
from datetime import datetime

OUTPUT = os.path.join(os.path.dirname(__file__), '..', 'notas_export_test.csv')
OUTPUT = os.path.abspath(OUTPUT)

header = ['Grado', 'Sección', 'Alumno', 'Documento', 'Curso', 'Docente', 'Periodo', 'Promedio', 'N1', 'N2', 'N3', 'N4']

rows = [
    ['5°', 'A', 'Perez, Juan', '12345678', 'Matemáticas', 'Gonzales, M.', '2025-I', '15.50', '16', '15', '15.5', '15.5'],
    ['5°', 'A', 'Lopez, Ana', '87654321', 'Matemáticas', 'Gonzales, M.', '2025-I', '12.75', '13', '12.5', '12', '13'],
    ['4°', 'B', 'Ramirez, Luis', '11223344', 'Ciencias', 'Torres, P.', '2025-I', '18.00', '18', '18', '18', '18']
]

os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
with open(OUTPUT, 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow(header)
    writer.writerows(rows)

print('CSV generado en:', OUTPUT)
