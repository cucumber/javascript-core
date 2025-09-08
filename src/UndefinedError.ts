import { PickleStep } from '@cucumber/messages'

/**
 * Represents an error that occurs when no step definitions are found matching the text of a step
 * @public
 */
export class UndefinedError extends Error {
  constructor(public readonly pickleStep: PickleStep) {
    super(`No matching step definitions found for text "${pickleStep.text}"`)
  }
}
