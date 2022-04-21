const github = require("@actions/github");
const core = require("@actions/core");
const template = require('lodash.template');
const isEmpty = require('lodash.isempty');

const defaultRow = '- ${issue.title} #${issue.number}';
const defaultGroupByLabel = [
  {
    title: '### Feature 🎉',
    labels: ['feature'],
  },
  {
    title: '### Bug Fixes 🐛',
    labels: ['bug'],
  },
  {
    title: '### Refactor & Improvements ✨',
    labels: ['enhancement', 'refactor', 'chore'],
  },
];

function getGithubOptions() {
  const options = { required: true };

  const ghToken = core.getInput('github-token', options);
  const repository = core.getInput('repository', options);
  const milestone = core.getInput('milestone', options);

  const [owner, repo] = repository.split('/');

  return {
    ghToken,
    repository,
    owner,
    repo,
    milestone,
  };
}

function getReleaseNotesGroupOptions() {
  const groupByLabel = core.getInput('custom-group-by-label');

  return !groupByLabel ? defaultGroupByLabel : JSON.parse(groupByLabel);
}

function getRowTemplate() {
  const templateString = core.getInput('custom-row') || defaultRow;
  return template(templateString);
}

async function fetchIssues({
  ghToken,
  owner,
  repo,
  milestone,
  perPage = 100,
  page = 1,
}) {
  const octokit = github.getOctokit(ghToken);

  let issues = [];

  const { data } = await octokit.rest.issues.listForRepo({
    owner,
    repo,
    milestone,
    state: 'closed',
    sort: 'created',
    direction: 'asc',
    per_page: perPage,
    page,
  });

  issues = [...data];

  if (data.length > 0) {
    const moreIssues = await fetchIssues({
      ghToken,
      owner,
      repo,
      milestone,
      page: page + 1,
    });

    issues = [...issues, ...moreIssues];
  }

  return issues;
}

function hasGroupLabel(issue, groupLabels) {
  const issueLabels = issue.labels.map((label) => label.name);
  return issueLabels.some((label) => groupLabels.includes(label));
}

function formatIssueDescription(issue) {
  return getRowTemplate()({ issue });
}

function formatReleaseNotesGroupDescription(issues, groupTitle, groupLabels) {
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
}

function filterNonPullRequestIssues(issues) {
  return issues.filter((issue) => !issue.pull_request);
}

function formatReleaseNotes(issues, groupOptions) {
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
}

async function run() {
  try {
    const githubOptions = getGithubOptions();
    const rnGroupOptions = getReleaseNotesGroupOptions();

    const issues = await fetchIssues(githubOptions);
    const filteredIssues = filterNonPullRequestIssues(issues);

    const releaseNotes = formatReleaseNotes(filteredIssues, rnGroupOptions);

    core.setOutput('release-notes', releaseNotes);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
