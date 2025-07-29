import { Group as ExpressionsGroup } from '@cucumber/cucumber-expressions'
import {
  GherkinDocument,
  Group as MessagesGroup,
  IdGenerator,
  Location as MessagesLocation,
  Pickle,
  Step,
} from '@cucumber/messages'
import {
  Lineage,
  namingStrategy,
  NamingStrategyExampleName,
  NamingStrategyFeatureName,
  NamingStrategyLength,
  Query,
} from '@cucumber/query'

import { AmbiguousError } from './AmbiguousError'
import { DataTable } from './DataTable'
import {
  AssembledTestPlan,
  AssembledTestStep,
  SupportCodeLibrary,
  TestPlanIngredients,
  TestPlanOptions,
} from './types'
import { UndefinedError } from './UndefinedError'

/**
 * Make an executable test plan for a Gherkin document
 * @public
 */
export function makeTestPlan(
  ingredients: TestPlanIngredients,
  options: TestPlanOptions = {}
): AssembledTestPlan {
  const { testRunStartedId, gherkinDocument, pickles, supportCodeLibrary } = ingredients
  const {
    newId = IdGenerator.uuid(),
    strategy = namingStrategy(
      NamingStrategyLength.LONG,
      NamingStrategyFeatureName.EXCLUDE,
      NamingStrategyExampleName.NUMBER
    ),
  } = options
  const query = populateQuery(gherkinDocument, pickles)
  return {
    name: gherkinDocument.feature?.name || gherkinDocument.uri,
    testCases: pickles.map((pickle) => {
      const lineage = query.findLineageBy(pickle) as Lineage
      const location = query.findLocationOf(pickle) as MessagesLocation
      return {
        id: newId(),
        name: strategy.reduce(lineage, pickle),
        sourceReference: {
          uri: pickle.uri,
          location,
        },
        testSteps: [
          ...fromBeforeHooks(pickle, location, supportCodeLibrary, newId),
          ...fromPickleSteps(pickle, supportCodeLibrary, newId, query),
          ...fromAfterHooks(pickle, location, supportCodeLibrary, newId),
        ],
        toMessage() {
          return {
            id: this.id,
            pickleId: pickle.id,
            testSteps: this.testSteps.map((step) => step.toMessage()),
            testRunStartedId,
          }
        },
      }
    }),
    toEnvelopes() {
      return this.testCases.map((tc) => ({ testCase: tc.toMessage() }))
    },
  }
}

function populateQuery(gherkinDocument: GherkinDocument, pickles: ReadonlyArray<Pickle>) {
  const query = new Query()
  query.update({ gherkinDocument })
  pickles.forEach((pickle) => query.update({ pickle }))
  return query
}

function fromBeforeHooks(
  pickle: Pickle,
  location: MessagesLocation,
  supportCodeLibrary: SupportCodeLibrary,
  newId: () => string
): ReadonlyArray<AssembledTestStep> {
  return supportCodeLibrary.findAllBeforeHooksBy(pickle.tags.map((tag) => tag.name)).map((def) => {
    return {
      id: newId(),
      name: {
        prefix: 'Before',
        body: def.name ?? '',
      },
      sourceReference: {
        uri: pickle.uri,
        location,
      },
      always: false,
      prepare(thisArg) {
        return {
          fn: def.fn.bind(thisArg),
          args: [],
        }
      },
      toMessage() {
        return {
          id: this.id,
          hookId: def.id,
        }
      },
    }
  })
}

function fromAfterHooks(
  pickle: Pickle,
  location: MessagesLocation,
  supportCodeLibrary: SupportCodeLibrary,
  newId: () => string
): ReadonlyArray<AssembledTestStep> {
  return supportCodeLibrary
    .findAllAfterHooksBy(pickle.tags.map((tag) => tag.name))
    .toReversed()
    .map((def) => {
      return {
        id: newId(),
        name: {
          prefix: 'After',
          body: def.name ?? '',
        },
        sourceReference: {
          uri: pickle.uri,
          location,
        },
        always: true,
        prepare(thisArg) {
          return {
            fn: def.fn.bind(thisArg),
            args: [],
          }
        },
        toMessage() {
          return {
            id: this.id,
            hookId: def.id,
          }
        },
      }
    })
}

function fromPickleSteps(
  pickle: Pickle,
  supportCodeLibrary: SupportCodeLibrary,
  newId: () => string,
  query: Query
): ReadonlyArray<AssembledTestStep> {
  return pickle.steps.map((pickleStep) => {
    const step = query.findStepBy(pickleStep) as Step
    const matched = supportCodeLibrary.findAllStepsBy(pickleStep.text)
    return {
      id: newId(),
      name: {
        prefix: step.keyword.trim(),
        body: pickleStep.text,
      },
      sourceReference: {
        uri: pickle.uri,
        location: step.location,
      },
      always: false,
      prepare(thisArg) {
        if (matched.length < 1) {
          throw new UndefinedError(pickleStep.text)
        } else if (matched.length > 1) {
          throw new AmbiguousError(
            pickleStep.text,
            matched.map(({ def }) => def.sourceReference)
          )
        } else {
          const { def, args } = matched[0]
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const allArgs: Array<any> = args.map((arg) => arg.getValue(thisArg))
          if (pickleStep.argument?.dataTable) {
            allArgs.push(
              new DataTable(
                pickleStep.argument.dataTable.rows.map((row) => {
                  return row.cells.map((cell) => cell.value)
                })
              )
            )
          } else if (pickleStep.argument?.docString) {
            allArgs.push(pickleStep.argument.docString.content)
          }
          return {
            fn: def.fn.bind(thisArg),
            args: allArgs,
          }
        }
      },
      toMessage() {
        return {
          id: this.id,
          pickleStepId: pickleStep.id,
          stepDefinitionIds: matched.map(({ def }) => def.id),
          stepMatchArgumentsLists: matched.map(({ args }) => {
            return {
              stepMatchArguments: args.map((arg) => {
                return {
                  group: mapArgumentGroup(arg.group),
                  parameterTypeName: arg.parameterType.name,
                }
              }),
            }
          }),
        }
      },
    }
  })
}

function mapArgumentGroup(group: ExpressionsGroup): MessagesGroup {
  return {
    start: group.start,
    value: group.value,
    children: group.children.map((child) => mapArgumentGroup(child)),
  }
}
