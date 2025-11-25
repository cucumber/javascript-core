import { GherkinDocument, IdGenerator, Pickle } from '@cucumber/messages'
import fs from 'node:fs'
import path from 'node:path'
import { AstBuilder, compile, GherkinClassicTokenMatcher, Parser } from '@cucumber/gherkin'

export function parseGherkin(
  file: string,
  newId: () => string = IdGenerator.uuid()
): { gherkinDocument: GherkinDocument; pickles: ReadonlyArray<Pickle> } {
  const data = fs.readFileSync(path.join(__dirname, '..', 'testdata', file), { encoding: 'utf-8' })
  const builder = new AstBuilder(newId)
  const matcher = new GherkinClassicTokenMatcher()
  const parser = new Parser(builder, matcher)
  const uri = 'features/' + file
  const gherkinDocument = {
    uri,
    ...parser.parse(data),
  }
  const pickles = compile(gherkinDocument, uri, newId)
  return {
    gherkinDocument,
    pickles,
  }
}
