---
name: paper-reader
description: AI/CS paper reader - analyzes PDF papers and extracts key points, contributions, and methods
argument-hint: <pdf_path> [focus_area]
---

# Paper Reader Skill

Read and analyze AI/CS research papers from PDF files.

## Usage

```
/paper-reader /path/to/paper.pdf
/paper-reader /path/to/paper.pdf "attention mechanism"
```

## Instructions

When given a PDF paper path:

1. **Load the `/pdf` skill** to access PDF processing capabilities
2. **Extract text** from the PDF using pdfplumber:
   ```python
   import pdfplumber
   
   with pdfplumber.open("paper.pdf") as pdf:
       text = ""
       for page in pdf.pages:
           text += page.extract_text() or ""
   ```
3. **Analyze the extracted text** following the steps below
4. **Write output to a markdown file** with the same name as the PDF (e.g., `paper.pdf` → `paper.md`) in the same directory
   - If the `.md` file already exists, **append** to it (no separator needed)
   - Do NOT output the analysis in the conversation; only write to the file

### Analysis Steps

1. **Extract basic info**: title, authors, venue/year
2. **Identify the problem**: what problem does this paper solve? what are limitations of existing methods?
3. **Summarize contributions**: 1-3 key contributions
4. **Explain methodology**: overall framework, key techniques, innovations
5. **Report results**: datasets, main conclusions, key metrics
6. **Note limitations**: what are the limitations and future work?

### Output Format (in Chinese)

Write the following template to the `.md` file (do NOT output in conversation):

```markdown
# Paper Summary

## 1. Bibliographic Information
- **Title**:
- **Authors**:
- **Venue** (Journal/Conference, Year):
- **Paper link**:
- **Code / Project**:

---

## 2. Problem & Motivation
**What problem does this paper address?**  
Describe the task and why it matters.

**Why are existing methods insufficient?**  
What are the key limitations, bottlenecks, or failure modes of prior approaches?

---

## 3. High-level Idea
**What is the main idea of the paper in one or two sentences?**  
What is the core intuition behind the proposed method?

---

## 4. Method Overview
### 4.1 System / Model Architecture
Describe the overall pipeline or architecture.
- What are the main modules?
- How does data flow through the system?
- Where does learning happen?

(Optional: include a figure reference)

---

### 4.2 Key Components
For each major component:

#### Component A: <name>
- **Purpose**:
- **Input**:
- **Output**:
- **How it works**:

#### Component B: <name>
- **Purpose**:
- **Input**:
- **Output**:
- **How it works**:

---

### 4.3 Learning / Optimization
- What is the objective function?
- What losses are used?
- How is the model trained?
- What supervision signals are required?

---

### 4.4 Inference & Usage
- How is the model used at test time?
- What decisions does it make?
- What is produced as output?

---

## 5. What Makes This Method Different?
**Compared to prior work, what is fundamentally new?**

Describe the novelty in terms of:
- Modeling
- Architecture
- Learning strategy
- Inference or deployment
- Human–AI interaction (if applicable)

---

## 6. Why Does It Work?
**What is the underlying mechanism?**  
Explain why this method should perform better than previous ones.
- What inductive bias is introduced?
- What information is being captured that others miss?

---

## 7. Experimental Evidence
- **Datasets**:
- **Baselines**:
- **Evaluation metrics**:

### Key Results
- Main quantitative results
- Improvements over baselines
- Where it helps the most (and least)

---

## 8. Ablations & Analysis
- What happens when components are removed?
- Which parts matter the most?
- What insights do the authors provide?

---

## 9. Limitations
- What does the method not handle well?
- What assumptions does it rely on?
- What could go wrong in real-world use?

---

## 10. Takeaway
**One-sentence summary of the method:**

> “This paper proposes ______ by ______ in order to ______.”
```

### Guidelines

- Be thorough but concise
- Focus on technical details that matter
- If a focus area is specified, emphasize that aspect
- Use the exact output format above
- All analysis output should be in English
- Always write to file, never output in conversation
- Confirm file path after writing (e.g., "Saved at /path/to/paper.md")
