from collections import defaultdict
import re

def course_outline_parser(markdown_string):
    result = defaultdict(list)
    lines = markdown_string.strip().split('\n')
    current_key = None
    overview_found = False

    for i, line in enumerate(lines):
        line = line.strip()
        if not line:
            continue

        if line.startswith('## Title:'):
            result['Title'] = line.replace('## Title:', '').strip()
            current_key = None

        elif line.startswith('### Overview:'):
            overview_line = line.replace('### Overview:', '').strip()
            if overview_line:
                result['Overview'] = overview_line
            else:
                # try next non-empty line
                for j in range(i + 1, len(lines)):
                    next_line = lines[j].strip()
                    if next_line:
                        result['Overview'] = next_line
                        break
            current_key = None

        elif line.startswith('### Prerequisites:'):
            current_key = 'Prerequisites'

        elif line.startswith('### Learning Outcomes:') or line.startswith('### LearningOutcomes:'):
            current_key = 'LearningOutcomes'

        elif line.startswith('### Skills:'):
            current_key = 'Skills'

        elif current_key == 'Prerequisites' and line.startswith('* '):
            result['Prerequisites'].append(line[2:].strip())

        elif current_key == 'LearningOutcomes' and line.startswith('* '):
            result['LearningOutcomes'].append(line[2:].strip())

        elif current_key == 'Skills' and line.startswith('* '):
            result['Skills'].append(line[2:].strip())

    return dict(result)

def week_modules_parser(markdown_string):
    weekly_data = []
    lines = markdown_string.strip().split('\n')
    current_week = None

    for line in lines:
        line = line.strip()

        week_header_match = re.match(r'## Week (\d+) : (.*) \(total: (\d+) h\)', line)
        if week_header_match:
            if current_week:
                weekly_data.append(current_week)

            week_number = int(week_header_match.group(1))
            week_topic = week_header_match.group(2).strip()
            hours_per_week = int(week_header_match.group(3))

            current_week = {
                'WeekNumber': week_number,
                'WeekTopic': week_topic,
                'WeekModules': [],
                'HoursPerWeek': hours_per_week
            }
        elif line.startswith('- Module') and current_week is not None:
            module_match = re.match(r'- Module (\d+\.\d+): (.*) - ([\d.]+) h', line)
            if module_match:
                module_number = module_match.group(1)
                module_name = module_match.group(2).strip()
                module_duration = float(module_match.group(3))
                current_week['WeekModules'].append({"module_number":module_number, "module":module_name, "duration_hrs":module_duration})

    if current_week:
        weekly_data.append(current_week)

    return weekly_data

def block_parser(text):
    blocks = []

    module_sections = re.split(r'## Module\s*:\s*', text.strip())[1:]

    for module in module_sections:
        lines = module.strip().splitlines()

        block = {}
        for line in lines[1:]:
            line = line.strip()
            if not line:
                continue

            # New Block
            if line.startswith('### Block'):
                if block:
                    blocks.append(block)
                    block = {}

                block_title = re.sub(r'^### Block \d+\s*:\s*', '', line).strip()
                block['BlockTitle'] = block_title

            elif line.startswith('**Length:**'):
                match = re.search(r'\d+', line)
                block['Length'] = int(match.group()) if match else 0

            elif line.startswith('**Type:**'):
                block['Type'] = line.split('**Type:**')[1].strip()

        # Append the last block in module
        if block:
            blocks.append(block)

    return blocks

def block_metadata_parser(data_string: str, idx: int) -> list[dict]:
    entries = re.split(r'## ID : (\d+)\s*\n', data_string)[1:]

    parsed_data = []
    for i in range(0, len(entries), 2):
        current_id = int(entries[i])
        content = entries[i + 1].strip()

        # Extract Objectives
        objectives_match = re.search(r'\*\*Objectives:\*\*\s*\n((?:-.*\n?)+)', content)
        objectives = []
        if objectives_match:
            objectives_text = objectives_match.group(1).strip()
            objectives = [line.strip().lstrip('- ') for line in objectives_text.split('\n') if line.strip()]
        else:
            print(f"OBJECTIVES NOT FOUND : At ID : {current_id}")

        # Extract References
        references_match = re.search(r'\*\*References:\*\*\s*\n((?:-.*\n?)+)', content)
        references = []
        if references_match:
            references_text = references_match.group(1).strip()
            for ref_line in references_text.split('\n'):
                ref_line = ref_line.strip().lstrip('- ')
                if ref_line:
                    parts = ref_line.split(':', 1)
                    if len(parts) == 2:
                        references.append({
                            "title": parts[0].strip(),
                            "source": parts[1].strip()
                        })
                    else:
                        references.append({"title": parts[0].strip(), "source": ""})
                        print(f"SOURCE MISSING : At ID : {current_id}")
        else:
            print(f"REFERENCE NOT FOUND : At ID : {current_id}")

        parsed_data.append({
            "ID": current_id,
            "Objectives": objectives,
            "References": references
        })

    return parsed_data


def milestone_md_parser(md_text: str) -> dict:
    lines = md_text.strip().splitlines()
    milestone = {}
    section = None

    # Containers
    description_lines = []
    objectives = []
    prerequisites = []
    deliverables = []
    supported_filetypes = []
    references = []

    i = 0
    while i < len(lines):
        line = lines[i].strip()

        if line.startswith("## MilestoneTitle:"):
            milestone["MilestoneTitle"] = line.replace("## MilestoneTitle:", "").strip()

        elif line.startswith("- **Length:**"):
            milestone["Length"] = line.replace("- **Length:**", "").strip()

        elif line.startswith("- **Type:**"):
            milestone["Type"] = line.replace("- **Type:**", "").strip()

        elif line.startswith("**Description"):
            i += 1
            while i < len(lines) and not lines[i].strip().startswith("**"):
                description_lines.append(lines[i].strip())
                i += 1
            milestone["Description"] = " ".join(description_lines).strip()
            continue  # already incremented

        elif line.startswith("**Objectives"):
            i += 1
            while i < len(lines) and not lines[i].strip().startswith("**"):
                if lines[i].strip().startswith("-"):
                    obj = re.sub(r"^- ", "", lines[i].strip())
                    objectives.append(obj)
                i += 1
            milestone["Objectives"] = objectives
            continue

        elif line.startswith("**Prerequisites"):
            i += 1
            while i < len(lines) and not lines[i].strip().startswith("**"):
                match = re.match(r"- (Block|Module):\S+", lines[i].strip())
                if match:
                    prerequisites.append(lines[i].strip().lstrip("- ").strip())
                i += 1
            milestone["Prerequisites"] = prerequisites
            continue

        elif line.startswith("**Deliverables"):
            i += 1
            while i < len(lines) and not lines[i].strip().startswith("**"):
                if lines[i].strip().startswith("-"):
                    deliverables.append(lines[i].strip("- ").strip())
                i += 1
            milestone["Deliverables"] = deliverables
            continue

        elif line.startswith("**UploadRequired"):
            # Allow optional colon and any casing for 'true'
            upload_value = line.split(":")[-1].strip().lower()
            milestone["UploadRequired"] = upload_value == "true"

        elif line.startswith("**SupportedFiletypes"):
            i += 1
            while i < len(lines) and not lines[i].strip().startswith("**"):
                # Allow formats like: "- .py", or even ".py, .pdf" as single line
                if lines[i].strip().startswith("-"):
                    filetypes = lines[i].strip("- ").split(",")
                    for ftype in filetypes:
                        ftype = ftype.strip()
                        if ftype:
                            supported_filetypes.append(ftype)
                i += 1
            milestone["SupportedFiletypes"] = supported_filetypes
            continue

        elif line.startswith("**References"):
            i += 1
            while i < len(lines) and lines[i].strip().startswith("-"):
                parts = lines[i].strip("- ").split(" : ")
                if len(parts) == 2:
                    references.append({"title": parts[0].strip(), "source": parts[1].strip()})
                i += 1
            milestone["References"] = references
            continue

        i += 1

    return milestone


