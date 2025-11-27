import { UndefinedStep } from './types'

/**
 * Represents an error that occurs when no step definitions are found matching the text of a step
 * @public
 */
export class UndefinedError extends Error {
  constructor(step: UndefinedStep) {
    super(`No matching step definitions found for text "${step.pickleStep.text}"`)
  }
}
