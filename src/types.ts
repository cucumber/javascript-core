import {
  Argument,
  CucumberExpression,
  CucumberExpressionGenerator,
  RegularExpression,
} from '@cucumber/cucumber-expressions'
import {
  Envelope,
  GherkinDocument,
  Hook,
  IdGenerator,
  Pickle,
  PickleDocString,
  PickleTable,
  SourceReference,
  StepDefinition,
  TestCase,
  TestStep,
} from '@cucumber/messages'
import { NamingStrategy } from '@cucumber/query'
import parse from '@cucumber/tag-expressions'

/**
 * A function defined by the end user for a step or hook
 * @public
 */
export type SupportCodeFunction = (...args: any[]) => any | Promise<any> // eslint-disable-line @typescript-eslint/no-explicit-any

/**
 * Options to modify how support code is built
 * @public
 */
export interface SupportCodeOptions {
  /**
   * A function that will be used to generate unique identifiers
   * @default crypto.randomUUID
   */
  newId?: IdGenerator.NewId
}

/**
 * Attributes for creating a new parameter type
 * @public
 */
export interface NewParameterType {
  /**
   * The name of the parameter type
   */
  name: string
  /**
   * One or more regular expressions which should be used to match the parameter type
   */
  regexp: RegExp | string | readonly RegExp[] | readonly string[]
  /**
   * A function for transforming the matched values to another object before passing to
   * the step function
   * @param match - matched values from the regular expression
   * @remarks
   * If not provided, the raw matched value(s) will be passed to the step function.
   */
  transformer?: (...match: string[]) => unknown
  /**
   * Whether the parameter type should be used when suggesting snippets for missing step
   * definitions
   * @default true
   */
  useForSnippets?: boolean
  /**
   * Whether the regular expression(s) for the parameter type should take precedence if used
   * in conjunction with regular expressions for step definitions
   * @default false
   */
  preferForRegexpMatch?: boolean
  /**
   * A reference to the source code of the user-defined parameter
   */
  sourceReference: SourceReference
}

/**
 * Attributes for creating a new test case hook
 * @public
 */
export interface NewTestCaseHook {
  /**
   * Optional name for the hook
   */
  name?: string
  /**
   * Optional tag expression which, if not a match for a given scenario, will cause the hook
   * to be omitted from the test
   */
  tags?: string
  /**
   * The user-defined function for the hook
   */
  fn: SupportCodeFunction
  /**
   * A reference to the source code of the user-defined function
   */
  sourceReference: SourceReference
}

/**
 * Attributes for creating a new step definition
 * @public
 */
export interface NewStep {
  /**
   * Either a Cucumber Expression or regular expression used to match the step with steps from Gherkin
   */
  pattern: string | RegExp
  /**
   * The user-defined function for the step
   */
  fn: SupportCodeFunction
  /**
   * A reference to the source code of the user-defined function
   */
  sourceReference: SourceReference
}

/**
 * Attributes for creating a new test run hook
 * @public
 */
export interface NewTestRunHook {
  /**
   * Optional name for the hook
   */
  name?: string
  /**
   * The user-defined function for the hook
   */
  fn: SupportCodeFunction
  /**
   * A reference to the source code of the user-defined function
   */
  sourceReference: SourceReference
}

/**
 * Represents a parameter type that was referenced but not defined
 * @public
 */
export type UndefinedParameterType = {
  /**
   * The parameter type name being referenced
   */
  name: string
  /**
   * The expression in which the undefined parameter type was referenced
   */
  expression: string
}

/**
 * A parameter type that has been defined and is available for use
 * @public
 */
export type DefinedParameterType = {
  /**
   * A unique identifier for the parameter type
   */
  id: string
  /**
   * The name of the parameter type
   */
  name: string
  /**
   * One or more regular expressions that will be used to match the parameter type
   */
  regularExpressions: ReadonlyArray<string>
  /**
   * Whether the regular expression(s) for this parameter type will take precedence if used
   * in conjunction with regular expressions for step definitions
   */
  preferForRegularExpressionMatch: boolean
  /**
   * Whether this parameter type will be used when suggesting snippets for missing step
   * definitions
   */
  useForSnippets: boolean
  /**
   * A reference to the source code of the user-defined parameter type
   */
  sourceReference: SourceReference
}

/**
 * A test case hook that has been defined and is available for execution
 * @public
 */
export type DefinedTestCaseHook = {
  /**
   * A unique identifier for the hook
   */
  id: string
  /**
   * The name of the hook, if defined
   */
  name?: string
  /**
   * The tag expression for the hook, if defined, including both raw and compiled forms
   */
  tags?: {
    raw: string
    compiled: ReturnType<typeof parse>
  }
  /**
   * The user-defined function for the hook
   */
  fn: SupportCodeFunction
  /**
   * A reference to the source code of the user-defined function
   */
  sourceReference: SourceReference
  /**
   * Creates a Cucumber Message representing this hook
   */
  toMessage(): Hook
}

/**
 * A step definition that has been defined and is available for matching
 * @public
 */
export type DefinedStep = {
  /**
   * A unique identifier for the step
   */
  id: string
  /**
   * The text expression for the step, including both raw and compiled forms
   * @remarks
   * This may be a Cucumber Expression or a regular expression
   */
  expression: {
    raw: string | RegExp
    compiled: CucumberExpression | RegularExpression
  }
  /**
   * The user-defined function for the step
   */
  fn: SupportCodeFunction
  /**
   * A reference to the source code of the user-defined function
   */
  sourceReference: SourceReference
  /**
   * Creates a Cucumber Message representing this step definition
   */
  toMessage(): StepDefinition
}

/**
 * A test run hook that has been defined and is available for execution
 * @public
 */
export type DefinedTestRunHook = {
  /**
   * A unique identifier for the hook
   */
  id: string
  /**
   * The name of the hook, if defined
   */
  name?: string
  /**
   * The user-defined function for the hook
   */
  fn: SupportCodeFunction
  /**
   * A reference to the source code of the user-defined function
   */
  sourceReference: SourceReference
  /**
   * Creates a Cucumber Message representing this hook
   */
  toMessage(): Hook
}

/**
 * Builder for collecting user-defined support code
 * @public
 */
export interface SupportCodeBuilder {
  /**
   * Define a new parameter type
   */
  parameterType(options: NewParameterType): SupportCodeBuilder
  /**
   * Define a new before hook
   */
  beforeHook(options: NewTestCaseHook): SupportCodeBuilder
  /**
   * Define a new after hook
   */
  afterHook(options: NewTestCaseHook): SupportCodeBuilder
  /**
   * Define a new step
   */
  step(options: NewStep): SupportCodeBuilder
  /**
   * Define a new before all hook
   */
  beforeAllHook(options: NewTestRunHook): SupportCodeBuilder
  /**
   * Define a new after all hook
   */
  afterAllHook(options: NewTestRunHook): SupportCodeBuilder
  /**
   * Build and seal the support code library for use in {@link makeTestPlan}
   * @remarks
   * Includes validation of parameter types, step expressions, tag expressions, etc.
   */
  build(): SupportCodeLibrary
}

/**
 * Sealed library of support code that provides hooks and step definitions
 * @public
 */
export interface SupportCodeLibrary {
  /**
   * Find all Before hooks that match the given tags
   */
  findAllBeforeHooksBy(tags: ReadonlyArray<string>): ReadonlyArray<DefinedTestCaseHook>
  /**
   * Find all After hooks that match the given tags
   * @remarks
   * Hooks are returned in definition order. For execution, the order should be reversed.
   */
  findAllAfterHooksBy(tags: ReadonlyArray<string>): ReadonlyArray<DefinedTestCaseHook>
  /**
   * Find all step definitions whose expression is a match for the given text
   */
  findAllStepsBy(text: string): ReadonlyArray<MatchedStep>
  /**
   * Get all source references from the support code library
   */
  getAllSources(): ReadonlyArray<SourceReference>
  /**
   * Get a generator for Cucumber Expressions based on the currently defined parameter types
   */
  getExpressionGenerator(): CucumberExpressionGenerator
  /**
   * Get all BeforeAll hooks
   */
  getAllBeforeAllHooks(): ReadonlyArray<DefinedTestRunHook>
  /**
   * Get all AfterAll hooks
   */
  getAllAfterAllHooks(): ReadonlyArray<DefinedTestRunHook>
  /**
   * Produces a list of Cucumber Messages envelopes for the support code
   */
  toEnvelopes(): ReadonlyArray<Envelope>
}

/**
 * A step definition that has been matched to a pickle step
 * @public
 */
export type MatchedStep = {
  def: DefinedStep
  args: ReadonlyArray<Argument>
}

/**
 * Elements required to assemble a test plan
 * @public
 */
export interface TestPlanIngredients {
  /**
   * Identifier for the test run within which this plan will be executed
   */
  testRunStartedId?: string
  /**
   * The Gherkin document that has been processed
   */
  gherkinDocument: GherkinDocument
  /**
   * The pickles that have been compiled from the document
   */
  pickles: ReadonlyArray<Pickle>
  /**
   * The support code library that has been built
   */
  supportCodeLibrary: SupportCodeLibrary
}

/**
 * Options to modify how the test plan is assembled
 * @public
 */
export interface TestPlanOptions {
  /**
   * A function that will be used to generate unique identifiers
   * @default crypto.randomUUID
   */
  newId?: IdGenerator.NewId
  /**
   * The naming strategy to use when generating test case names
   * @default namingStrategy(NamingStrategyLength.LONG, NamingStrategyFeatureName.EXCLUDE, NamingStrategyExampleName.NUMBER)
   */
  strategy?: NamingStrategy
}

/**
 * A step that has been validated and prepared for execution
 * @public
 * @remarks
 * Depending on the characteristics of the Cucumber implementation, the
 * function may be called in a different way and with the args positioned
 * differently.
 */
export type PreparedStep = {
  /**
   * Discriminator field to identify this as a prepared step
   */
  type: 'prepared'
  /**
   * The user-authored function to be executed for this step
   */
  fn: SupportCodeFunction
  /**
   * The arguments to pass to the step, as cucumber-expressions argument objects
   */
  args: ReadonlyArray<Argument>
  /**
   * The data table to pass to the step, if there is one
   * @remarks
   * Use {@link DataTable.from} to turn this into a user-friendly object
   */
  dataTable?: PickleTable
  /**
   * The doc string to pass to the step, if there is one
   */
  docString?: PickleDocString
}

/**
 * A step that could not be matched to any step definitions
 * @public
 */
export type UndefinedStep = {
  /**
   * Discriminator field to identify this as an undefined step
   */
  type: 'undefined'
  /**
   * The pickle step that could not be matched
   */
  pickleStep: import('@cucumber/messages').PickleStep
}

/**
 * A step that was matched to multiple step definitions
 * @public
 */
export type AmbiguousStep = {
  /**
   * Discriminator field to identify this as an ambiguous step
   */
  type: 'ambiguous'
  /**
   * The pickle step that was ambiguous
   */
  pickleStep: import('@cucumber/messages').PickleStep
  /**
   * The step definitions that matched
   */
  matches: ReadonlyArray<DefinedStep>
}

/**
 * A test step that belongs to an {@link AssembledTestCase}
 * @public
 */
export interface AssembledTestStep {
  /**
   * A unique identifier for this test step
   */
  id: string
  /**
   * A non-unique name for this test step
   */
  name: {
    prefix: string
    body: string
  }
  /**
   * A reference to the source of this test step in the Gherkin document
   * @remarks
   * For pickle steps, this will be the line the step is on. For hook steps,
   * this will be the line the pickle is on.
   */
  sourceReference: SourceReference
  /**
   * Whether this test step should always be executed even if preceding ones fail
   */
  always: boolean
  /**
   * Prepare the test step for execution
   * @remarks
   * For pickle steps, preparation includes finding matching step definitions from
   * the support code library and returning the appropriate result. If there are no
   * matches, an {@link UndefinedStep} is returned. If there are multiple matches, an
   * {@link AmbiguousStep} is returned. Otherwise, a {@link PreparedStep} is returned
   * with the correct arguments from across expressions, doc strings and data tables.
   * The consumer can then call the function with the right arrangement of those arguments
   * plus anything else as appropriate.
   */
  prepare(): PreparedStep | UndefinedStep | AmbiguousStep
  /**
   * Converts the step to a TestStep message
   */
  toMessage(): TestStep
}

/**
 * A test case that has been assembled from hook and pickle steps
 * @public
 */
export interface AssembledTestCase {
  /**
   * A unique identifier for this test case
   */
  id: string
  /**
   * The id of the pickle from which this test case is derived
   */
  pickleId: string
  /**
   * A non-unique name for this test case
   * @remarks
   * This could vary depending on the supplied naming strategy.
   */
  name: string
  /**
   * A reference to the source of this test case in the Gherkin document
   */
  sourceReference: SourceReference
  /**
   * An ordered array of test steps to be executed for this test case
   */
  testSteps: ReadonlyArray<AssembledTestStep>
  /**
   * Converts the test case to a TestCase message
   */
  toMessage(): TestCase
}

/**
 * A test plan comprised of assembled test cases from a document
 * @public
 */
export interface AssembledTestPlan {
  /**
   * A non-unique name for this test plan
   * @remarks
   * This will be the feature name, or else the URI of the document, or else omitted.
   */
  name?: string
  /**
   * An ordered array of test cases to be executed in this plan
   */
  testCases: ReadonlyArray<AssembledTestCase>
  /**
   * Produces a list of Cucumber Messages envelopes for the test plan
   */
  toEnvelopes(): ReadonlyArray<Envelope>
}
