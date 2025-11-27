import { AmbiguousStep } from './types'

/**
 * Represents an error that occurs when multiple step definitions are found matching the text of a step
 * @public
 * @remarks
 * Can be useful where an {@link AmbiguousStep} needs to bubble up as an error in the test framework
 * and have a helpful message for the end user.
 */
export class AmbiguousError extends Error {
  constructor(step: AmbiguousStep) {
    super(
      `Multiple matching step definitions found for text "${step.pickleStep.text}":` +
        '\n' +
        step.matches
          .map(
            (def, index) =>
              `${index + 1}) ${def.sourceReference.uri}:${def.sourceReference.location?.line ?? '?'}:${def.sourceReference.location?.column ?? '?'}`
          )
          .join('\n')
    )
  }
}
