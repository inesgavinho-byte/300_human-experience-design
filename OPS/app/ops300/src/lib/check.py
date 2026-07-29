with open('supabase.ts', 'r') as f:
    lines = f.readlines()
# Remove duplicate line 128 (index 127) which closes Tables prematurely
del lines[127]
with open('supabase.ts', 'w') as f:
    f.writelines(lines)
print("Fixed!")
