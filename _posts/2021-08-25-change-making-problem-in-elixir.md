---
layout: post
title: Change-Making Problem in Elixir
date: 2021-08-25 14:24 -0400
permalink: "/blog/change-making-problem-in-elixir"
description: >-
  The Change-Making Problem is common in interview settings.
  This post is a walk-through of the problem and my solution
  to the variation asked on the Exercism.io Elixir track.
keywords:
  - change making problem
  - make change
  - coins
  - coin problem
  - fewest number of coins
  - algorithm
  - dynamic programming
  - greedy algorithm
  - elixir
---

I've been having fun working through the [Elixir track on Exercism.io](https://exercism.io/tracks/elixir). I recently wrote a solution to the [Change-Making Problem](https://en.wikipedia.org/wiki/Change-making_problem), which is common in interview settings. This post is a walk-through of the problem and my solution to the variation on Exercism.

## The problem

Exercism asks the following:

> Correctly determine the fewest number of coins to be given to a customer such that the sum of the coins' value would equal the correct amount of change.

For example, using the coin denominations `[1, 5, 10]`, the fewest number of coins to make change for a given amount `12` would be 3 coins:  `[1, 1, 10]`.

```elixir
Change.generate([1, 5, 10], 12) # [1, 1, 10]
```

Twelve `1` coins would also yield the value `12`, but the question asks for the _fewest_ number of coins. Therefore, the list `[1, 1, 10]` is the **optimal** answer.

## Greedy approach

When first encountering this problem, it's natural to try a greedy approach, e.g.:

```elixir
def generate(coins, amount) do
  coins
  |> Enum.sort(:desc)
  |> find_optimal_change(amount, [])
end

defp find_optimal_change(_coins, 0, result) do
  result
end

defp find_optimal_change([coin | coins], amount, result) do
  case div(amount, coin) do
    0 ->
      find_optimal_change(coins, amount, result)

    quotient ->
      remaining_amount = rem(amount, coin)
      updated_result = add_coin_to_result(coin, result, quotient)
      find_optimal_change(coins, remaining_amount, updated_result)
  end
end

defp add_coin_to_result(coin, result, num_times) do
  coin |> List.duplicate(num_times) |> Enum.concat(result)
end
```

We iterate over the coins from largest coin to smallest, using a coin the maximum number of times without exceeding the amount (the greedy choice). We take the remaining amount and repeat the process using the next largest coin. When the remaining amount is `0`, we're done.

## A note on iteration

In Elixir, there are no loops; looping is performed by repeated function calls. Recursion often incurs additional memory overhead (stack allocations), however, Erlang/Elixir implement tail call optimization which avoids adding a new stack frame for certain types of function invocations. The `find_optimal_change` function in the greedy solution above calls itself repeatedly but because the invocation is the last expression in the function body, the runtime is able to use a constant amount of stack frames, essentially performing the same as a loop in other languages. Recursive calls defined this way will not overflow the stack or incur unnecessary memory overhead.

## The problem, revisited

The greedy solution works with coins of certain denominations, but what happens if we need to provide an optimal solution for any given set of coin denominations?

Our example above asks for the fewest number of coins to make change for `12`. If we change the `5` coin to a `6` such that our list of coin denominations is `[1, 6, 10]`, the greedy approach breaks down, incorrectly returning 3 coins (`[1, 1, 10]`) when the optimal answer is 2 coins (`[6, 6]`).

Solving for any set of coin denominations requires a different approach.

## Dynamic programming approach

The change-making problem is really just an excuse to get us flexing those **dynamic programming** muscles&mdash;reasoning about overlapping subproblems and memoization.

So, what does a dynamic programming solution to the change-making problem look like? At its most basic, we can think of an optimal solution for a given amount as being the optimal solution for a smaller amount plus some coin. For example, using our example inputs above, the optimal solution to making change for `12` is the fewest number of coins to make change for `6` plus the coin `6`. And the fewest number of coins to make change for `6` is simply the coin `6`, yielding the answer `[6, 6]`. (This idea is described quite well in [this YouTube video](https://www.youtube.com/watch?v=jgiZlGzXMBw).)

As is usually the case, the devil is in the (implementation) details. A naive implementation would have us computing the same subproblems multiple times, which is prohibitively expensive. This is where **memoization** enters the equation: what if we can lookup the answer to a subproblem if its already been computed rather than re-compute it? Memoization is the name for a technique that lets us do just that.

When dealing with subproblems, there are two high-level approaches: A _top-down_ approach and a _bottom-up_ approach. Top-down approach works backwards&mdash;usually involving recursion&mdash;whereas a bottom-up approach "starts from the beginning" and iteratively builds the result. Bottom-up approaches are typically more memory-efficient by avoiding the need for an additional stack data structure.

For this solution, we're going to use a bottom-up approach to build a data structure containing the optimal answer to all amounts less than or equal to the original amount. When we're done, we'll be able to return the answer for the original amount by simply looking up its value in the data structure.

## The solution

Our interface is a public function `generate` in a module `Change` which takes a list of coin denominations and an amount and returns a tuple. The tuple consists of either the atom `:error` and a message or the atom `:ok` and the list of coins in ascending order.

We'll start by handling a simple case and an edge case.

```elixir
def generate(_coins, amount) when amount < 0 do
  {:error, "cannot change"}
end

def generate(_coins, amount) when amount == 0 do
  {:ok, []}
end
```

When we're asked to make change for a negative number, we return an error. If given zero, we return the empty list.

Next, we try to find an optimal answer. If one does not exist, we return an error. Otherwise, we return the optimal answer (a list containing the fewest number of coins) in ascending order.

```elixir
def generate(coins, amount) when amount > 0 do
  case find_optimal_change(coins, amount) do
    nil ->
      {:error, "cannot change"}

    optimal_answer ->
      {:ok, Enum.sort(optimal_answer)}
  end
end
```

As mentioned in the section above, we're going to build a data structure (a [Map](https://hexdocs.pm/elixir/1.12/Map.html)) containing the optimal answers to all amounts less than or equal to the given amount. Once we've built the map, finding the answer reduces to a simple key/value lookup.

```elixir
defp find_optimal_change(coins, amount) do
  compute_optimal_change_map(coins, amount)
  |> Map.get(amount)
end
```

We build the map bottom-up, iterating over each amount starting with `1` and ending with the given `amount`. The order is important: we need the answers for smaller amounts first because we'll use them when computing the answers for larger amounts.

```elixir
defp compute_optimal_change_map(coins, amount) do
  1..amount
  |> Enum.reduce(%{}, &optimal_change_for_amount(&1, coins, &2))
end
```

To get the optimal change for a given amount, we need to iterate through the set of coins and compute an answer for each coin and the given amount. We do so by subtracting the coin value from the amount and looking up the optimal answer for the remaining amount. We'll have a potential answer for each coin and we'll need to choose the optimal one (the one with the fewest number of coins). Lastly, once we have a valid, optimal answer for a given amount, we'll need to store that computed answer in our map for use later on.

```elixir
defp optimal_change_for_amount(amount, coins, optimal_change_map) do
  answer = Enum.reduce(coins, nil, &optimal_change_for_coin(amount, &1, &2, optimal_change_map))

  case answer do
    nil ->
      optimal_change_map

    optimal_change_for_amount ->
      Map.put(optimal_change_map, amount, optimal_change_for_amount)
  end
end
```

In `optimal_change_for_amount`, we try to compute an optimal answer for the given amount by looking at how each coin will impact the result. If such an answer exists for the given amount, then it's our optimal answer and we add it to the map.

The core logic happens in `optimal_change_for_coin`:

```elixir
defp optimal_change_for_coin(amount, coin, current_answer, optimal_change_map) do
  case amount - coin do
    0 ->
      [coin]

    remaining_amount when is_map_key(optimal_change_map, remaining_amount) ->
      potential_answer = [coin | Map.get(optimal_change_map, remaining_amount)]
      choose_optimal(current_answer, potential_answer)

    _ ->
      current_answer
  end
end
```

`optimal_change_for_coin` is given the `amount`, a `coin`, a current best answer for the `amount`, and the `optimal_change_map` that we'll use to lookup previous answers.

We subtract `coin` from the `amount`. If the difference is `0`, then we know the optimal answer must be the list `[coin]` (we can't do better than 1 coin).

If the difference is a value for which we have previously computed an optimal answer (which also implies the difference is non-negative), then we add `coin` to that previous optimal answer to give us a new potential answer. We then choose between the current best answer or new potential answer, whichever has the fewer number of coins.

Lastly, if we cannot compute an answer for this coin and the given amount, we return whatever the current best answer is.

The `choose_optimal` function is implemented as follows:

```elixir
defp choose_optimal(nil, choice) do
  choice
end

defp choose_optimal(choice_1, choice_2) do
  Enum.min_by([choice_1, choice_2], &length/1)
end
```

With how we're calling `choose_optimal`, the first choice could be `nil`, so we account for that possibility by matching one of the function clauses on a `nil` first argument and handling it accordingly. Otherwise, we take the smaller of the two lists by comparing their `length`.

And now we have a working solution for all sets of coin denominations!

```elixir
{:ok, [6, 6]} = Change.generate([1, 6, 10], 12)
```

## Wrapping up

This post describes one variant of the making-change problem and my Elixir solution. There are other variants, such as computing the number of distinct ways one could make change for a given amount, though I personally like this variant better.

I've put my solution described here (both greedy and dynamic) in [this gist](https://gist.github.com/benjreinhart/62a9cd991e80743a3633a9032042e450). You can also see [my solution on Exercism](https://exercism.io/tracks/elixir/exercises/change/solutions/1bd891da84944ba0b34e4bf7d0ef7227).
