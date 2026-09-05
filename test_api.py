import httpx

resp = httpx.get('http://localhost:8000/api/records/default', timeout=10)
print('Status:', resp.status_code)
data = resp.json()
print('Record count:', data.get('recordCount'))
records = data.get('records', [])
print('Records:', len(records))
for r in records[:2]:
    fields = r['fields']
    print('  {}: total={}, boys={}, girls={}'.format(r['id'], fields['totalEnrolledStudents'], fields['boys'], fields['girls']))