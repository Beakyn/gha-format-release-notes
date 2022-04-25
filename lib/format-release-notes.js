const core = require('@actions/core');
const template = require('lodash.template');
const isEmpty = require('lodash.isempty');

const getRowTemplate = () => {
  const defaultTemplate = '- ${issue.title} #${issue.number}';
  const templateString = core.getInput('custom-row') || defaultTemplate;
  return template(templateString);
};

const hasGroupLabel = (issue, groupLabels) => {
  const issueLabels = issue.labels.map((label) => label.name);
  return issueLabels.some((label) => groupLabels.includes(label));
};

const formatIssueDescription = (issue) => {
  return getRowTemplate()({ issue });
};

const formatReleaseNotesGroupDescription = (
  issues,
  groupTitle,
  groupLabels,
) => {
  const groupDescription = issues
    .reduce(
      (text, issue) =>
        hasGroupLabel(issue, groupLabels)
          ? `${text}${formatIssueDescription(issue)}\n`
          : text,
      '',
    )
    .trim();

  return groupDescription === ''
    ? ''
    : `\n${groupTitle}\n\n${groupDescription}\n`;
};

const formatReleaseNotes = (issues, groupOptions) => {
  const releaseNotes = groupOptions.reduce((notes, { title, labels }) => {
    if (isEmpty(labels)) return notes;

    const groupDescription = formatReleaseNotesGroupDescription(
      issues,
      title,
      labels,
    );
    return `${notes}${groupDescription}`;
  }, '');

  return releaseNotes;
};

module.exports = {
  formatReleaseNotes,
};
