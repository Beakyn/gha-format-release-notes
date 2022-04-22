const core = require('@actions/core');
const { fetchIssues } = require('./fetch-issues');
const { formatReleaseNotes } = require('./format-release-notes');
const {
  getReleaseNotesGroupOptions,
  getGithubOptions,
} = require('./get-options');

const filterNonPullRequestIssues = (issues) => {
  return issues.filter((issue) => !issue.pull_request);
};

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
