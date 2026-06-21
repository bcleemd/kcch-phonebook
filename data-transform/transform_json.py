"""
Last Modified: 2026-06-21
Changes:
    - refactor: use relative paths for input/output files and move to data-transform folder
"""

import json
import os

# Get the directory where the script is located
script_dir = os.path.dirname(os.path.abspath(__file__))
input_path = os.path.join(script_dir, 'doctor-department.json')
output_path = os.path.join(script_dir, 'department-doctors.json')

# Read the original file
with open(input_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Transform the data
transformed_data = {}
staff_list = data.get('hospital_staff_directory', {}).get('staff_list', [])

for staff in staff_list:
    dept = staff.get('department')
    name = staff.get('name')
    if dept and name:
        if dept not in transformed_data:
            transformed_data[dept] = []
        transformed_data[dept].append(name)

# Save the result to a file
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(transformed_data, f, ensure_ascii=False, indent=4)

print(f"Saved to {output_path}")
