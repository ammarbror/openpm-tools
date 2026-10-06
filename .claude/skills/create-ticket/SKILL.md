---
name: create-ticket
description: Create a Jira ticket assigned to the current sprint with automatically improved summary and structured description formatting
---

# Create Ticket Skill

Run the following command using Bash:

```bash
npx openpm-tools create-ticket "$ARGUMENTS"
```

## Mandatory AI Rules for Creating Tickets

1. **Rewrite & Improve Summary**:
   - ALWAYS rewrite/improve the input summary before creating the ticket.
   - Fix spelling/grammar mistakes, clarify ambiguous words, and make it concise, professional, and standard Jira format (e.g., capitalized sentence, clear action/feature).

2. **Description Handling**:
   - **If user provided a description**: Refine and structure the description for maximum clarity and context.
   - **If user DID NOT provide a description**:
     - **First attempt**: Use domain knowledge and summary context to generate a meaningful, complete description tailored to the ticket type.
     - **If context is insufficient**: Omit `--description` or pass empty string, so the tool automatically populates the initial section template with clear section explanations dynamically tailored to the ticket type (`Task`, `Story`, `Bug`, `Epic`).

3. **Argument Extraction & Execution**:
   - Extract flags: summary (`<improved_summary>`), type (`--type`), description (`--description`), assignee (`--assignee`), sprint (`--sprint`), epic (`--epic`), story points (`--story-points`).
   - Execute: `npx openpm-tools create-ticket "<improved_summary>" [flags]`.


## Mermaid Descriptions

Keep Mermaid source in fenced `mermaid` or `{code:mermaid}` blocks. The shared Jira client renders and uploads SVG attachments while retaining source. Attachment permission is required. Creation saves the source first; if enrichment fails, inspect the issue key in the error and edit that issue instead of retrying creation. On edits, a rendering or upload failure leaves fields unchanged, though previously uploaded attachments may remain. Repeated edits upload new attachments. Layout measurements are approximate, and live Jira inline display is unverified.
