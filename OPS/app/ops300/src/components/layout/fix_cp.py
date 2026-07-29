with open('CommandPalette.tsx', 'r') as f:
    lines = f.readlines()
del lines[14]  # Remove duplicate line
with open('CommandPalette.tsx', 'w') as f:
    f.writelines(lines)
print("Fixed!")
