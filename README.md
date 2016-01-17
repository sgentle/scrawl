Scrawl
======

Scrawl is a tool for interactive iterative geometric art, aka notebook doodles. It's intended to reproduce the playful, casual fun of drawing in the margins on top of today's soulless computation machines. You can view a [demo here](https://demos.samgentle.com/scrawl/)

The basic unit in Scrawl is a line. You start with a single line and a palette of tools, each of which generates more lines. Each line has a direction, length and angle that subsequent lines are created in relation to. That means that four uses of a right angle tool becomes a square, a half-size triangle tool used on a half-size triangle will add a quarter-size triangle, and so on.

You can rotate tools by pressing the button (or hotkey) repeatedly, which cycles in the following order: normal, reversed (the end and start are swapped), flipped (left and right rotations are swapped), and reversed+flipped.

Tool API
--------

Tools are written using a Turtle-like API. For example, here is an equilateral triangle:

```coffeescript
eqtriangle = (line) -> line.rotate(120).forward().rotate(120).forward()
```

And here is a tee:

```coffeescript
tee = (line) -> line.rotate(90).penUp().backward(0.5).penDown().forward(2)
```

The position is relative to the end of the previous line, rotations are relative to the rotation of the line they rotate from, and movement is similarly scaled (the `.backward(0.5)` is later compensated by a `.forward(2)) to draw a full-size line).

Every command returns a new scrawl instance, so you can draw multiple things from one starting point without worrying about clobbering state. For example, arrow:

```coffeescript
arrow = (line) -> line.rotate(135).forward(1/Math.sqrt(2)); line.rotate(-135).forward(1/Math.sqrt(2))
```

There's no way to add custom tools in the UI yet (see below), but it's pretty easy to edit the source yourself (the tool definitions are all down the bottom of `scrawl.coffee.md`). Give it a try!

Future work and ideas
---------------------

* Better mobile support (it kind of works but only really in landscape mode and the UX isn't too great)
* Panning/zooming the svg canvas
* Resize the svg canvas based on browser size
* Custom tools
* Undo support (tricky because we don't really keep track of the lines, just dump them into the DOM)
* Delete support (ditto above, though shift-click to delete kind of sort of works)
* Magical symmetry like in Kerbal Space Program (should be possible, would have to track relationships between shapes, might kind of ruin the mindless clicking part, worth some thought)
* Curves? (heresy! also would require rethinking the model a fair bit...)
* Some way to share doodles without sending SVGs around (either server support or generate a really long url)

I may or may not actually ever do these things. If you're keen get in touch on the issue tracker, I'm happy to walk you through anything.

Happy scribbling!