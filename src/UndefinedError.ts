/**
 * Represents an error that occurs when no step definitions are found matching the text of a step
 * @public
 */
export class UndefinedError extends Error {
  constructor(text: string) {
    super(`No matching step definitions found for text "${text}"`)
  }
}
