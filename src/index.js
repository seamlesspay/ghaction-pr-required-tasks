const { inspect } = require('util')
const core = require('@actions/core')
const github = require('@actions/github')

const REQUIRED_TASK_TAG = /(?<=\s*<!-- required_task -->\s*)/
const REQUIRED_GROUP_TAG = /(?<=\s*<!-- required_task_group -->\s*)/
const TASK_PATTERN = /(?<=- \[[Xx ]\] )[^\n]+/g
const INCOMPLETE_TASK_PATTERN = /(?<=- \[ \] )[^\n]+/g
const TASK_LIST_PATTERN = /(\n[ ]*- \[[Xx ]\] [^\n]+)+/
const REQUIRED_TASK_PATTERN = new RegExp(REQUIRED_TASK_TAG.source + TASK_LIST_PATTERN.source, 'gm')
const REQUIRED_GROUP_PATTERN = new RegExp(REQUIRED_GROUP_TAG.source + TASK_LIST_PATTERN.source, 'gm')

function getIncompleteRequiredTasks(body) {
  return body.match(REQUIRED_TASK_PATTERN)?.join('')?.match(INCOMPLETE_TASK_PATTERN) || []
}

function getIncompleteRequiredGroups(body) {
  return body.match(REQUIRED_GROUP_PATTERN)?.map((requiredGroup) => {
    const tasks = requiredGroup.match(TASK_PATTERN)
    const incompleteTasks = requiredGroup.match(INCOMPLETE_TASK_PATTERN)
    return (incompleteTasks?.length === tasks?.length) ? incompleteTasks : undefined
  })?.filter((_) => _)
}

function run() {
  try {
    const body = github.context.payload.pull_request?.body

    const incompleteTasks = getIncompleteRequiredTasks(body)
    const incompleteGroups = getIncompleteRequiredGroups(body)

    if (incompleteTasks.length + incompleteGroups.length > 0) {
      core.setFailed('Some required tasks are incomplete.')
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

if (require.main === module) {
  run()
} else {
  module.exports = {
    REQUIRED_TASK_PATTERN,
    REQUIRED_GROUP_PATTERN,
    getIncompleteRequiredTasks,
    getIncompleteRequiredGroups,
    run,
  }
}
