# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.8.3] - 2026-01-27
### Changed
- Allow ExpressionsGroup.children to be optional ([#43](https://github.com/cucumber/javascript-core/pull/43))

## [0.8.2] - 2026-01-12
### Changed
- Return messages in definition order ([#36](https://github.com/cucumber/javascript-core/pull/36))

## [0.8.1] - 2025-11-28
### Added
- Add `getAllSources()` method to `SupportCodeLibrary` ([#34r](https://github.com/cucumber/javascript-core/pull/34))

## [0.8.0] - 2025-11-25
### Changed
- BREAKING CHANGE: Make `prepare()` less prescriptive ([#32](https://github.com/cucumber/javascript-core/pull/32))

## [0.7.0] - 2025-11-19
### Changed
- Require messages v31 or greater ([#30](https://github.com/cucumber/javascript-core/pull/30))

## [0.6.0] - 2025-11-17
### Added
- Include `pickleId` in `AssembledTestCase` ([#26](https://github.com/cucumber/javascript-core/pull/26))

## [0.5.1] - 2025-09-17

## [0.5.0] - 2025-09-08
### Added
- Add `pickleStep` to `UndefinedError` ([#13](https://github.com/cucumber/javascript-core/pull/13))
- Add `getExpressionGenerator()` to `SupportCodeLibrary` ([#13](https://github.com/cucumber/javascript-core/pull/13))

## [0.4.1] - 2025-09-05
### Fixed
- Use RegExp.source to represent regular expression in messages ([#12](https://github.com/cucumber/javascript-core/pull/12))

## [0.4.0] - 2025-08-26
### Added
- Add global hooks ([#10](https://github.com/cucumber/javascript-core/pull/10))

## [0.3.0] - 2025-07-30
### Added
- Add `sourceReference` to test cases and test steps in plan ([#5](https://github.com/cucumber/javascript-core/pull/5))

### Changed
- BREAKING CHANGE: Rename `AssembledStep` to `AssembledTestStep` ([#5](https://github.com/cucumber/javascript-core/pull/5))

## [0.2.1] - 2025-07-24
### Fixed
- Make `testRunStartedId` optional ([#4](https://github.com/cucumber/javascript-core/pull/4))

## [0.2.0] - 2025-07-24
### Added
- BREAKING CHANGE: Add `testRunStartedId` to `TestPlanIngredients` ([#3](https://github.com/cucumber/javascript-core/pull/3))

## [0.1.0] - 2025-07-24
### Added
- Initial implementation ([#1](https://github.com/cucumber/javascript-core/pull/1))

[Unreleased]: https://github.com/cucumber/javascript-core/compare/v0.8.3...HEAD
[0.8.3]: https://github.com/cucumber/javascript-core/compare/v0.8.2...v0.8.3
[0.8.2]: https://github.com/cucumber/javascript-core/compare/v0.8.1...v0.8.2
[0.8.1]: https://github.com/cucumber/javascript-core/compare/v0.8.0...v0.8.1
[0.8.0]: https://github.com/cucumber/javascript-core/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/cucumber/javascript-core/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/cucumber/javascript-core/compare/v0.5.1...v0.6.0
[0.5.1]: https://github.com/cucumber/javascript-core/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/cucumber/javascript-core/compare/v0.4.1...v0.5.0
[0.4.1]: https://github.com/cucumber/javascript-core/compare/v0.4.0...v0.4.1
[0.4.0]: https://github.com/cucumber/javascript-core/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/cucumber/javascript-core/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/cucumber/javascript-core/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/cucumber/javascript-core/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/cucumber/javascript-core/compare/a08431c...v0.1.0
