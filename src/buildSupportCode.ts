import { IdGenerator } from '@cucumber/messages'

import { SupportCodeBuilderImpl } from './SupportCodeBuilderImpl'
import { SupportCodeBuilder, SupportCodeOptions } from './types'

/**
 * Start building up a library user-defined support code
 * @public
 */
export function buildSupportCode(options: SupportCodeOptions = {}): SupportCodeBuilder {
  const { newId = IdGenerator.uuid() } = options
  return new SupportCodeBuilderImpl(newId)
}
