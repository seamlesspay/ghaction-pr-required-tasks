const fs = require('fs')
const path = require('path')
const core = require('@actions/core')
const github = require('@actions/github')
const {
  REQUIRED_TASK_PATTERN,
  REQUIRED_GROUP_PATTERN,
  getIncompleteRequiredTasks,
  getIncompleteRequiredGroups,
  run,
} = require('../src/index')

const MOCK_BODY_INCOMPLETE = fs.readFileSync(path.join(__dirname, 'mock_body_incomplete.txt'), 'utf8')
const MOCK_BODY_COMPLETED = fs.readFileSync(path.join(__dirname, 'mock_body_completed.txt'), 'utf8')

const EXPECTED_REQUIRED_TASK_MATCH = [
  '\n- [X] required task 1',
  '\n- [ ] required task 2',
  '\n- [x] required task 3\n- [ ] required task 4',
  '\n  - [ ] required task 5\n  - [X] required task 6\n  - [X] required task 7\n  - [X] required task 8\n  - [ ] required task 9\n  - [X] required task 10',
]

const EXPECTED_REQUIRED_GROUP_MATCH = [
  '\n- [ ] required task 1 (group 1)\n- [ ] required task 2 (group 1)',
  '\n- [X] required task 3 (group 2)\n- [ ] required task 4 (group 2)',
  '\n- [ ] required task 5 (group 3)\n- [X] required task 6 (group 3)\n- [ ] required task 7 (group 3)',
  '\n  - [ ] required task 8 (group 4)\n- [ ] required task 9 (group 4)\n  - [ ] required task 10 (group 4)\n    - [ ] required task 11 (group 4)',
]


describe('#REQUIRED_TASK_PATTERN', () => {
  it('matches only required tasks', () => {
    expect(MOCK_BODY_INCOMPLETE.match(REQUIRED_TASK_PATTERN)).toEqual(EXPECTED_REQUIRED_TASK_MATCH)
  })
})

describe('#REQUIRED_GROUP_PATTERN', () => {
  it('matches only required tasks', () => {
    expect(MOCK_BODY_INCOMPLETE.match(REQUIRED_GROUP_PATTERN)).toEqual(EXPECTED_REQUIRED_GROUP_MATCH)
  })
})

describe('#getIncompleteRequiredTasks', () => {
  it('returns an array of incomplete required tasks', () => {
    const incompleteTasks = getIncompleteRequiredTasks(MOCK_BODY_INCOMPLETE)
    expect(incompleteTasks).toEqual(['required task 2', 'required task 4', 'required task 5', 'required task 9'])
  })

  it('returns an empty array if all required tasks are complete', () => {
    const incompleteTasks = getIncompleteRequiredTasks(MOCK_BODY_COMPLETED)
    expect(incompleteTasks).toBeInstanceOf(Array)
    expect(incompleteTasks).toHaveLength(0)
  })
})

describe('#getIncompleteRequiredGroups', () => {
  it('returns an array of incomplete required groups', () => {
    const incompleteGroups = getIncompleteRequiredGroups(MOCK_BODY_INCOMPLETE)
    expect(incompleteGroups).toEqual([
      ['required task 1 (group 1)', 'required task 2 (group 1)'],
      [
        'required task 8 (group 4)',
        'required task 9 (group 4)',
        'required task 10 (group 4)',
        'required task 11 (group 4)',
      ],
    ])
  })

  it('returns an empty array if all required tasks are complete', () => {
    const incompleteGroups = getIncompleteRequiredGroups(MOCK_BODY_COMPLETED)
    expect(incompleteGroups).toBeInstanceOf(Array)
    expect(incompleteGroups).toHaveLength(0)
  })
})

describe('with incomplete required tasks', () => {
  let setFailedMock

  beforeEach(() => {
    setFailedMock = jest.spyOn(core, 'setFailed').mockImplementation()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('with incomplete required tasks', () => {
    beforeAll(() => {
      github.context.payload = { pull_request: { body: MOCK_BODY_INCOMPLETE } }
    })

    it('sets a failure message', () => {
      run()
      expect(setFailedMock).toHaveBeenCalledWith('Some required tasks are incomplete.')
    })
  })

  describe('with all required tasks completed', () => {
    beforeAll(() => {
      github.context.payload = { pull_request: { body: MOCK_BODY_COMPLETED } }
    })

    it('does not set a failure message', () => {
      run()
      expect(setFailedMock).toHaveBeenCalledTimes(0)
    })
  })
})
