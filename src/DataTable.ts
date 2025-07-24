/**
 * Represents the cells of a Gherkin data table associated with a test step.
 * @public
 * @remarks
 * For steps that include a data table, an instance of this will be injected as the last
 * argument to your step function.
 */
export class DataTable {
  constructor(private readonly cells: ReadonlyArray<ReadonlyArray<string>>) {}

  /**
   * Returns a copy of the raw cells, as a two-dimensional array.
   *
   * @example
   * ```typescript
   * const dataTable = new DataTable([
   *   ['a', 'b', 'c'],
   *   ['1', '2', '3'],
   *   ['4', '5', '6']
   * ])
   * console.log(dataTable.raw())
   * // [['a', 'b', 'c'], ['1', '2', '3'], ['4', '5', '6']]
   * ```
   */
  raw(): ReadonlyArray<ReadonlyArray<string>> {
    return structuredClone(this.cells)
  }

  /**
   * Returns a copy of the raw cells, as a two-dimensional array, with the first
   * (header) row omitted.
   *
   * @example
   * ```typescript
   * const dataTable = new DataTable([
   *   ['a', 'b', 'c'],
   *   ['1', '2', '3'],
   *   ['4', '5', '6']
   * ])
   * console.log(dataTable.rows())
   * // [['1', '2', '3'], ['4', '5', '6']]
   * ```
   */
  rows(): ReadonlyArray<ReadonlyArray<string>> {
    return this.raw().slice(1)
  }

  /**
   * Returns an array, with each item representing a row of the table as key/value
   * pairs using the header row for keys.
   *
   * @example
   * ```typescript
   * const dataTable = new DataTable([
   *   ['a', 'b', 'c'],
   *   ['1', '2', '3'],
   *   ['4', '5', '6'],
   *   ['7', '8', '9']
   * ])
   * console.log(dataTable.hashes())
   * // [
   * //   { a: '1', b: '2', c: '3' },
   * //   { a: '4', b: '5', c: '6' },
   * //   { a: '7', b: '8', c: '9' }
   * // ]
   * ```
   */
  hashes(): ReadonlyArray<Record<string, string>> {
    const [keys, ...rows] = this.raw()
    return rows.map((row) => {
      return row.reduce((acc, value, index) => {
        return {
          ...acc,
          [keys[index]]: value,
        }
      }, {})
    })
  }

  /**
   * Returns key/value pairs with keys from the first column and values from the second.
   * @remarks
   * For use with two-column data tables that represent key/value pairs.
   *
   * @example
   * ```typescript
   * const dataTable = new DataTable([
   *   ['Tom', '1'],
   *   ['Dick', '2'],
   *   ['Sally', '3']
   * ])
   * console.log(dataTable.rowsHash())
   * // { Tom: '1', Dick: '2', Sally: '3' }
   * ```
   *
   * @throws When not all rows have exactly 2 columns
   */
  rowsHash(): Record<string, string> {
    const cells = this.raw()
    if (!cells.every((row) => row.length === 2)) {
      throw new Error('All rows must have exactly 2 columns')
    }
    return cells.reduce<Record<string, string>>(
      (result, [key, value]) => ({
        ...result,
        [key]: value,
      }),
      {}
    )
  }

  /**
   * Returns an array, with each item being a cell value from the first/only column.
   * @remarks
   * For use with single-column data tables that represent a simple list.
   *
   * @example
   * ```typescript
   * const dataTable = new DataTable([
   *   ['foo'],
   *   ['bar'],
   *   ['baz']
   * ])
   * console.log(dataTable.list())
   * // ['foo', 'bar', 'baz']
   * ```
   *
   * @throws When not all rows have exactly 1 column
   */
  list(): ReadonlyArray<string> {
    const cells = this.raw()
    if (!cells.every((row) => row.length === 1)) {
      throw new Error('All rows must have exactly 1 column')
    }
    return cells.flat()
  }

  /**
   * Returns a fresh data table instance based on the cells being transposed.
   *
   * @example
   * ```typescript
   * const dataTable = new DataTable([
   *   ['a', 'b', 'c'],
   *   ['1', '2', '3']
   * ])
   * console.log(dataTable.transpose().raw())
   * // [['a', '1'], ['b', '2'], ['c', '3']]
   * ```
   */
  transpose(): DataTable {
    return new DataTable(this.cells[0].map((x, i) => this.cells.map((y) => y[i])))
  }
}
