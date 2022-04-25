const github = require('@actions/github');

const fetchIssues = async ({
  ghToken,
  owner,
  repo,
  milestone,
  perPage = 100,
  page = 1,
}) => {
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
};

module.exports = { fetchIssues };
