Feature: a feature
  Rule: a rule
    Scenario Outline: a parameterised scenario
      Given a widget with <count> things
      Examples: under 5
        | count |
        | 1     |
        | 2     |
        | 3     |
        | 4     |
      Examples: 5 and above
        | count |
        | 5     |
        | 10    |