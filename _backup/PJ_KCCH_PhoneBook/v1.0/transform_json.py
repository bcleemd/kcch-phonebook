import json

# Read the original file
with open('/Users/charlie/Codes/PJ_KCCH_PhoneBook/doctor-department.json', 'r', encoding='utf-8') as f:
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
with open('/Users/charlie/Codes/PJ_KCCH_PhoneBook/department-doctors.json', 'w', encoding='utf-8') as f:
    json.dump(transformed_data, f, ensure_ascii=False, indent=4)

print("Saved to department-doctors.json")
