# Import questions from Excel / CSV

Use **Question Management** → **Import from Excel** to add many questions at once.

## File format

- **First row must be headers.** Supported column names:
  - **Question Text** (or "Question") – the question text
  - **Option A**, **Option B**, **Option C**, **Option D** – answer options (at least 2 required)
  - **Correct Answer** – one letter: `A`, `B`, `C`, or `D` (or `1`,`2`,`3`,`4`). For multiple correct answers use comma: `A,C`
  - **Points** (optional) – points per question, default 10
  - **Allow Multiple** (optional) – `YES`/`NO` for multiple correct answers

## Example

| Question Text              | Option A | Option B   | Option C     | Option D     | Correct Answer | Points | Allow Multiple |
|---------------------------|----------|------------|--------------|--------------|----------------|--------|----------------|
| I ____ coffee now.        | drink    | drank      | am drinking  | was drinking | C              | 10     | NO             |
| They ____ a movie yesterday. | watch  | watched    | are watching | were watching | B           | 10     | NO             |

## Template

- **questions-import-template.xlsx** – open in Excel, fill your questions, save, then use **Import from Excel** in the app.
- **questions-import-template.csv** – same structure; you can edit in Excel and save as .xlsx or .csv.

Accepted file types: `.xlsx`, `.xls`, `.csv`.
