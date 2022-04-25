const core = require('@actions/core');

const DEFAULT_RELEASE_NOTES_GROUP_OPTIONS = [
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

const getReleaseNotesGroupOptions = () => {
  const groupByLabel = core.getInput('custom-group-by-label');

  return !groupByLabel
    ? DEFAULT_RELEASE_NOTES_GROUP_OPTIONS
    : JSON.parse(groupByLabel);
};

const getGithubOptions = () => {
  const options = { required: true };

  const ghToken = process.env.GITHUB_TOKEN;
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
};

module.exports = {
  getReleaseNotesGroupOptions,
  getGithubOptions,
};
