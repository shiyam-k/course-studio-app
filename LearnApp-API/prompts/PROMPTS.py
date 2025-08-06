# === Topic Prompt ===
TOPIC_ANALYSIS = """
For **Course Topic** "{topic}": 
- Identify core domain and skill hierarchy by mapping primary concepts, prerequisites, and progression paths using Bloom's Taxonomy to ensure foundational to advanced layering.
- Break into 3-5 fundamental sub-skills, incorporating Mastery Learning principles to focus on achievable, sequential competencies that build toward expertise.
- Structure Title as "Mastering [Topic]: [Specific Focus]" to create motivational appeal, drawing from Knowles' Andragogy by emphasizing real-world relevance and learner autonomy.
- Craft Overview as a compelling 2-sentence learning journey, highlighting practical outcomes and career relevance to foster intrinsic motivation and long-term retention.
- Align sub-skills with industry standards or emerging trends to ensure the curriculum supports transformative, application-oriented learning experiences.
"""

# === Experience Prompts ===
EXPERIENCE_NOVICE = """
Experience=New: 
- Adopt a foundation-first approach, integrating Gagne's Nine Events of Instruction to build confidence through structured engagement and early feedback.
- Add 2-3 basic Prerequisites with beginner-friendly references, tailored to reduce cognitive load and promote self-directed learning per Andragogy principles.
- Set 60% of Objectives at Remember/Understand Bloom levels, with spaced repetition techniques for better retention and gradual skill building.
- Extend timeline by 25% for concept absorption, including buffer periods for review and confidence-building early wins in the first module.
- Incorporate active learning elements like simple hands-on activities to encourage immediate application and foster a sense of achievement.
"""

EXPERIENCE_INTERMEDIATE = """
Experience=Tried Before: 
- Focus on gap-bridging by assessing prior knowledge and integrating review modules that connect existing skills to new concepts using Mastery Learning.
- Balance 40% foundational review with 60% new concepts, employing Bloom's Taxonomy for moderate progression toward practical applications.
- Customize content depth based on experience, adding motivational hooks like real-world case studies to enhance relevance and engagement.
- Include adaptive pacing to allow learners to accelerate through familiar areas, promoting autonomy and efficiency in line with adult learning philosophies.
- Emphasize integration of prior tries into advanced scenarios to build on existing foundations and drive toward higher competency levels.
"""

EXPERIENCE_ADVANCED = """
Experience=Confident: 
- Employ a mastery refinement approach, skipping basics to dive into complex integrations, aligned with Bloom's higher levels (Apply/Analyze/Create).
- Set 70% of Objectives at Apply/Analyze/Create levels, incorporating innovation projects that challenge and expand existing expertise.
- Compress timeline by 20% for efficiency, using accelerated pacing with optional deep dives to respect learner autonomy per Andragogy.
- Focus on complex problem-solving and peer collaboration elements to foster creative thinking and real-world application.
- Integrate motivational elements like cutting-edge trends and portfolio enhancements to sustain engagement in advanced learners.
"""

# === Time Availability Prompts ===
TIME_LOW = """
{hours} hours/week (Low): 
- Prioritize sustainable pace by structuring bite-sized blocks (20-30min each) to prevent burnout and support consistent progress via Mastery Learning.
- Limit to 2 hours daily across 5 days, incorporating spaced repetition and review buffers for better retention without overwhelming schedules.
- Extend total timeline by 15% to allow for gradual absorption, aligning with Gagne's instructional events for effective, low-intensity engagement.
- Include flexible scheduling options and motivational hooks like quick wins to maintain learner interest in limited time.
- Focus on essential, high-impact content to maximize value within constraints, emphasizing practical relevance for adult learners.
"""

TIME_MEDIUM = """
{hours} hours/week (Medium): 
- Design for balanced intensity, mixing theory and practice blocks to promote active learning and retention.
- Maintain a standard timeline, using Bloom's progression to build skills progressively without rushing or extending unnecessarily.
- Incorporate varied activities like discussions or mini-projects to enhance engagement, drawing from Andragogy's emphasis on real-world application.
- Allow for personalization in pacing, ensuring content fits realistic commitments while fostering deep understanding.
- Integrate review sessions and motivational elements to sustain momentum throughout the course duration.
"""

TIME_HIGH = """
{hours} hours/week (High): 
- Enable accelerated mastery, compressing timeline by 25% through intensive, focused modules.
- Include advanced projects and optional deep-dive content, aligned with Mastery Learning for thorough competency development.
- Add peer collaboration elements to enrich the experience, promoting social learning and motivation in high-commitment scenarios.
- Use Gagne's Nine Events for structured intensity, ensuring progression from attention-grabbing hooks to performance evaluation.
- Emphasize transformative outcomes like skill certification to leverage high motivation in dedicated learners.
"""

# === Learning Style Prompts ===
STYLE_QUICK_COURSE = """
Style=Quick Course: 
- Prioritize rapid skill acquisition with high-density content blocks, focusing on essentials to deliver quick, tangible results.
- Structure for brevity, using Bloom's lower to mid-levels for fast progression toward a practical outcome in the final milestone.
- Incorporate active learning techniques like concise exercises to maintain engagement in short formats, per Gagne's events.
- Emphasize motivational hooks such as immediate applications to align with adult learners' need for relevance.
- Ensure adaptability for on-the-go learning, with summaries and key takeaways for efficient retention.
"""

STYLE_SKILL_PATH = """
Style=Skill Path: 
- Generate multiple interconnected CourseSpecializations, breaking the main topic into 3-4 sub-specializations, each 2-4 weeks long.
- Structure as a learning pathway with clear prerequisites between courses, using Mastery Learning to ensure sequential mastery.
- Follow the standard template for each specialization, focusing on one aspect while building toward comprehensive expertise.
- Incorporate progression tracking and motivational milestones to guide learners through the path effectively.
- Align with Andragogy by emphasizing self-directed choices and real-world interconnections between specializations.
"""

STYLE_BUILD_PROJECT = """
Style=Build-a-Project: 
- Design project-centric structure, aligning all content blocks with project phases for hands-on, experiential learning.
- Ensure each module ends with a project component completion, integrating theory directly to support requirements per Bloom's application levels.
- Culminate in a complete project with portfolio-ready deliverable, fostering creation and synthesis in the final milestone.
- Use Gagne's instructional events to sequence learning around project needs, enhancing engagement and retention.
- Incorporate feedback loops and iterative improvements to build mastery through practical iteration.
"""

# === Motivation Prompts ===
MOTIVATION_CAREER = """
Motivation=Better Job: 
- Emphasize career-focused outcomes by aligning LearningOutcomes with industry-relevant skills and job market demands.
- Include certification-style milestones and portfolio-building elements to enhance employability and professional growth.
- Reference current job market requirements in content, using real-world case studies for practical relevance.
- Integrate motivational hooks like success stories to inspire learners, drawing from Andragogy's focus on life-centered learning.
- Structure for skill transferability, ensuring outcomes support career upskilling and advancement.
"""

MOTIVATION_ACADEMIC = """
Motivation=College Help: 
- Align with academic structures by matching university course formats and including research methodology blocks.
- Incorporate academic citation requirements in milestones and exam-preparation elements for scholarly readiness.
- Use Bloom's higher levels for analytical outcomes, fostering critical thinking and knowledge synthesis.
- Add structured progression with feedback mechanisms to support academic success and deep understanding.
- Emphasize evidence-based learning to build rigorous, transferable academic skills.
"""

MOTIVATION_FUN = """
Motivation=Fun: 
- Adopt an engagement-first approach by gamifying progression with fun knowledge checks and creative exploration blocks.
- Include flexible milestone requirements and community/sharing elements in the final project for social enjoyment.
- Structure with Block:type 'exploration' for open-ended discovery, aligning with intrinsic motivation philosophies.
- Incorporate varied, light-hearted activities to maintain interest without rigid assessments.
- Focus on personal fulfillment, allowing learners to customize paths for maximum enjoyment.
"""

MOTIVATION_CUSTOM = """
Motivation=Other "{text}": 
- Analyze custom motivation for intent, adapting elements like creative additions for hobbies or practical focus for problem-solving.
- If exploration-based, include discovery and experimentation blocks to encourage curiosity-driven learning.
- Tailor outcomes to user-specified goals, integrating motivational hooks for relevance and sustained engagement.
- Use Andragogy principles to emphasize self-directed aspects that align with the custom driver's personal context.
- Ensure flexibility in structure to accommodate unique intents, promoting transformative and personalized experiences.
"""


# === Input Mapping (as a dict) ===
INPUT_MAPPING = {
    "Topic": {
        "prompt": TOPIC_ANALYSIS,
    },
    "Experience": {
        "I'm new": EXPERIENCE_NOVICE,
        "I've tried it before": EXPERIENCE_INTERMEDIATE,
        "I'm confident / advanced": EXPERIENCE_ADVANCED,
    },
    "Hours": {
        "Low": TIME_LOW,
        "Medium": TIME_MEDIUM,
        "High": TIME_HIGH,
    },
    "LearningStyle": {
        "Quick Course": STYLE_QUICK_COURSE,
        "Skill Path": STYLE_SKILL_PATH,
        "Build-a-Project": STYLE_BUILD_PROJECT,
    },
    "Motivation": {
        "Get a better job": MOTIVATION_CAREER,
        "College help": MOTIVATION_ACADEMIC,
        "Just for fun": MOTIVATION_FUN,
        "Other": MOTIVATION_CUSTOM,
    },
}
