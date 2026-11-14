# Issue tracker: GitHub

Store issues and specifications in GitHub Issues for Blobscan/blobscan.
Use the gh CLI with --repo Blobscan/blobscan.

## Operations

- When a skill requests publication, create a GitHub issue.
- When a skill requests a ticket, read its title, body, labels, and comments.
- For multiline issue bodies and comments, write the text to a temporary
  file and pass it with --body-file.
- Apply triage labels according to docs/agents/triage-labels.md.
- Link child issues with GitHub sub-issues. If unavailable, add
  "Part of #<parent>" to each child and a task list to the parent.
- Record blockers with GitHub issue dependencies. If unavailable, add
  "Blocked by: #<number>" to the issue body.
- A bare issue number refers to this repository. Use a full repository
  reference for issues in the separate indexer repository.

## Pull requests as a triage surface

PRs as a request surface: no.

## Wayfinding

Use one issue labelled wayfinder:map for the map.
Link its child tickets and record their blockers.
Use wayfinder:research, wayfinder:prototype, wayfinder:grilling, or
wayfinder:task for child tickets.

Select an open, unassigned child with no open blockers.
Assign it to the driving developer when work starts.
When work is complete, record the result, close the child, and update
the map with the decision and a link.
