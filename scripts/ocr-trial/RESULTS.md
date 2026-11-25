# OCR Model Benchmark Results (Issue #208)

Evaluation across GEHU PYQ sample pages (200 DPI) targeting Engineering Mathematics, Physics/Chemistry formulas, complex tables, and noisy hand-scanned papers on Kaggle `2 x Tesla T4` (FP16).

## Summary Comparison

| Model             | Parameters | T4 VRAM Peak | Sec/Page | Empty Pages | Broken LaTeX Count | Hallucination Loops | Pages |
| ----------------- | ---------- | -----------: | -------: | ----------: | -----------------: | ------------------: | ----: |
| MinerU 2.5 (1.2B) | 1.2B       |    3202.6 MB |   48.00s |           0 |                  0 |                   0 |    20 |
| GLM-OCR           | 0.9B       |   12521.8 MB |   35.19s |           0 |                  3 |                   0 |    20 |
| DeepSeek-OCR      | 3B (MoE)   |          N/A |      N/A |           0 |                  0 |                   0 |     0 |
| olmOCR-2 (7B)     | 7B         |   17667.5 MB |   48.06s |           0 |                  1 |                   0 |    20 |
| OXR Free API      | Cloud API  |          N/A |   39.73s |           0 |                  1 |                   1 |    20 |

## Side-by-Side Hard Sample Snippets

### 1. `00_math_btech_tma101_endsem_back_2023_p1` (`math`)

- Source: `btech/Year 1/sem 1/engineering mathematics 1/end/tma101_endsem_back_2023.pdf` (page index `0`)

#### MinerU 2.5 (1.2B)

```markdown
\( {2894066} \cdot \)

End Semester Back Examination 2023

Name of the course: B.Tech

Semester: I

Name of the paper: Engineering Mathematics - I

Paper Code: TMA - 101

Time: 3 hours

Maximum Marks: 100

Note:

(i) All questions are compulsory.

(ii) Answer any two sub questions among a, b and c in each main question.

(iii) Total marks in each main question are twenty.

... (17 more lines)
```

#### GLM-OCR

```markdown
End Semester Back Examination 2023

Name of the course: B.Tech
Semester: I
Name of the paper: Engineering Mathematics - I
Paper Code: TMA - 101
Time: 3 hours
Maximum Marks: 100

Note:
(i) All questions are compulsory.
(ii) Answer any two sub questions among a, b and c in each main question.
(iii) Total marks in each main question are twenty.
(iv) Each sub part carries 10 marks.

Q.1 (10×2 = 20 Marks)

(a) Using elementary transformations find the inverse of $A = \begin{bmatrix} 1 & 1 & 3 \\ 1 & 3 & -3 \\ -2 & -4 & -4 \end{bmatrix}$.

(b) Verify Cayley–Hamilton theorem for the matrix,
$A = \begin{bmatrix} 2 & -1 & 1 \\ -1 & 2 & -1 \\ 1 & -1 & 2 \end{bmatrix}$. Hence find $A^{-1}$.

(c) Find the eigen values and eigen vectors of the following matrix.
$A = \begin{bmatrix} -2 & 2 & -3 \\ 2 & 1 & -6 \\ -1 & -2 & 0 \end{bmatrix}$.
... (17 more lines)
```

#### DeepSeek-OCR

_(not run)_

#### olmOCR-2 (7B)

```markdown
End Semester Back Examination 2023

Name of the course: B.Tech
Name of the paper: Engineering Mathematics - I
Time: 3 hours

Semester: I
Paper Code: TMA - 101
Maximum Marks: 100

Note:
(i) All questions are compulsory.
(ii) Answer any two sub questions among a, b and c in each main question.
(iii) Total marks in each main question are twenty.
(iv) Each sub part carries 10 marks.

<table>
  <tr>
    <th>Q.1</th>
    <th>(10×2 = 20 Marks)</th>
    <th></th>
  </tr>
  <tr>
    <td>(a)</td>
... (48 more lines)
```

#### OXR Free API

```markdown
# End Semester Back Examination 2023

Name of the course: B.Tech

Name of the paper: Engineering Mathematics - I

Time: 3 hours

Semester: I

Paper Code: TMA - 101

Maximum Marks: 100

Note:

(i) All questions are compulsory.

(ii) Answer any two sub questions among a, b and c in each main question.

(iii) Total marks in each main question are twenty.

(iv) Each sub part carries 10 marks.

... (5 more lines)
```

### 2. `12_tables_bba_bba103_midsem_2025_sep_p1` (`tables`)

- Source: `bba/sem 1/financial accounting/mid/bba103_midsem_2025_sep.pdf` (page index `0`)

#### MinerU 2.5 (1.2B)

```markdown
Graphic Era
HILL UNIVERSITY
Established by an Act of the Slate Legislature of Uttarakhand (Adhiniyam Sankhya 12 of 2011)
University under section 2(f) of UGC Act, 1956

GEHU/04M/9.1.3

Term Evaluation (Odd) Semester Examination September 2025

Roll no.

Name of the Course: BBA ACCA

Semester: \(1^{\mathrm{st}}\)

Name of the Paper: Financial Accounting

Paper Code: BBA 103 (ACCA)

Time: 1.5 hour

Maximum Marks: 50

Note:
... (36 more lines)
```

#### GLM-OCR

```markdown
Term Evaluation (Odd) Semester Examination September 2025

Roll no...

Name of the Course: BBA ACCA
Semester: 1st
Name of the Paper: Financial Accounting
Paper Code: BBA 103 (ACCA)
Time: 1.5 hour
Maximum Marks: 50

Note:
(i) Answer all the questions by choosing any one of the sub-questions
(ii) Each question carries 10 marks.

Q1. (10 Marks)
a. Explain the need for financial reporting. What are the certain rules that a firm should ensure while preparing it’s financial statements.
OR
b. Discuss how financial reporting supports decision-making for the firm.
CO2

Q2. (10 Marks)
a. Identify the key users of financial statements. How do their needs influence the presentation of financial information.
OR
... (28 more lines)
```

#### DeepSeek-OCR

_(not run)_

#### olmOCR-2 (7B)

```markdown
Term Evaluation (Odd) Semester Examination September 2025

Roll no................................

Name of the Course: BBA ACCA
Semester: 1st
Name of the Paper: Financial Accounting
Paper Code: BBA 103 (ACCA)
Time: 1.5 hour
Maximum Marks: 50

Note:
(i) Answer all the questions by choosing any one of the sub-questions
(ii) Each question carries 10 marks.

Q1. (10 Marks)
a. Explain the need for financial reporting. What are the certain rules that a firm should ensure while preparing it’s financial statements. CO2
OR
b. Discuss how financial reporting supports decision-making for the firm. CO1

Q2. (10 Marks)
a. Identify the key users of financial statements. How do their needs influence the presentation of financial information. CO2
OR
b. How do financial statements fulfill the informational needs of external stakeholders. CO1
... (52 more lines)
```

#### OXR Free API

```markdown
# Term Evaluation (Odd) Semester Examination September 2025

Roll no...

Name of the Course: BBA ACCA

Semester: 1$^{st}$

Name of the Paper: Financial Accounting

Paper Code: BBA 103 (ACCA)

Time: 1.5 hour

Maximum Marks: 50

# Note:

(i) Answer all the questions by choosing any one of the sub-questions

(ii) Each question carries 10 marks.

Q1.

... (61 more lines)
```

### 3. `16_noisy_scan_btech_tec101_midsem_2017_p1` (`noisy_scan`)

- Source: `btech/Year 1/common/basic electronics engineering/mid/OLD/tec101_midsem_2017.pdf` (page index `0`)

#### MinerU 2.5 (1.2B)

```markdown
Roll No.

H

TEC-101

B. Tech. (First Semester)

Mid Semester EXAMINATION, 2017

(All Branches)

BASIC ELECTRONICS ENGINEERING

Time:1:30 Hours] [Maximum Marks:50]

Note : (i) This question paper contains two Sections.

(ii) Both Sections are compulsory.

Section-A

1. Fill in the blanks/True-False: \((1 \times 5 = 5 \text{ Marks})\)

... (19 more lines)
```

#### GLM-OCR

```markdown
TEC-101

B. Tech. (First Semester)
Mid Semester EXAMINATION, 2017
(All Branches)
BASIC ELECTRONICS ENGINEERING

Time : 1:30 Hours ] [ Maximum Marks : 50

Note : (i) This question paper contains two Sections.
(ii) Both Sections are compulsory.

Section—A

1. Fill in the blanks/True-False : (1×5=5 Marks)

(a) The number 29 is not a valid octal number.
(True/False)

(b) The forbidden energy gap of semiconductors is more than that of insulators. (True/False)

(c) An intrinsic semiconductor acts as an insulator at zero Kelvin temperature.
(True/False)

... (5 more lines)
```

#### DeepSeek-OCR

_(not run)_

#### olmOCR-2 (7B)

```markdown
TEC–101

B. Tech. (First Semester)
Mid Semester EXAMINATION, 2017
(All Branches)
BASIC ELECTRONICS ENGINEERING

Time : 1:30 Hours ] [ Maximum Marks : 50
Note : (i) This question paper contains two Sections.
(ii) Both Sections are compulsory.

Section—A

1. Fill in the blanks/True-False : (1×5=5 Marks)
   (a) The number 29 is not a valid octal number. (True/False)
   (b) The forbidden energy gap of semiconductors is more than that of insulators. (True/False)
   (c) An intrinsic semiconductor acts as an insulator at zero Kelvin temperature. (True/False)
   (d) The 2’s complement of (1001110)_2 is ............ .
   (e) If X is a Boolean variable, then X.X’ = ............ .
```

#### OXR Free API

```markdown
![](https://free-oxr.somark.cn/api/v1/files/dce7c9572f2e488fbe540340b38169f6/fabc224cd66f8cbfbe79b6a11722b3a56fca8fffee19dbc12a3f6087d5a99055.png)

# H

# TEC-101

# B. Tech. (First Semester)

# Mid Semester EXAMINATION, 2017

# (All Branches)

BASIC ELECTRONICS ENGINEERING

Time : 1:30 Hours ]

[Maximum Marks : 50]

Note : (i) This question paper contains two Sections.

(ii) Both Sections are compulsory.

Section—A

... (18 more lines)
```

### 4. `04_physics_btech_tph101_midsem_2023_oct_p1` (`physics`)

- Source: `btech/Year 1/common/engineering physics/mid/tph101_midsem_2023_oct.pdf` (page index `0`)

#### MinerU 2.5 (1.2B)

```markdown
(4)

TPH-101

OR

(b) Explain Retardation Plates. The values of \(\mu_{\mathrm{E}}\) and \(\mu_{\mathrm{O}}\) for quarts are 1.556 and 1.542 respectively. Calculate the phase retardation for 5890 Å where the plate thickness is 0.035 mm. (CO2)

TPH-101

3400

3

H

Roll No. 2394081....

TPH-101

B. TECH. (FIRST SEMESTER)

MID SEMESTER

... (15 more lines)
```

#### GLM-OCR

```markdown
(b) Explain Retardation Plates. The values of $\mu_E$ and $\mu_O$ for quarts are 1.556 and 1.542 respectively. Calculate the phase retardation for 5890 Å where the plate thickness is 0.035 mm. (CO2)

H Roll No. 2394081

TPH-101

B. TECH. (FIRST SEMESTER)

MID SEMESTER

EXAMINATION, Oct., 2023

ENGINEERING PHYSICS

Time: 1½ Hours

Maximum Marks: 50

Note: (i) Answer all the questions by choosing any one of the sub-questions.

(ii) Each sub-question carries 10 marks.

1. (a) What do you understand by coherent sources? State the basic conditions for observing the phenomena of interference of light. (CO1)

... (1 more lines)
```

#### DeepSeek-OCR

_(not run)_

#### olmOCR-2 (7B)

```markdown
(4) TPH-101
OR

(b) Explain Retardation Plates. The values of \( \mu_E \) and \( \mu_O \) for quartzs are 1.556 and 1.542 respectively. Calculate the phase retardation for 5890 Å where the plate thickness is 0.035 mm. (CO2)

TPH-101

H Roll No. 2394081

TPH-101

B. TECH. (FIRST SEMESTER)
MID SEMESTER
EXAMINATION, Oct., 2023
ENGINEERING PHYSICS
Time : 1½ Hours
Maximum Marks : 50
Note : (i) Answer all the questions by choosing any one of the sub-questions.
(ii) Each sub-question carries 10 marks.

1. (a) What do you understand by coherent sources? State the basic conditions for observing the phenomena of interference of light. (CO1)

P. T. O.
```

#### OXR Free API

```markdown
(b) Explain Retardation Plates. The values of $\mu_{E}$ and $\mu_{O}$ for quarts are 1.556 and 1.542 respectively. Calculate the phase retardation for 5890 Å where the plate thickness is 0.035 mm. (CO2)

# TPH-101

# B. TECH. (FIRST SEMESTER)

# MID SEMESTER

# EXAMINATION, Oct., 2023

# ENGINEERING PHYSICS

Time : 1½ Hours

# Maximum Marks : 50

Note : (i) Answer all the questions by choosing any one of the sub-questions.

(ii) Each sub-question carries 10 marks.

1. (a) What do you understand by coherent sources? State the basic conditions for observing the phenomena of interference of light. (CO1)
```

### 5. `08_chemistry_btech_tch101_endsem_2024_dec_20_p1` (`chemistry`)

- Source: `btech/Year 1/common/engineering chemistry/end/tch101_endsem_2024_dec_20.pdf` (page index `0`)

#### MinerU 2.5 (1.2B)

```markdown
Graphic Era HILL UNIVERSITY

Established by an Act of the State Legislature of Utahland (Abhydram Senhya 12 of 2011)  
100% of the total value of the UGC's assets.  
Universally under section 2(f) of UGC Act, 1956.

End Term (Odd) Semester Examination December 2024

Roll no.2419010

Name of the Course and semester: B.Tech ISem

Name of the Paper: Engineering Chemistry

Paper Code: TCH-101

Maximum Marks: 100

Time: 3 hour

Note:

(i) All the questions are compulsory.

... (55 more lines)
```

#### GLM-OCR

```markdown
End Term (Odd) Semester Examination December 2024

Roll no. 2419010

Name of the Course and semester: B.Tech ISem
Name of the Paper: Engineering Chemistry
Paper Code: TCH-101
Time: 3 hour

Note:
(i) All the questions are compulsory.
(ii) Answer any two sub questions from a, b and c in each main question.
(iii) Total marks for each question is 20 (twenty).
(iv) Each sub-question carries 10 marks.

Q1.
a. What are the conditions for Hydrogen bond formation? Discuss different types of Hydrogen bonding. Also explain why acetone is more volatile than alcohol? (CO1)
b. Draw the MOT Diagram of HF molecule. Also report its bond order and magnetic nature. (CO1)
c. Write a short note on (i) Metallic Bonding (ii) Nanomaterials. (CO1)

Q2.
a. Describe about the ion exchange process for water softening with the help of proper chemical reactions. (CO2)
b. Write a short note on (i) Scale and Sludge Formation (ii) Reverse Osmosis (CO2)
c. Calculate the temporary and permanent hardness of water sample which on analysis have:
... (17 more lines)
```

#### DeepSeek-OCR

_(not run)_

#### olmOCR-2 (7B)

```markdown
End Term (Odd) Semester Examination December 2024

Name of the Course and semester: B.Tech ISem
Name of the Paper: Engineering Chemistry
Paper Code: TCH-101
Time: 3 hour
Maximum Marks: 100

Note:
(i) All the questions are compulsory.
(ii) Answer any two sub questions from a, b and c in each main question.
(iii) Total marks for each question is 20 (twenty).
(iv) Each sub-question carries 10 marks.

Q1. (2X10=20 Marks)
a. What are the conditions for Hydrogen bond formation? Discuss different types of Hydrogen bonding. Also explain why acetone is more volatile than alcohol? (CO1)
b. Draw the MOT Diagram of HF molecule. Also report its bond order and magnetic nature. (CO1)
c. Write a short note on (i) Metallic Bonding (ii) Nanomaterials. (CO1)

Q2. (2X10=20 Marks)
a. Describe about the ion exchange process for water softening with the help of proper chemical reactions. (CO2)
b. Write a short note on (i) Scale and Sludge Formation (ii) Reverse Osmosis (CO2)
c. Calculate the temporary and permanent hardness of water sample which on analysis have:
Ca(HCO3)2 = 4.05 ppm; Mg(HCO3)2 = 36.5 ppm; MgSO4 = 15 ppm, CaSO4 = 17 ppm, CaCl2 = 2.775 ppm, silica = 10 ppm and MgCl2 = 9.5 ppm (CO2)
... (16 more lines)
```

#### OXR Free API

```markdown
# End Term (Odd) Semester Examination December 2024

Roll no. 2419010,

Name of the Course and semester: B.Tech I Sem

Name of the Paper: Engineering Chemistry

Paper Code: TCH-101

Time: 3 hour

Maximum Marks: 100

# Note:

(i) All the questions are compulsory.

(i) All the questions are compulsory.
(ii) Answer any two sub questions from a, b and c in each main question.

(ii) Answer any two sub questions.
(iii) Total marks for each question is 20 (twenty).

... (64 more lines)
```
