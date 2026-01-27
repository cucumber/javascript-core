import { IdGenerator } from '@cucumber/messages'
import { expect, use } from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'

import { parseGherkin } from '../test/parseGherkin'
import { buildSupportCode } from './buildSupportCode'
import { makeTestPlan } from './makeTestPlan'

use(sinonChai)

describe('makeTestPlan', () => {
  const testRunStartedId = 'run-id'
  let newId: () => string

  beforeEach(() => {
    newId = IdGenerator.incrementing()
  })

  describe('naming', () => {
    it('uses the feature name for the plan name', () => {
      const { gherkinDocument, pickles } = parseGherkin('minimal.feature', newId)
      const supportCodeLibrary = buildSupportCode({ newId }).build()

      const result = makeTestPlan(
        {
          testRunStartedId,
          gherkinDocument,
          pickles,
          supportCodeLibrary,
        },
        {
          newId,
        }
      )

      expect(result.name).to.eq('a feature')
    })

    it('falls back to the uri if the feature is unnamed', () => {
      const { gherkinDocument, pickles } = parseGherkin('unnamed.feature', newId)
      const supportCodeLibrary = buildSupportCode({ newId }).build()

      const result = makeTestPlan(
        {
          testRunStartedId,
          gherkinDocument,
          pickles,
          supportCodeLibrary,
        },
        {
          newId,
        }
      )

      expect(result.name).to.eq('features/unnamed.feature')
    })

    it('includes rule names and numbers examples', () => {
      const { gherkinDocument, pickles } = parseGherkin('naming.feature', newId)
      const supportCodeLibrary = buildSupportCode({ newId }).build()

      const result = makeTestPlan(
        { testRunStartedId, gherkinDocument, pickles, supportCodeLibrary },
        {
          newId,
        }
      )

      expect(result.testCases.map((tc) => tc.name)).to.deep.eq([
        'a rule - a parameterised scenario - under 5 - #1.1',
        'a rule - a parameterised scenario - under 5 - #1.2',
        'a rule - a parameterised scenario - under 5 - #1.3',
        'a rule - a parameterised scenario - under 5 - #1.4',
        'a rule - a parameterised scenario - 5 and above - #2.1',
        'a rule - a parameterised scenario - 5 and above - #2.2',
      ])
    })

    it('adheres to the supplied naming strategy', () => {
      const { gherkinDocument, pickles } = parseGherkin('naming.feature', newId)
      const supportCodeLibrary = buildSupportCode({ newId }).build()

      const result = makeTestPlan(
        { testRunStartedId, gherkinDocument, pickles, supportCodeLibrary },
        {
          newId,
          strategy: {
            reduce(lineage, pickle) {
              return `${pickle.id}: ${pickle.name}`
            },
          },
        }
      )

      expect(result.testCases.map((tc) => tc.name)).to.deep.eq([
        '14: a parameterised scenario',
        '16: a parameterised scenario',
        '18: a parameterised scenario',
        '20: a parameterised scenario',
        '22: a parameterised scenario',
        '24: a parameterised scenario',
      ])
    })
  })

  describe('pickle steps', () => {
    it('returns an ambiguous step when a step has multiple matches', () => {
      const { gherkinDocument, pickles } = parseGherkin('minimal.feature', newId)
      const supportCodeLibrary = buildSupportCode({ newId })
        .step({
          pattern: 'a step',
          fn: sinon.stub(),
          sourceReference: { uri: 'steps.js', location: { line: 1, column: 1 } },
        })
        .step({
          pattern: 'a step',
          fn: sinon.stub(),
          sourceReference: { uri: 'steps.js', location: { line: 2, column: 1 } },
        })
        .build()

      const result = makeTestPlan(
        { testRunStartedId, gherkinDocument, pickles, supportCodeLibrary },
        {
          newId,
        }
      )

      const prepared = result.testCases[0].testSteps[0].prepare()
      expect(prepared.type).to.eq('ambiguous')
      if (prepared.type === 'ambiguous') {
        expect(prepared.pickleStep).to.eq(pickles[0].steps[0])
        expect(prepared.matches).to.have.lengthOf(2)
      }
    })

    it('returns an undefined step when a step has no matches', () => {
      const { gherkinDocument, pickles } = parseGherkin('minimal.feature', newId)
      const supportCodeLibrary = buildSupportCode({ newId }).build()

      const result = makeTestPlan(
        { testRunStartedId, gherkinDocument, pickles, supportCodeLibrary },
        {
          newId,
        }
      )

      const prepared = result.testCases[0].testSteps[0].prepare()
      expect(prepared.type).to.eq('undefined')
      if (prepared.type === 'undefined') {
        expect(prepared.pickleStep).to.eq(pickles[0].steps[0])
      }
    })

    it('matches and prepares a step without parameters', () => {
      const fn = sinon.stub()

      const { gherkinDocument, pickles } = parseGherkin('minimal.feature', newId)
      const supportCodeLibrary = buildSupportCode({ newId })
        .step({
          pattern: 'a step',
          fn,
          sourceReference: { uri: 'steps.js', location: { line: 1, column: 1 } },
        })
        .build()

      const result = makeTestPlan(
        { testRunStartedId, gherkinDocument, pickles, supportCodeLibrary },
        {
          newId,
        }
      )

      const prepared = result.testCases[0].testSteps[0].prepare()
      expect(prepared.type).to.eq('prepared')
      if (prepared.type === 'prepared') {
        expect(prepared.fn).to.eq(fn)
        expect(prepared.args).to.deep.eq([])
      }
    })

    it('matches and prepares a step with parameters', () => {
      const fn = sinon.stub()

      const { gherkinDocument, pickles } = parseGherkin('parameters.feature', newId)
      const supportCodeLibrary = buildSupportCode({ newId })
        .step({
          pattern: 'we scored {int} out of {int}',
          fn,
          sourceReference: { uri: 'steps.js', location: { line: 1, column: 1 } },
        })
        .build()

      const result = makeTestPlan(
        { testRunStartedId, gherkinDocument, pickles, supportCodeLibrary },
        {
          newId,
        }
      )

      const prepared = result.testCases[0].testSteps[0].prepare()
      expect(prepared.type).to.eq('prepared')
      if (prepared.type === 'prepared') {
        expect(prepared.fn).to.eq(fn)
        expect(prepared.args.map((arg) => arg.getValue(undefined))).to.deep.eq([4, 5])
      }
    })

    it('matches and prepares a step with a data table', () => {
      const fn = sinon.stub()

      const { gherkinDocument, pickles } = parseGherkin('datatable.feature', newId)
      const supportCodeLibrary = buildSupportCode({ newId })
        .step({
          pattern: 'a bunch of data:',
          fn,
          sourceReference: { uri: 'steps.js', location: { line: 1, column: 1 } },
        })
        .build()

      const result = makeTestPlan(
        { testRunStartedId, gherkinDocument, pickles, supportCodeLibrary },
        {
          newId,
        }
      )

      const prepared = result.testCases[0].testSteps[0].prepare()
      expect(prepared.type).to.eq('prepared')
      if (prepared.type === 'prepared') {
        expect(prepared.fn).to.eq(fn)
        expect(prepared.args).to.deep.eq([])
        expect(prepared.dataTable).to.eq(pickles[0].steps[0].argument?.dataTable)
      }
    })

    it('matches and prepares a step with a doc string', () => {
      const fn = sinon.stub()

      const { gherkinDocument, pickles } = parseGherkin('docstring.feature', newId)
      const supportCodeLibrary = buildSupportCode({ newId })
        .step({
          pattern: 'a thing that says:',
          fn,
          sourceReference: { uri: 'steps.js', location: { line: 1, column: 1 } },
        })
        .build()

      const result = makeTestPlan(
        { testRunStartedId, gherkinDocument, pickles, supportCodeLibrary },
        {
          newId,
        }
      )

      const prepared = result.testCases[0].testSteps[0].prepare()
      expect(prepared.type).to.eq('prepared')
      if (prepared.type === 'prepared') {
        expect(prepared.fn).to.eq(fn)
        expect(prepared.args).to.deep.eq([])
        expect(prepared.docString).to.eq(pickles[0].steps[0].argument?.docString)
      }
    })
  })

  describe('hook steps', () => {
    it('prepends Before and After hooks in correct order', () => {
      const { gherkinDocument, pickles } = parseGherkin('minimal.feature', newId)
      const supportCodeLibrary = buildSupportCode({ newId })
        .beforeHook({
          name: 'setup 1',
          fn: sinon.stub(),
          sourceReference: { uri: 'hooks.js', location: { line: 1, column: 1 } },
        })
        .beforeHook({
          name: 'setup 2',
          fn: sinon.stub(),
          sourceReference: { uri: 'hooks.js', location: { line: 2, column: 1 } },
        })
        .afterHook({
          name: 'teardown 1',
          fn: sinon.stub(),
          sourceReference: { uri: 'hooks.js', location: { line: 3, column: 1 } },
        })
        .afterHook({
          name: 'teardown 2',
          fn: sinon.stub(),
          sourceReference: { uri: 'hooks.js', location: { line: 4, column: 1 } },
        })
        .step({
          pattern: 'a step',
          fn: sinon.stub(),
          sourceReference: { uri: 'steps.js', location: { line: 1, column: 1 } },
        })
        .build()

      const result = makeTestPlan(
        { testRunStartedId, gherkinDocument, pickles, supportCodeLibrary },
        {
          newId,
        }
      )

      expect(result.testCases[0].testSteps.map((step) => step.name)).to.deep.eq([
        // Before hooks in definition order
        { prefix: 'Before', body: 'setup 1' },
        { prefix: 'Before', body: 'setup 2' },
        // Pickle steps
        { prefix: 'Given', body: 'a step' },
        { prefix: 'When', body: 'a step' },
        { prefix: 'Then', body: 'a step' },
        // After hooks in reverse definition order
        { prefix: 'After', body: 'teardown 2' },
        { prefix: 'After', body: 'teardown 1' },
      ])
    })

    it('marks After hooks to always be executed', () => {
      const { gherkinDocument, pickles } = parseGherkin('minimal.feature', newId)
      const supportCodeLibrary = buildSupportCode({ newId })
        .beforeHook({
          name: 'setup 1',
          fn: sinon.stub(),
          sourceReference: { uri: 'hooks.js', location: { line: 1, column: 1 } },
        })
        .beforeHook({
          name: 'setup 2',
          fn: sinon.stub(),
          sourceReference: { uri: 'hooks.js', location: { line: 2, column: 1 } },
        })
        .afterHook({
          name: 'teardown 1',
          fn: sinon.stub(),
          sourceReference: { uri: 'hooks.js', location: { line: 3, column: 1 } },
        })
        .afterHook({
          name: 'teardown 2',
          fn: sinon.stub(),
          sourceReference: { uri: 'hooks.js', location: { line: 4, column: 1 } },
        })
        .step({
          pattern: 'a step',
          fn: sinon.stub(),
          sourceReference: { uri: 'steps.js', location: { line: 1, column: 1 } },
        })
        .build()

      const result = makeTestPlan(
        { testRunStartedId, gherkinDocument, pickles, supportCodeLibrary },
        {
          newId,
        }
      )

      expect(result.testCases[0].testSteps.map((step) => step.always)).to.deep.eq([
        // Before hooks
        false,
        false,
        // Pickle steps
        false,
        false,
        false,
        // After hooks
        true,
        true,
      ])
    })

    it('filters hooks based on tags', () => {
      const newId = IdGenerator.incrementing()
      const { gherkinDocument, pickles } = parseGherkin('tags.feature', newId)
      const supportCodeLibrary = buildSupportCode({ newId })
        .beforeHook({
          name: 'general setup',
          fn: sinon.stub(),
          sourceReference: { uri: 'hooks.js', location: { line: 1, column: 1 } },
        })
        .beforeHook({
          name: 'foo-only setup',
          tags: '@foo',
          fn: sinon.stub(),
          sourceReference: { uri: 'hooks.js', location: { line: 2, column: 1 } },
        })
        .beforeHook({
          name: 'non-foo setup',
          tags: 'not @foo',
          fn: sinon.stub(),
          sourceReference: { uri: 'hooks.js', location: { line: 3, column: 1 } },
        })
        .afterHook({
          name: 'general teardown',
          fn: sinon.stub(),
          sourceReference: { uri: 'hooks.js', location: { line: 4, column: 1 } },
        })
        .afterHook({
          name: 'foo-only teardown',
          tags: '@foo',
          fn: sinon.stub(),
          sourceReference: { uri: 'hooks.js', location: { line: 5, column: 1 } },
        })
        .afterHook({
          name: 'non-foo teardown',
          tags: 'not @foo',
          fn: sinon.stub(),
          sourceReference: { uri: 'hooks.js', location: { line: 6, column: 1 } },
        })
        .step({
          pattern: 'a step',
          fn: sinon.stub(),
          sourceReference: { uri: 'steps.js', location: { line: 1, column: 1 } },
        })
        .build()

      const result = makeTestPlan(
        { testRunStartedId, gherkinDocument, pickles, supportCodeLibrary },
        {
          newId,
        }
      )

      expect(result.testCases[0].testSteps.map((step) => step.name)).to.deep.eq([
        // Before hooks matched
        { prefix: 'Before', body: 'general setup' },
        { prefix: 'Before', body: 'foo-only setup' },
        // Pickle steps
        { prefix: 'Given', body: 'a step' },
        { prefix: 'When', body: 'a step' },
        { prefix: 'Then', body: 'a step' },
        // Before hooks matched
        { prefix: 'After', body: 'foo-only teardown' },
        { prefix: 'After', body: 'general teardown' },
      ])
    })

    it('prepares Before hooks for execution', () => {
      const fn = sinon.stub()
      const { gherkinDocument, pickles } = parseGherkin('minimal.feature', newId)
      const supportCodeLibrary = buildSupportCode({ newId })
        .beforeHook({
          fn,
          sourceReference: { uri: 'hooks.js', location: { line: 1, column: 1 } },
        })
        .step({
          pattern: 'a step',
          fn: sinon.stub(),
          sourceReference: { uri: 'steps.js', location: { line: 1, column: 1 } },
        })
        .build()

      const result = makeTestPlan(
        { testRunStartedId, gherkinDocument, pickles, supportCodeLibrary },
        {
          newId,
        }
      )

      const prepared = result.testCases[0].testSteps[0].prepare()
      expect(prepared.type).to.eq('prepared')
      if (prepared.type === 'prepared') {
        expect(prepared.fn).to.eq(fn)
        expect(prepared.args).to.deep.eq([])
      }
    })

    it('prepares After hooks for execution', () => {
      const fn = sinon.stub()

      const { gherkinDocument, pickles } = parseGherkin('minimal.feature', newId)
      const supportCodeLibrary = buildSupportCode({ newId })
        .afterHook({
          fn,
          sourceReference: { uri: 'hooks.js', location: { line: 1, column: 1 } },
        })
        .step({
          pattern: 'a step',
          fn: sinon.stub(),
          sourceReference: { uri: 'steps.js', location: { line: 1, column: 1 } },
        })
        .build()

      const result = makeTestPlan(
        { testRunStartedId, gherkinDocument, pickles, supportCodeLibrary },
        {
          newId,
        }
      )

      const prepared = result.testCases[0].testSteps[3].prepare()
      expect(prepared.type).to.eq('prepared')
      if (prepared.type === 'prepared') {
        expect(prepared.fn).to.eq(fn)
        expect(prepared.args).to.deep.eq([])
      }
    })
  })

  describe('source references', () => {
    it('includes correct source references with test cases and test steps', () => {
      const { gherkinDocument, pickles } = parseGherkin('minimal.feature', newId)
      const supportCodeLibrary = buildSupportCode({ newId })
        .beforeHook({
          fn: sinon.stub(),
          sourceReference: { uri: 'hooks.js', location: { line: 1, column: 1 } },
        })
        .step({
          pattern: 'a step',
          fn: sinon.stub(),
          sourceReference: { uri: 'steps.js', location: { line: 1, column: 1 } },
        })
        .build()

      const result = makeTestPlan(
        { testRunStartedId, gherkinDocument, pickles, supportCodeLibrary },
        {
          newId,
        }
      )
      // sourceReference on test case is for scenario/example
      expect(result.testCases[0].sourceReference).to.deep.eq({
        uri: 'features/minimal.feature',
        location: {
          line: 2,
          column: 3,
        },
      })
      // sourceReference on hook step is for the scenario/example
      expect(result.testCases[0].testSteps[0].sourceReference).to.deep.eq({
        uri: 'features/minimal.feature',
        location: {
          line: 2,
          column: 3,
        },
      })
      // sourceReference on pickle step is for the gherkin step
      expect(result.testCases[0].testSteps[1].sourceReference).to.deep.eq({
        uri: 'features/minimal.feature',
        location: {
          line: 3,
          column: 5,
        },
      })
    })
  })

  describe('messages', () => {
    it('produces the correct envelopes', () => {
      const { gherkinDocument, pickles } = parseGherkin('parameters.feature', newId)
      const supportCodeLibrary = buildSupportCode({ newId })
        .beforeHook({
          fn: sinon.stub(),
          sourceReference: { uri: 'hooks.js', location: { line: 1, column: 1 } },
        })
        .afterHook({
          fn: sinon.stub(),
          sourceReference: { uri: 'hooks.js', location: { line: 2, column: 1 } },
        })
        .step({
          pattern: 'we scored {int} out of {int}',
          fn: sinon.stub(),
          sourceReference: { uri: 'steps.js', location: { line: 1, column: 1 } },
        })
        .build()

      const result = makeTestPlan(
        { testRunStartedId, gherkinDocument, pickles, supportCodeLibrary },
        {
          newId,
        }
      )

      expect(result.toEnvelopes()).to.deep.eq([
        {
          testCase: {
            id: '7',
            pickleId: '3',
            testSteps: [
              {
                hookId: '4',
                id: '8',
              },
              {
                id: '9',
                pickleStepId: '2',
                stepDefinitionIds: ['6'],
                stepMatchArgumentsLists: [
                  {
                    stepMatchArguments: [
                      {
                        group: {
                          start: 10,
                          value: '4',
                        },
                        parameterTypeName: 'int',
                      },
                      {
                        group: {
                          start: 19,
                          value: '5',
                        },
                        parameterTypeName: 'int',
                      },
                    ],
                  },
                ],
              },
              {
                hookId: '5',
                id: '10',
              },
            ],
            testRunStartedId,
          },
        },
      ])
    })
  })
})
