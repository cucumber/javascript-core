import {
  DefinedHook,
  DefinedParameterType,
  DefinedStep,
  MatchedStep,
  SupportCodeLibrary,
  UndefinedParameterType,
} from './types'

/**
 * @internal
 */
export class SupportCodeLibraryImpl implements SupportCodeLibrary {
  constructor(
    private readonly parameterTypes: ReadonlyArray<DefinedParameterType> = [],
    private readonly steps: ReadonlyArray<DefinedStep> = [],
    private readonly undefinedParameterTypes: ReadonlyArray<UndefinedParameterType> = [],
    private readonly beforeHooks: ReadonlyArray<DefinedHook> = [],
    private readonly afterHooks: ReadonlyArray<DefinedHook> = []
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

  toEnvelopes() {
    return [
      ...this.parameterTypes.map((parameterType) => ({ parameterType })),
      ...this.steps
        .map((definedStep) => definedStep.toMessage())
        .map((stepDefinition) => ({ stepDefinition })),
      ...this.undefinedParameterTypes.map((undefinedParameterType) => ({ undefinedParameterType })),
      ...this.beforeHooks.map((definedHook) => definedHook.toMessage()).map((hook) => ({ hook })),
      ...this.afterHooks.map((definedHook) => definedHook.toMessage()).map((hook) => ({ hook })),
    ]
  }
}
