import { Snippet } from '@cucumber/messages'

import { UndefinedStep } from './types'

/**
 * Represents an error that occurs when no step definitions are found matching the text of a step
 * @public
 * @remarks
 * Can be useful where an {@link UndefinedStep} needs to bubble up as an error in the test framework
 * and have a helpful message for the end user.
 */
export class UndefinedError extends Error {
  constructor(step: UndefinedStep, snippets?: ReadonlyArray<Snippet>) {
    let message = `No matching step definitions found for text "${step.pickleStep.text}"`

    if (snippets?.length) {
      message +=
        '\n\nYou can implement the step with this code:\n\n' +
        snippets.map((snippet) => snippet.code).join('\n\n')
    }

    super(message)
  }
}
