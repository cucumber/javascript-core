import { expect } from 'chai'
import { describe, it } from 'mocha'

import { DataTable } from './DataTable'

describe('DataTable', () => {
  describe('raw', () => {
    it('should return a copy of the raw cells', () => {
      const cells = [
        ['a', 'b', 'c'],
        ['1', '2', '3'],
        ['4', '5', '6'],
      ]
      const dataTable = new DataTable(cells)
      expect(dataTable.raw()).to.deep.eq(cells)
      expect(dataTable.raw()).to.not.eq(cells)
    })
  })

  describe('rows', () => {
    it('returns a 2-D array without the header', () => {
      expect(
        new DataTable([
          ['a', 'b', 'c'],
          ['1', '2', '3'],
          ['4', '5', '6'],
        ]).rows()
      ).to.deep.eq([
        ['1', '2', '3'],
        ['4', '5', '6'],
      ])
    })
  })

  describe('hashes', () => {
    it('should produce an array of rows as objects, with keys from the first row', () => {
      expect(
        new DataTable([
          ['a', 'b', 'c'],
          ['1', '2', '3'],
          ['4', '5', '6'],
          ['7', '8', '9'],
        ]).hashes()
      ).to.deep.eq([
        { a: '1', b: '2', c: '3' },
        { a: '4', b: '5', c: '6' },
        { a: '7', b: '8', c: '9' },
      ])
    })
  })

  describe('rowsHash', () => {
    it('returns an object where the keys are the first column', () => {
      expect(
        new DataTable([
          ['Tom', '1'],
          ['Dick', '2'],
          ['Sally', '3'],
        ]).rowsHash()
      ).to.eql({
        Tom: '1',
        Dick: '2',
        Sally: '3',
      })
    })

    it('should throw when not all rows have 1 column', () => {
      expect(() => {
        new DataTable([
          ['Tom', '1'],
          ['Dick', '2', 'whoops'],
          ['Sally', '3'],
        ]).rowsHash()
      }).to.throw('All rows must have exactly 2 columns')
    })
  })

  describe('list', () => {
    it('should produce a list for a single column', () => {
      expect(new DataTable([['foo'], ['bar'], ['baz']]).list()).to.deep.eq(['foo', 'bar', 'baz'])
    })

    it('should throw when not all rows have 1 column', () => {
      expect(() => {
        new DataTable([['foo', 'bar'], ['baz']]).list()
      }).to.throw('All rows must have exactly 1 column')
    })
  })

  describe('transpose', () => {
    it('should transpose', () => {
      expect(
        new DataTable([
          ['a', 'b', 'c'],
          ['1', '2', '3'],
        ])
          .transpose()
          .raw()
      ).to.deep.eq([
        ['a', '1'],
        ['b', '2'],
        ['c', '3'],
      ])
    })
  })
})
