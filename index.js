const github = require("@actions/github");
const core = require("@actions/core");
const template = require('lodash.template');

const defaultRow = '- ${issue.title} #${issue.number}';
const defaultGroupByLabel = [
  {
    title: '### Feature 🎉\n\n',
    labels: ['feature'],
  },
  {
    title: '\n### Bug Fixes 🐛\n\n',
    labels: ['bug'],
  },
  {
    title: '\n### Refactor & Improvements ✨\n\n',
    labels: ['enhancement', 'refactor', 'chore'],
  }
];

function getInputs() {
  const requiredOptions = { required: true };
  // Required
  const tokenGithub = process.env.GITHUB_TOKEN;
  const repository = core.getInput('repository', requiredOptions);
  const milestone = core.getInput('milestone', requiredOptions);
  // Optional
  const customRow = core.getInput('custom-row');
  const groupByLabel = core.getInput('custom-group-by-label');

  console.log('groupByLabel => ', groupByLabel);
  return {
    tokenGithub,
    repository,
    milestone,
    row: customRow || defaultRow,
    groupByLabel: groupByLabel === '' ? defaultGroupByLabel : JSON.parse(groupByLabel)
  };
}

function concatText(previous, current) {
  previous += current;
  return previous;
};

async function run() {
  try {
    const {
      tokenGithub,
      repository,
      milestone,
      row,
      groupByLabel,
    } = getInputs();

    const octokit = github.getOctokit(tokenGithub);
  
    const { data: issues } = await octokit.request(`GET /repos/${repository}/issues`, {  
      milestone,
      state: 'closed',
      sort: 'created',
      direction: 'asc'
    });
  
    const releaseNotes = groupByLabel.map(item => {
      // filtering by group
      const changeLog = issues
      // removing pull_request issues
      .filter(issue => !issue.pull_request)
      // checking the label
      .filter(issue => {
        const exists = issue.labels.some(label => {
          return item.labels.includes(label.name);
        });

        return exists;
      })
      // creating each issue text
      .map(issue => `${template(row)({ issue })}\n`)
      // concatenating the title of the issues
      .reduce(concatText, '');

      return {
        title: item.title,
        changeLog
      }
    })
    // removing groups that have no change log
    .map(({ title, changeLog }) => {
      return (changeLog.trim() !== '')
        ? `\n${title}\n\n${changeLog}`
        : '';
    })
    // concatenating change log groups
    .reduce(concatText, '');
    // success
    console.log(releaseNotes);
    core.setOutput('release-notes', releaseNotes);
  } catch(error) {
    console.log('error => ', error);
    core.setFailed(error.message);
  }
}

run();
