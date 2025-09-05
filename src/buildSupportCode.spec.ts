import { CucumberExpression, RegularExpression } from '@cucumber/cucumber-expressions'
import { IdGenerator, StepDefinitionPatternType } from '@cucumber/messages'
import { expect } from 'chai'
import sinon from 'sinon'

import { buildSupportCode } from './buildSupportCode'
import { SupportCodeLibrary } from './types'

describe('buildSupportCode', () => {
  let newId: () => string

  beforeEach(() => {
    newId = IdGenerator.incrementing()
  })

  describe('test case hooks', () => {
    let library: SupportCodeLibrary
    beforeEach(() => {
      library = buildSupportCode({ newId: IdGenerator.incrementing() })
        .beforeHook({
          name: 'general setup',
          fn: sinon.stub(),
          sourceReference: { uri: 'hooks.js', location: { line: 1, column: 1 } },
        })
        .beforeHook({
          name: 'smoke setup',
          tags: '@smoke',
          fn: sinon.stub(),
          sourceReference: { uri: 'hooks.js', location: { line: 2, column: 1 } },
        })
        .beforeHook({
          name: 'regression setup',
          tags: '@regression',
          fn: sinon.stub(),
          sourceReference: { uri: 'hooks.js', location: { line: 3, column: 1 } },
        })
        .afterHook({
          name: 'general teardown',
          fn: sinon.stub(),
          sourceReference: { uri: 'hooks.js', location: { line: 4, column: 1 } },
        })
        .afterHook({
          name: 'smoke teardown',
          tags: '@smoke',
          fn: sinon.stub(),
          sourceReference: { uri: 'hooks.js', location: { line: 5, column: 1 } },
        })
        .afterHook({
          name: 'regression teardown',
          tags: '@regression',
          fn: sinon.stub(),
          sourceReference: { uri: 'hooks.js', location: { line: 6, column: 1 } },
        })
        .build()
    })

    it('filters Before hooks correctly when no tags specified', () => {
      const hooks = library.findAllBeforeHooksBy([])
      expect(hooks).to.have.lengthOf(1)
      expect(hooks[0].name).to.eq('general setup')
    })

    it('filters Before hooks correctly when tags specified', () => {
      const hooks = library.findAllBeforeHooksBy(['@smoke'])
      expect(hooks).to.have.lengthOf(2)
      expect(hooks[0].name).to.eq('general setup')
      expect(hooks[1].name).to.eq('smoke setup')
    })

    it('filters After hooks correctly when no tags specified', () => {
      const hooks = library.findAllAfterHooksBy([])
      expect(hooks).to.have.lengthOf(1)
      expect(hooks[0].name).to.eq('general teardown')
    })

    it('filters After hooks correctly when tags specified', () => {
      const hooks = library.findAllAfterHooksBy(['@smoke'])
      expect(hooks).to.have.lengthOf(2)
      expect(hooks[0].name).to.eq('general teardown')
      expect(hooks[1].name).to.eq('smoke teardown')
    })

    it('produces correct envelopes', () => {
      expect(library.toEnvelopes()).to.deep.eq([
        {
          hook: {
            id: '0',
            type: 'BEFORE_TEST_CASE',
            name: 'general setup',
            tagExpression: undefined,
            sourceReference: { uri: 'hooks.js', location: { line: 1, column: 1 } },
          },
        },
        {
          hook: {
            id: '1',
            type: 'BEFORE_TEST_CASE',
            name: 'smoke setup',
            tagExpression: '@smoke',
            sourceReference: { uri: 'hooks.js', location: { line: 2, column: 1 } },
          },
        },
        {
          hook: {
            id: '2',
            type: 'BEFORE_TEST_CASE',
            name: 'regression setup',
            tagExpression: '@regression',
            sourceReference: { uri: 'hooks.js', location: { line: 3, column: 1 } },
          },
        },
        {
          hook: {
            id: '3',
            type: 'AFTER_TEST_CASE',
            name: 'general teardown',
            tagExpression: undefined,
            sourceReference: { uri: 'hooks.js', location: { line: 4, column: 1 } },
          },
        },
        {
          hook: {
            id: '4',
            type: 'AFTER_TEST_CASE',
            name: 'smoke teardown',
            tagExpression: '@smoke',
            sourceReference: { uri: 'hooks.js', location: { line: 5, column: 1 } },
          },
        },
        {
          hook: {
            id: '5',
            type: 'AFTER_TEST_CASE',
            name: 'regression teardown',
            tagExpression: '@regression',
            sourceReference: { uri: 'hooks.js', location: { line: 6, column: 1 } },
          },
        },
      ])
    })
  })

  describe('steps', () => {
    it('catches undefined parameter type errors and emits an appropriate message', () => {
      expect(
        buildSupportCode({ newId })
          .step({
            pattern: 'a {thing} happens',
            fn: sinon.stub(),
            sourceReference: { uri: 'steps.js', location: { line: 1, column: 1 } },
          })
          .build()
          .toEnvelopes()
      ).to.deep.eq([
        {
          undefinedParameterType: {
            expression: 'a {thing} happens',
            name: 'thing',
          },
        },
      ])
    })

    it('allows errors from expression compilation to bubble', () => {
      expect(() =>
        buildSupportCode({ newId })
          .step({
            pattern: '{{bad',
            fn: sinon.stub(),
            sourceReference: { uri: 'steps.js', location: { line: 1, column: 1 } },
          })
          .build()
      ).to.throw()
    })

    it('handles cucumber expressions', () => {
      const library = buildSupportCode({ newId })
        .step({
          pattern: 'there are {int} widgets',
          fn: sinon.stub(),
          sourceReference: { uri: 'steps.js', location: { line: 1, column: 1 } },
        })
        .build()
      const matchedSteps = library.findAllStepsBy('there are 17 widgets')

      expect(matchedSteps.length).to.eq(1)
      expect(matchedSteps[0].def.expression.compiled).to.be.instanceof(CucumberExpression)
      expect(matchedSteps[0].args.length).to.eq(1)
      expect(matchedSteps[0].args[0].getValue(undefined)).to.eq(17)
      expect(library.toEnvelopes()).to.deep.eq([
        {
          stepDefinition: {
            id: '0',
            pattern: {
              source: 'there are {int} widgets',
              type: StepDefinitionPatternType.CUCUMBER_EXPRESSION,
            },
            sourceReference: {
              location: {
                column: 1,
                line: 1,
              },
              uri: 'steps.js',
            },
          },
        },
      ])
    })

    it('handles regular expressions', () => {
      const library = buildSupportCode({ newId })
        .step({
          pattern: /there are (\d+) widgets/,
          fn: sinon.stub(),
          sourceReference: { uri: 'steps.js', location: { line: 1, column: 1 } },
        })
        .build()
      const matchedSteps = library.findAllStepsBy('there are 17 widgets')

      expect(matchedSteps.length).to.eq(1)
      expect(matchedSteps[0].def.expression.compiled).to.be.instanceof(RegularExpression)
      expect(matchedSteps[0].args.length).to.eq(1)
      expect(matchedSteps[0].args[0].getValue(undefined)).to.eq(17)
      expect(library.toEnvelopes()).to.deep.eq([
        {
          stepDefinition: {
            id: '0',
            pattern: {
              source: 'there are (\\d+) widgets',
              type: StepDefinitionPatternType.REGULAR_EXPRESSION,
            },
            sourceReference: {
              location: {
                column: 1,
                line: 1,
              },
              uri: 'steps.js',
            },
          },
        },
      ])
    })

    it('handles regular expressions with flags', () => {
      const library = buildSupportCode({ newId })
        .step({
          pattern: /there are (\d+) widgets/i,
          fn: sinon.stub(),
          sourceReference: { uri: 'steps.js', location: { line: 1, column: 1 } },
        })
        .build()
      const matchedSteps = library.findAllStepsBy('there ARE 17 widgets')

      expect(matchedSteps.length).to.eq(1)
      expect(matchedSteps[0].def.expression.compiled).to.be.instanceof(RegularExpression)
      expect(matchedSteps[0].args.length).to.eq(1)
      expect(matchedSteps[0].args[0].getValue(undefined)).to.eq(17)
      expect(library.toEnvelopes()).to.deep.eq([
        {
          stepDefinition: {
            id: '0',
            pattern: {
              source: '/there are (\\d+) widgets/i',
              type: StepDefinitionPatternType.REGULAR_EXPRESSION,
            },
            sourceReference: {
              location: {
                column: 1,
                line: 1,
              },
              uri: 'steps.js',
            },
          },
        },
      ])
    })
  })

  describe('parameter types', () => {
    it('correctly handles user-defined parameter types', () => {
      const library = buildSupportCode({ newId })
        .parameterType({
          name: 'flight',
          regexp: /([A-Z]{3})-([A-Z]{3})/,
          transformer(from: string, to: string) {
            return [from, to]
          },
          sourceReference: { uri: 'support.js', location: { line: 1, column: 1 } },
        })
        .step({
          pattern: '{flight} has been delayed',
          fn: sinon.stub(),
          sourceReference: { uri: 'steps.js', location: { line: 1, column: 1 } },
        })
        .build()

      const matchedSteps = library.findAllStepsBy('LHR-CDG has been delayed')
      expect(matchedSteps.length).to.eq(1)
      expect(matchedSteps[0].def.expression.compiled).to.be.instanceof(CucumberExpression)
      expect(matchedSteps[0].args.length).to.eq(1)
      expect(matchedSteps[0].args[0].getValue(undefined)).to.deep.eq(['LHR', 'CDG'])
      expect(library.toEnvelopes()).to.deep.eq([
        {
          parameterType: {
            id: '0',
            name: 'flight',
            preferForRegularExpressionMatch: false,
            regularExpressions: ['([A-Z]{3})-([A-Z]{3})'],
            sourceReference: {
              location: {
                column: 1,
                line: 1,
              },
              uri: 'support.js',
            },
            useForSnippets: true,
          },
        },
        {
          stepDefinition: {
            id: '1',
            pattern: {
              source: '{flight} has been delayed',
              type: StepDefinitionPatternType.CUCUMBER_EXPRESSION,
            },
            sourceReference: {
              location: {
                column: 1,
                line: 1,
              },
              uri: 'steps.js',
            },
          },
        },
      ])
    })
  })

  describe('test run hooks', () => {
    let library: SupportCodeLibrary
    beforeEach(() => {
      library = buildSupportCode({ newId: IdGenerator.incrementing() })
        .beforeAllHook({
          name: 'setup 1',
          fn: sinon.stub(),
          sourceReference: { uri: 'hooks.js', location: { line: 1, column: 1 } },
        })
        .beforeAllHook({
          name: 'setup 2',
          fn: sinon.stub(),
          sourceReference: { uri: 'hooks.js', location: { line: 2, column: 1 } },
        })
        .afterAllHook({
          name: 'teardown 1',
          fn: sinon.stub(),
          sourceReference: { uri: 'hooks.js', location: { line: 3, column: 1 } },
        })
        .afterAllHook({
          name: 'teardown 2',
          fn: sinon.stub(),
          sourceReference: { uri: 'hooks.js', location: { line: 4, column: 1 } },
        })
        .build()
    })

    it('gets just before all hooks', () => {
      expect(library.getAllBeforeAllHooks().map((hook) => hook.name)).to.deep.eq([
        'setup 1',
        'setup 2',
      ])
    })

    it('gets just after all hooks', () => {
      expect(library.getAllAfterAllHooks().map((hook) => hook.name)).to.deep.eq([
        'teardown 1',
        'teardown 2',
      ])
    })

    it('produces correct envelopes', () => {
      expect(library.toEnvelopes()).to.deep.eq([
        {
          hook: {
            id: '0',
            type: 'BEFORE_TEST_RUN',
            name: 'setup 1',
            sourceReference: { uri: 'hooks.js', location: { line: 1, column: 1 } },
          },
        },
        {
          hook: {
            id: '1',
            type: 'BEFORE_TEST_RUN',
            name: 'setup 2',
            sourceReference: { uri: 'hooks.js', location: { line: 2, column: 1 } },
          },
        },
        {
          hook: {
            id: '2',
            type: 'AFTER_TEST_RUN',
            name: 'teardown 1',
            sourceReference: { uri: 'hooks.js', location: { line: 3, column: 1 } },
          },
        },
        {
          hook: {
            id: '3',
            type: 'AFTER_TEST_RUN',
            name: 'teardown 2',
            sourceReference: { uri: 'hooks.js', location: { line: 4, column: 1 } },
          },
        },
      ])
    })
  })
})
