import { SourceReference } from '@cucumber/messages'

/**
 * Represents an error that occurs when multiple step definitions are found matching the text of a step
 * @public
 */
export class AmbiguousError extends Error {
  constructor(text: string, references: ReadonlyArray<SourceReference>) {
    super(
      `Multiple matching step definitions found for text "${text}":` +
        '\n' +
        references
          .map(
            (ref, index) =>
              `${index + 1}) ${ref.uri}:${ref.location?.line ?? '?'}:${ref.location?.column ?? '?'}`
          )
          .join('\n')
    )
  }
}
