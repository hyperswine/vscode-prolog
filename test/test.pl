say_hi :-
  prompt(_, 'What\'syourname?'),
    read_line_to_string(current_input, Name),
    format('Hello, ~s!~n', Name).

random_score :-
  X is random(100),
  (X > 50 -> writeln(big);	writeln(small)).
