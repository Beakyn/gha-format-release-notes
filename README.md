# Release Notes Format

Generate the release notes from a milestone before creating a new release.

## Pre-requisites

Create a workflow .yml file in your .github/workflows directory. An example workflow is available below. For more information, reference the GitHub Help Documentation for Creating a workflow file.

## Inputs

`github-token`: Github token. Add the Github context value: `github.token`. (**required**)

`repository`: Github repository. Add the Github context value: `github.repository`. (**required**)

`milestone`: Milestone id, not title please. (**required**)

`custom-row`: Custom row format. You're able to use the [Github issue object](https://docs.github.com/en/free-pro-team@latest/rest/reference/issues#get-an-issue) values ​​to build your row.\
Example: `"(#${issue.number}) - ${issue.title}: ${issue.body}"`

`custom-group-by-label`: You're able to create groups by combining issue labels. You must add a collection of groups and each group has`title` and `labels`.

## Outputs

`release-notes`: Formatted release notes.

## Example

```yaml
name: Production Deploy

on:
  workflow_dispatch:
    inputs:
      milestone:
        description: "Milestone ID"
        required: true
      version:
        description: "Version to be released"
        required: true

jobs:
  production:
    name: Deploy Production
    runs-on: ubuntu-latest
    steps:
      - name: Relese notes format
        uses: Beakyn/release-notes-format@master
        id: format
        with:
          # required
          github-token: ${{ github.token }}
          repository: ${{ github.repository }}
          milestone: ${{ github.event.inputs.milestone }}

          # optional
          custom-row: "${issue.number} <--> ${issue.title}"
          custom-group-by-label: |
            [
              {
                "title": "### Feature 🎉",
                "labels": ["feature"]
              },
              {
                "title": "### Bug Fixes 🐛",
                "labels": ["bug"]
              },
              {
                "title": "### Refactor & Improvements ✨",
                "labels": ["enhancement", "refactor", "chore"]
              }
            ]

      - name: Create Release
        id: create_release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ github.token }}
        with:
          tag_name: ${{ github.event.inputs.version }}
          release_name: Release ${{ github.event.inputs.version }}
          body: ${{steps.format.outputs.release-notes}}
          draft: false
          prerelease: false

      - name: Close milestone
        uses: Beakyn/close-milestone@master
        with:
          # required
          github-token: ${{ github.token }}
          repository: ${{ github.repository }}
          milestone: ${{ github.event.inputs.milestone }}
```
