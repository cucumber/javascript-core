import { PickleStep } from '@cucumber/messages'
import { expect } from 'chai'

import { UndefinedError } from './UndefinedError'
import { UndefinedStep } from './types'

describe('UndefinedError', () => {
  it('should create an error message with the step text', () => {
    const pickleStep: PickleStep = {
      id: 'step-1',
      text: 'I do something that is not defined',
      astNodeIds: [],
    }

    const step: UndefinedStep = {
      type: 'undefined',
      pickleStep,
    }

    const error = new UndefinedError(step)
    expect(error.message).to.eq(
      'No matching step definitions found for text "I do something that is not defined"'
    )
  })
})
