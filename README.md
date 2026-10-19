# Quality Gate Manager

A single-page tool for managing quality gates between the ISTQB test levels:

1. Component testing
2. Component integration testing
3. System testing
4. System integration testing
5. Acceptance testing (UAT / OAT)

Each level has entry and exit criteria. A quality gate (QG0–QG5) combines the exit criteria of one level with the entry criteria of the next, and gives a decision: **Go**, **Conditional go**, **No-go** or **Not ready**.

## Features

- **Risk profile** (Low risk / Standard / High risk) that sets every measured threshold from its preset, e.g. statement coverage 70 / 80 / 90 %.
- **Per criterion:** on/off, name, category, operator (≥ / ≤), threshold, unit, actual value or checklist result, and weight (**Must** blocks the gate, **Should** is advisory).
- **Gate policy:** how many advisory misses are tolerated before a conditional go becomes a no-go, and whether pending advisory criteria count as misses.
- Add, remove, reorder and skip test levels; add your own criteria.
- Gate report table, copyable as plain text.
- Export and import the configuration as JSON; reset to the ISTQB template.

## Running it

No build step and no dependencies. Open `index.html` in a browser, or publish it with GitHub Pages (Settings → Pages → deploy from the `main` branch).

Your changes are kept in the browser's local storage. Use **Export / import** to move a configuration between browsers or projects.

## Data model

The configuration lives in the `gate-state` JSON block in `index.html`. The `gate-template` block holds the default ISTQB template used by **Reset**.

```json
{
  "project": "…",
  "profile": "standard",
  "policy": { "maxAdvisoryMisses": 2, "pendingAdvisoryIsMiss": false },
  "levels": [
    {
      "name": "Component testing", "enabled": true, "owner": "…", "objective": "…", "basis": "…",
      "entry": [ { "name": "…", "kind": "check", "must": true, "on": true, "met": true } ],
      "exit":  [ { "name": "Statement coverage", "kind": "metric", "op": ">=", "target": 80, "unit": "%",
                   "presets": [70, 80, 90], "must": true, "on": true, "actual": 86 } ]
    }
  ]
}
```

The sample values (project "Payments Portal 3.2") are example data. Replace them with your own.
