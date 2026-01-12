import { PickleStep, SourceReference } from '@cucumber/messages'
import { expect } from 'chai'
import sinon from 'sinon'

import { AmbiguousError } from './AmbiguousError'
import { AmbiguousStep, DefinedStep } from './types'

describe('AmbiguousError', () => {
  it('handles source references with and without locations', () => {
    const pickleStep: PickleStep = {
      id: 'step-1',
      text: 'text',
      astNodeIds: [],
    }

    const references: ReadonlyArray<SourceReference> = [
      { uri: 'steps.js', location: { line: 1, column: 2 } },
      { uri: 'steps.js', location: { line: 3, column: 4 } },
      { uri: 'mysterious.js' },
    ]

    const matches: ReadonlyArray<DefinedStep> = references.map((ref) => ({
      id: 'def-id',
      order: 0,
      expression: {
        raw: 'text',
        compiled: {} as any,
      },
      fn: sinon.stub(),
      sourceReference: ref,
      toMessage: sinon.stub(),
    }))

    const step: AmbiguousStep = {
      type: 'ambiguous',
      pickleStep,
      matches,
    }

    const error = new AmbiguousError(step)
    expect(error.message).to.equal(
      'Multiple matching step definitions found for text "text":\n' +
        '1) steps.js:1:2\n' +
        '2) steps.js:3:4\n' +
        '3) mysterious.js:?:?'
    )
  })
})
