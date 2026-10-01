---
name: changeset-release
description: >-
  Create changesets, release branches, and prepare version bumps for PeakUI packages.
  Use when the user asks to create a changeset, prepare a release, bump version,
  describe changes for changelog, or start a release branch.
---

# Changeset Release Workflow

Automate the release preparation process: analyze changes, create changeset files, branch, and commit.

## Workflow

### Step 1: Analyze changes

Run these commands to understand what changed:

```bash
git diff master --stat
git diff master --name-only
git log master..HEAD --oneline
```

Identify:

- Which publishable packages were modified (see [packages.md](packages.md))
- The nature of changes (new feature, bug fix, refactor, breaking change)

### Step 2: Determine bump type

Follow [bump-types.md](bump-types.md) rules:

- **minor**: new component, new public API, breaking change, significant refactor
- **patch**: bug fix, style fix, non-breaking refactor, dependency update, docs

If multiple packages changed, list all affected packages in the changeset.

### Step 3: Create release branch

```bash
git checkout -b release/<scope>-<description>
```

Examples: `release/react-input-text-fix`, `release/charts-new-pie-component`

### Step 4: Create changeset file

Create a file in `.changeset/` with a descriptive kebab-case name:

```markdown
---
"@peakui/react": patch
---

Описание изменений на русском языке. Упомянуть:

- Затронутые компоненты (жирным)
- Суть изменений
- Номер задачи (MKI-xxxx) если есть
```

Use this template for the description:

```
MKI-XXXX: Описание изменения для **ComponentName**
```

For multiple changes in one changeset:

```markdown
---
"@peakui/react": minor
"@peakui/styles": patch
---

- MKI-123: Добавлен новый компонент **ComboBox** с поддержкой поиска и множественного выбора
- MKI-456: Исправлено отображение тултипа в **TableCell** при переполнении текста
```

### Step 5: Commit changes

```bash
git add .changeset/<name>.md
git commit -m "chore: add changeset for <scope> <bump-type>"
```

Use conventional commit format:

- `chore(react): add changeset for v0.4.0`
- `chore(tables): add changeset for input fix`
- `chore: add changeset for release`

### Step 6: Report

Summarize what was done:

- Which packages and bump types
- Branch name
- Changeset file created
- Next steps (create PR, review, merge to master)

## Constraints

- Always write descriptions in English
- Reference MKI task numbers when available
- Do not run `pnpm changeset version` — this is done by CI on merge
- Do not run `pnpm changeset add` interactively — create the `.changeset/*.md` file directly

## Additional resources

- Package list and dependency chain: [packages.md](packages.md)
- Bump type guidelines: [bump-types.md](bump-types.md)
