import { CucumberExpressionGenerator, ParameterTypeRegistry } from '@cucumber/cucumber-expressions'
import { Envelope, SourceReference } from '@cucumber/messages'

import {
  DefinedParameterType,
  DefinedStep,
  DefinedTestCaseHook,
  DefinedTestRunHook,
  MatchedStep,
  SupportCodeLibrary,
  UndefinedParameterType,
} from './types'

type OrderedEnvelope = {
  order: number
  envelope: Envelope
}

/**
 * @internal
 */
export class SupportCodeLibraryImpl implements SupportCodeLibrary {
  constructor(
    private readonly parameterTypeRegistry: ParameterTypeRegistry,
    private readonly parameterTypes: ReadonlyArray<DefinedParameterType> = [],
    private readonly steps: ReadonlyArray<DefinedStep> = [],
    private readonly undefinedParameterTypes: ReadonlyArray<UndefinedParameterType> = [],
    private readonly beforeHooks: ReadonlyArray<DefinedTestCaseHook> = [],
    private readonly afterHooks: ReadonlyArray<DefinedTestCaseHook> = [],
    private readonly beforeAllHooks: ReadonlyArray<DefinedTestRunHook> = [],
    private readonly afterAllHooks: ReadonlyArray<DefinedTestRunHook> = []
  ) {}

  findAllStepsBy(text: string) {
    const results: Array<MatchedStep> = []
    for (const def of this.steps) {
      const args = def.expression.compiled.match(text)
      if (args) {
        results.push({
          def,
          args,
        })
      }
    }
    return results
  }

  getExpressionGenerator(): CucumberExpressionGenerator {
    return new CucumberExpressionGenerator(() => this.parameterTypeRegistry.parameterTypes)
  }

  findAllBeforeHooksBy(tags: ReadonlyArray<string>) {
    return this.beforeHooks.filter((def) => {
      if (def.tags) {
        return def.tags.compiled.evaluate(tags as string[])
      }
      return true
    })
  }

  findAllAfterHooksBy(tags: ReadonlyArray<string>) {
    return this.afterHooks.filter((def) => {
      if (def.tags) {
        return def.tags.compiled.evaluate(tags as string[])
      }
      return true
    })
  }

  getAllSources(): ReadonlyArray<SourceReference> {
    return [
      ...this.parameterTypes.map((pt) => pt.sourceReference),
      ...this.steps.map((step) => step.sourceReference),
      ...this.beforeHooks.map((hook) => hook.sourceReference),
      ...this.afterHooks.map((hook) => hook.sourceReference),
      ...this.beforeAllHooks.map((hook) => hook.sourceReference),
      ...this.afterAllHooks.map((hook) => hook.sourceReference),
    ]
  }

  getAllBeforeAllHooks(): ReadonlyArray<DefinedTestRunHook> {
    return [...this.beforeAllHooks]
  }

  getAllAfterAllHooks(): ReadonlyArray<DefinedTestRunHook> {
    return [...this.afterAllHooks]
  }

  toEnvelopes() {
    const definedThings: ReadonlyArray<OrderedEnvelope> = [
      ...this.parameterTypes.map((definedParameterType) => {
        return {
          order: definedParameterType.order,
          envelope: {
            parameterType: definedParameterType.toMessage(),
          },
        }
      }),
      ...this.steps.map((definedStep) => {
        return {
          order: definedStep.order,
          envelope: {
            stepDefinition: definedStep.toMessage(),
          },
        }
      }),
      ...this.beforeHooks.map((definedHook) => {
        return {
          order: definedHook.order,
          envelope: {
            hook: definedHook.toMessage(),
          },
        }
      }),
      ...this.afterHooks.map((definedHook) => {
        return {
          order: definedHook.order,
          envelope: {
            hook: definedHook.toMessage(),
          },
        }
      }),
      ...this.beforeAllHooks.map((definedHook) => {
        return {
          order: definedHook.order,
          envelope: {
            hook: definedHook.toMessage(),
          },
        }
      }),
      ...this.afterAllHooks.map((definedHook) => {
        return {
          order: definedHook.order,
          envelope: {
            hook: definedHook.toMessage(),
          },
        }
      }),
    ]

    return [
      ...definedThings.toSorted((a, b) => a.order - b.order).map(({ envelope }) => envelope),
      ...this.undefinedParameterTypes.map((undefinedParameterType) => ({
        undefinedParameterType,
      })),
    ]
  }
}
