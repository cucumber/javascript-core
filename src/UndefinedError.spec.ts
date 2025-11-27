import { PickleStep, Snippet } from '@cucumber/messages'
import { expect } from 'chai'

import { UndefinedStep } from './types'
import { UndefinedError } from './UndefinedError'

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

  it('should not include snippet text when snippets array is empty', () => {
    const pickleStep: PickleStep = {
      id: 'step-1',
      text: 'I do something that is not defined',
      astNodeIds: [],
    }

    const step: UndefinedStep = {
      type: 'undefined',
      pickleStep,
    }

    const error = new UndefinedError(step, [])
    expect(error.message).to.eq(
      'No matching step definitions found for text "I do something that is not defined"'
    )
  })

  it('should include snippets when provided', () => {
    const pickleStep: PickleStep = {
      id: 'step-1',
      text: 'I do something that is not defined',
      astNodeIds: [],
    }

    const step: UndefinedStep = {
      type: 'undefined',
      pickleStep,
    }

    const snippets: ReadonlyArray<Snippet> = [
      {
        language: 'javascript',
        code: 'Given("I do something that is not defined", function () {\n  // Write code here\n});',
      },
      {
        language: 'javascript',
        code: 'Given(/^I do something that is not defined$/, function () {\n  // Write code here\n});',
      },
    ]

    const error = new UndefinedError(step, snippets)
    expect(error.message).to.eq(
      `No matching step definitions found for text "I do something that is not defined"

You can implement the step with this code:

Given("I do something that is not defined", function () {
  // Write code here
});

Given(/^I do something that is not defined$/, function () {
  // Write code here
});`
    )
  })
})
