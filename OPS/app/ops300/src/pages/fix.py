with open('Dashboard.tsx', 'r') as f:
    lines = f.readlines()

# Find the FIRST occurrence of openProc (the correct one after thisWeekProc)
# Find the FIRST occurrence of pipeline = useMemo followed by const counts
open_proc_idx = None
pipeline_correct_idx = None

for i, line in enumerate(lines):
    if open_proc_idx is None and "const openProc = procurementTasks.filter(t => t.status !== 'done');" in line:
        open_proc_idx = i
    if pipeline_correct_idx is None and "const pipeline = useMemo(() => {" in line:
        # Check if next non-empty line has "const counts:"
        for j in range(i+1, min(i+5, len(lines))):
            if 'const counts:' in lines[j]:
                pipeline_correct_idx = i
                break

print(f"openProc at line {open_proc_idx}")
print(f"correct pipeline at line {pipeline_correct_idx}")

if open_proc_idx is not None and pipeline_correct_idx is not None:
    new_lines = lines[:open_proc_idx+1] + ['\n'] + lines[pipeline_correct_idx:]
    with open('Dashboard.tsx', 'w') as f:
        f.writelines(new_lines)
    print("Fixed!")
else:
    print("Could not find markers")
