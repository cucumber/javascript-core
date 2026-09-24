Feature: a feature
  Scenario: data table followed by doc string
    Given a step with both:
    | hello |
    """
    world
    """

  Scenario: doc string followed by data table
    Given a step with both:
    """
    hello
    """
    | world |
