import {
  CucumberExpression,
  ParameterType,
  ParameterTypeRegistry,
  RegularExpression,
} from '@cucumber/cucumber-expressions'
import { HookType, StepDefinitionPatternType } from '@cucumber/messages'
import parse from '@cucumber/tag-expressions'

import { SupportCodeLibraryImpl } from './SupportCodeLibraryImpl'
import {
  DefinedParameterType,
  DefinedStep,
  DefinedTestCaseHook,
  DefinedTestRunHook,
  NewParameterType,
  NewStep,
  NewTestCaseHook,
  NewTestRunHook,
  SupportCodeBuilder,
  UndefinedParameterType,
} from './types'

type WithId<T> = { id: string } & T

/**
 * @internal
 */
export class SupportCodeBuilderImpl implements SupportCodeBuilder {
  private readonly parameterTypeRegistry = new ParameterTypeRegistry()
  private readonly undefinedParameterTypes: Map<string, Set<string>> = new Map()
  private readonly parameterTypes: Array<WithId<NewParameterType>> = []
  private readonly steps: Array<WithId<NewStep>> = []
  private readonly beforeHooks: Array<WithId<NewTestCaseHook>> = []
  private readonly afterHooks: Array<WithId<NewTestCaseHook>> = []
  private readonly beforeAllHooks: Array<WithId<NewTestRunHook>> = []
  private readonly afterAllHooks: Array<WithId<NewTestRunHook>> = []

  constructor(private readonly newId: () => string) {}

  parameterType(options: NewParameterType) {
    this.parameterTypes.push({
      id: this.newId(),
      ...options,
    })
    return this
  }

  beforeHook(options: NewTestCaseHook) {
    this.beforeHooks.push({
      id: this.newId(),
      ...options,
    })
    return this
  }

  afterHook(options: NewTestCaseHook) {
    this.afterHooks.push({
      id: this.newId(),
      ...options,
    })
    return this
  }

  step(options: NewStep) {
    this.steps.push({
      id: this.newId(),
      ...options,
    })
    return this
  }

  beforeAllHook(options: NewTestRunHook) {
    this.beforeAllHooks.push({
      id: this.newId(),
      ...options,
    })
    return this
  }

  afterAllHook(options: NewTestRunHook) {
    this.afterAllHooks.push({
      id: this.newId(),
      ...options,
    })
    return this
  }

  private buildParameterTypes(): ReadonlyArray<DefinedParameterType> {
    return this.parameterTypes.map((registered) => {
      const parameterType = new ParameterType(
        registered.name,
        registered.regexp,
        null,
        registered.transformer,
        registered.useForSnippets ?? true,
        registered.preferForRegexpMatch ?? false
      )
      this.parameterTypeRegistry.defineParameterType(parameterType)
      return {
        id: registered.id,
        name: registered.name,
        regularExpressions: [...parameterType.regexpStrings],
        preferForRegularExpressionMatch: parameterType.preferForRegexpMatch as boolean,
        useForSnippets: parameterType.useForSnippets as boolean,
        sourceReference: registered.sourceReference,
      }
    })
  }

  private buildSteps(): ReadonlyArray<DefinedStep> {
    return this.steps
      .map(({ id, pattern, fn, sourceReference }) => {
        const compiled = this.compileExpression(pattern)
        if (!compiled) {
          return undefined
        }
        return {
          id,
          expression: {
            raw: pattern,
            compiled,
          },
          fn,
          sourceReference,
          toMessage() {
            return {
              id,
              pattern: {
                type:
                  this.expression.compiled instanceof CucumberExpression
                    ? StepDefinitionPatternType.CUCUMBER_EXPRESSION
                    : StepDefinitionPatternType.REGULAR_EXPRESSION,
                source: pattern.toString(),
              },
              sourceReference,
            }
          },
        }
      })
      .filter((step) => !!step)
  }

  private compileExpression(
    text: string | RegExp
  ): CucumberExpression | RegularExpression | undefined {
    if (typeof text === 'string') {
      return this.compileCucumberExpression(text)
    }
    return new RegularExpression(text, this.parameterTypeRegistry)
  }

  private compileCucumberExpression(text: string): CucumberExpression | undefined {
    try {
      return new CucumberExpression(text, this.parameterTypeRegistry)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      if ('undefinedParameterTypeName' in e) {
        if (!this.undefinedParameterTypes.has(e.undefinedParameterTypeName)) {
          this.undefinedParameterTypes.set(e.undefinedParameterTypeName, new Set())
        }
        this.undefinedParameterTypes.get(e.undefinedParameterTypeName)?.add(text.toString())
        return undefined
      } else {
        throw e
      }
    }
  }

  private buildUndefinedParameterTypes(): ReadonlyArray<UndefinedParameterType> {
    return [...this.undefinedParameterTypes.entries()]
      .map(([name, expressions]) => {
        return [...expressions].map((expression) => ({ name, expression }))
      })
      .flat()
  }

  private buildBeforeHooks(): ReadonlyArray<DefinedTestCaseHook> {
    return this.beforeHooks.map(({ id, name, tags, fn, sourceReference }) => {
      return {
        id,
        name,
        tags: tags
          ? {
              raw: tags,
              compiled: parse(tags),
            }
          : undefined,
        fn,
        sourceReference,
        toMessage() {
          return {
            id,
            type: HookType.BEFORE_TEST_CASE,
            name,
            tagExpression: this.tags?.raw,
            sourceReference,
          }
        },
      }
    })
  }

  private buildAfterHooks(): ReadonlyArray<DefinedTestCaseHook> {
    return this.afterHooks.map(({ id, name, tags, fn, sourceReference }) => {
      return {
        id,
        name,
        tags: tags
          ? {
              raw: tags,
              compiled: parse(tags),
            }
          : undefined,
        fn,
        sourceReference,
        toMessage() {
          return {
            id,
            type: HookType.AFTER_TEST_CASE,
            name,
            tagExpression: this.tags?.raw,
            sourceReference,
          }
        },
      }
    })
  }

  private buildBeforeAllHooks(): ReadonlyArray<DefinedTestRunHook> {
    return this.beforeAllHooks.map(({ id, name, fn, sourceReference }) => {
      return {
        id,
        name,
        fn,
        sourceReference,
        toMessage() {
          return {
            id,
            type: HookType.BEFORE_TEST_RUN,
            name,
            sourceReference,
          }
        },
      }
    })
  }

  private buildAfterAllHooks(): ReadonlyArray<DefinedTestRunHook> {
    return this.afterAllHooks.map(({ id, name, fn, sourceReference }) => {
      return {
        id,
        name,
        fn,
        sourceReference,
        toMessage() {
          return {
            id,
            type: HookType.AFTER_TEST_RUN,
            name,
            sourceReference,
          }
        },
      }
    })
  }

  build() {
    return new SupportCodeLibraryImpl(
      this.buildParameterTypes(),
      this.buildSteps(),
      this.buildUndefinedParameterTypes(),
      this.buildBeforeHooks(),
      this.buildAfterHooks(),
      this.buildBeforeAllHooks(),
      this.buildAfterAllHooks()
    )
  }
}
