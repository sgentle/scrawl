Scrawl
======

An iterative doodling adventure!

Helpers
-------

    $ = document.querySelector.bind(document)
    $$ = document.querySelectorAll.bind(document)

    deg2rad = (θ) -> θ * Math.PI / 180
    rad2deg = (θ) -> θ / Math.PI * 180

    wrapFunc = (f) -> (f2) ->

Scrawl methods
--------------

Each scrawl method returns a new scrawl instance so we can pass them around
and call them without worrying about mutation. This is probably not very
efficient, but nothing compared to DOM/SVG overhead.

This API is fairly heavily inspired by Logo/Turtle graphics.

    scrawlProto =
      scrawlWith: (props) ->
        scrawl.apply null, (props[k] ? this[k] for k in ['svg', 'start', 'end', 'focus', 'angle', 'drawing', 'flipped'])

      rotate: (deg) ->
        deg = -deg if @flipped
        @scrawlWith angle: @angle + deg2rad deg

      forward: (rate = 1) ->
        end =
          x: @focus.x + Math.cos(@angle) * rate * @length
          y: @focus.y + Math.sin(@angle) * rate * @length
        @to end
      backward: (rate = 1) -> @forward -rate
      to: (point) ->
        s = @scrawlWith start: @focus, end: point, focus: point
        s.draw() if @drawing
        s

      penUp: -> @scrawlWith drawing: false
      penDown: -> @scrawlWith drawing: true

      fromStart: -> @scrawlWith focus: @start
      fromEnd: -> @scrawlWith focus: @end
      fromMiddle: -> @scrawlWith focus: @middle
      from: (n) -> @scrawlWith focus: x: (@start.x * n + @end.x * (1-n)) / 2, y: (@start.y * n + @end.y * (1-n)) / 2

      reverse: -> scrawl @svg, @end, @start
      flip: -> @scrawlWith flipped: true

Drawing is a bit complicated - we want to be able to click lines even if their
stroke is small, so we duplicate all lines in a second, larger group.

      draw: ->
        el = document.createElementNS("http://www.w3.org/2000/svg", "line");
        el.setAttribute k, v for k, v of {x1: @start.x, y1: @start.y, x2: @end.x, y2: @end.y}
        @svg.appendChild el
        if clickables = @svg.querySelector('.clickables')
          invisEl = el.cloneNode()
          clickables.appendChild invisEl

        this


scrawl creator
--------------

We just call this whenever we need a new scrawl. The only compulsory arguments
are the svg element to write to and a start and an end point. We have a notion
of a focus, which is a point (theoretically) on the line that is where our
drawing commands will take effect from.

    getAngle = (start, end) -> Math.atan2(end.y-start.y, end.x-start.x)

    scrawl = (svg, start, end, focus = end, angle, drawing=true, flipped=false) ->
      return scrawlFromLine svg if svg and svg.tagName is 'line'
      angle ?= getAngle(start, end)
      s = Object.create scrawlProto
      s.svg = svg; s.start = start; s.end = end; s.focus = focus; s.angle = angle; s.drawing = drawing; s.flipped = flipped
      s.middle = x: (start.x + end.x) / 2, y: (start.y + end.y) / 2
      s.length = Math.sqrt((end.x - start.x)**2 + (end.y - start.y)**2)
      s

    scrawlFromLine = (el) ->
      attr = (x) -> Number(el.getAttribute(x))
      start = x: attr('x1'), y: attr('y1')
      end = x: attr('x2'), y: attr('y2')

      scrawl el.ownerSVGElement, start, end


Drawing
-------

We keep track of the current tool, which is set later on. That tool is just a
function that we call on a scrawl when we click it.

    curTool = ->

    drawbox = $('#drawbox')

    drawbox.addEventListener 'click', (ev) ->
      el = ev.target
      return unless el.tagName is 'line'
      if ev.shiftKey
        el.remove()
      else
        curTool scrawl el

When you mouseover a line it shows a preview of what the tool would look like
if clicked. This is in another temporary svg group that we nuke regularly.
We're taking advantage here of the fact that scrawl doesn't actually check if
the thing it's attached to is an svg root. So we just tell it to draw where we
want.

    hoverbox = drawbox.querySelector('.hover')
    currentHover = null
    drawbox.addEventListener 'mouseover', (ev) ->
      return unless ev.target.tagName is 'line'
      currentHover = ev.target
      s = scrawl ev.target
      s.svg = hoverbox
      curTool s

    drawbox.addEventListener 'mouseout', (ev) ->
      return unless ev.target.tagName is 'line'
      currentHover = null
      hoverbox.innerHTML = ""

We want to refresh the preview when the tool state is changed

    refreshHover = ->
      return unless currentHover
      hoverbox.innerHTML = ""
      s = scrawl currentHover
      s.svg = hoverbox
      curTool s

Zooming
-------

    screenToSVG = (svg, point) ->
      pt = svg.createSVGPoint()
      ctm = svg.getScreenCTM().inverse()
      pt.x = point.x
      pt.y = point.y
      newpt = pt.matrixTransform(ctm)
      {x: newpt.x, y: newpt.y}

    currentView = {}
    currentView[k] = v for k, v of drawbox.viewBox.baseVal

    drawbox.addEventListener 'wheel', (ev) ->
      scale = 1 + ev.deltaY/1000

      origin = screenToSVG drawbox, {x: ev.pageX, y: ev.pageY}

      currentView = cv =
        x: (currentView.x - origin.x) * scale + origin.x
        y: (currentView.y - origin.y) * scale + origin.y
        width: currentView.width * scale
        height: currentView.height * scale

      drawbox.setAttribute 'viewBox', "#{cv.x} #{cv.y} #{cv.width} #{cv.height}"
      ev.preventDefault()


Downloading
-----------

To convince the browser to let us download, we need to attach a pretend link
element to the document and pretend to click it. We also strip out any extra
groups we're using.

    $('#download').addEventListener 'click', ->
      d = drawbox.cloneNode(true)
      d.querySelector('.clickables').remove()
      d.querySelector('.hover').remove()
      f = new File([d.outerHTML], "scrawl.svg", {type:"image/svg+xml"});
      a = document.createElement 'a'
      a.href = URL.createObjectURL(f)
      a.download = "scrawl.svg"
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()
      a.remove()


Tool palette
------------

This is the code that switches around tools. It's a bit gnarly because it does
DOM and state management all at the same time. Basically we cycle through
different permutations of each tool on repeated button press. That way we
don't have to make separate tools for every direction.

    toolState = 0
    origTool = null
    activate = (func, backwards) ->
      if origTool is func
        if backwards
          toolState = toolState - 1
          toolState = 3 if toolState < 0
        else
          toolState = (toolState + 1) % 4
      else
        toolState = 0

      reversed = (toolState + 1) % 2 == 0
      flipped = toolState > 1

      origTool = func
      curTool = (x) ->
        x = x.reverse() if reversed
        x = x.flip() if flipped
        func(x)

      el.classList.remove 'active', 'reversed', 'flipped' for el in $$('.palettebutton')
      if activeDiv = divs.get(func)
        activeDiv.classList.add 'active', ('reversed' if reversed), ('flipped' if flipped)
        parent = activeDiv.parentNode
        top = parent.scrollTop
        bottom = top + parent.offsetHeight
        if activeDiv.offsetTop < top
          parent.scrollTop = activeDiv.offsetTop
        else if activeDiv.offsetTop + activeDiv.offsetHeight > bottom
          parent.scrollTop = activeDiv.offsetTop - parent.offsetHeight + activeDiv.offsetHeight
      refreshHover()

    keymap = {}
    window.addEventListener 'keypress', (ev) ->
      char = String.fromCharCode(event.which || event.keyCode)
      if func = keymap[char.toLowerCase()]
        activate func, ev.shiftKey

    divs = new Map()

This is pretty clever. We use scrawl itself to preview tools rather than using
static imagaes. That means no boring image management.

    addPalette = (func, key) ->
      keymap[key] = func if key
      div = document.createElement 'div'
      divs.set func, div
      div.className = 'palettebutton'
      div.innerHTML = """
        <div class="key">#{key or ''}</div>
        <svg xmlns="http://www.w3.org/2000/svg" version="1.1"
        viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice"
        stroke="black" stroke-width="2" stroke-linecap="round">
          <line x1="25" y1="50" x2="75" y2="50"></line>
        </svg>
      """
      div.addEventListener 'click', -> activate func
      func scrawl div.querySelector('line')
      $('#palette').appendChild div

Tools
-----

Triangles work great for making spirals and other fun iterative shapes.
We include a 90 degree right triangle

    rtriangle = (line) -> line.rotate(135).forward(1/Math.sqrt(2)).rotate(90).forward()
    rtriangleh = (line) -> line.rotate(90).forward(1).to(line.start)

A 3-4-5 triangle

    wtriangle = (line) -> line.rotate(120).forward(1/2).rotate(90).forward(Math.sqrt(3))
    mtriangle = (line) -> line.rotate(90).forward(Math.sqrt(3)).rotate(150).forward(2/Math.sqrt(3))
    ltriangle = (line) -> line.rotate(90).forward(1/Math.sqrt(3)).rotate(120).forward(2)

An equilateral triangle

    eqtriangle = (line) -> line.rotate(120).forward().rotate(120).forward()

And an isoceles triangle (using the line as the base height)

    isoceles = (line) -> base = tee(line); base.to(line.start).to(base.start)

Enclosing shapes:

    box = (line) -> rightangle(rightangle(rightangle(tee(line))))
    diamond = (line) -> rightangle(rightangle(rightangle(line.rotate(135).forward(1/Math.sqrt(2)))))
    ubend = (line) -> rightangle rightangle rightangle line

Golden ratio magic

    PHI = (1 + Math.sqrt(5)) / 2
    golden = (line) ->
      line.rotate(90).forward(1/PHI).rotate(90).forward(PHI).rotate(90).forward(1/PHI)

    goldener = (line) ->
      line.rotate(90).forward(PHI).rotate(90).forward(1/PHI).rotate(90).forward(PHI)

Shapes where we put something on the end:

    rightangle = (line) -> line.rotate(90).forward()
    arrow = (line) -> line.rotate(135).forward(1/Math.sqrt(2)); line.rotate(-135).forward(1/Math.sqrt(2))
    tee = (line) -> line.rotate(90).penUp().backward(0.5).penDown().forward(2)
    qswirl = (line) -> line.rotate(90).forward(0.5).rotate(90).forward().rotate(90).forward()
    hook = (line) -> line.rotate(90).forward(0.5).rotate(90).forward(1)
    sbend = (line) -> line.rotate(90).forward(0.5)
    zbend = (line) -> line.rotate(135).forward(1/Math.sqrt(2))
    fork = (line) -> line.rotate(30).forward(); line.rotate(-30).forward()
    latch = (line) -> t = tee(line); t.fromStart().rotate(-90).forward(1); t.rotate(-90).forward(1)
    bulb = (line) -> line.rotate(-90).penUp().backward(0.5).penDown().forward(2).rotate(90).forward(1).rotate(90).forward(1).rotate(90).forward(1)
    diamondbulb = (line) -> line.rotate(-45).forward(1/Math.sqrt(2)).rotate(90).forward(1).rotate(90).forward(1).rotate(90).forward(1)
    slash = (line) -> line.rotate(135).penUp().backward(1/Math.sqrt(2)).penDown().forward(2)
    backslash = (line) -> line.rotate(-135).penDown().forward(Math.sqrt(2))

Shapes where we build out from the middle

    intersect = (line) -> line.fromMiddle().penUp().rotate(90).backward(0.5).penDown().forward(2)
    normal = (line) -> line.fromMiddle().rotate(90).forward(0.5)
    kay = (line) -> line.fromMiddle().rotate(45).forward(1/Math.sqrt(2)); line.fromMiddle().rotate(135).forward(1/Math.sqrt(2))
    star = (line) -> intersect(line); intersect(line.rotate(45)); intersect(line.rotate(135))

Line extension:

    extend = (line) -> line.forward()
    bang = (line) -> line.penUp().forward(1/2).penDown().forward(1)

We procedurally generate shapes for building n-gons (3-12)

    ngon = (n) -> (line) -> line.rotate(180 - (1-2/n) * 180).forward()

These are a bit cheeky, but pretty useful

    halve = (line) -> line.fromStart().forward(0.5).forward(1)
    double = (line) -> line.fromStart().forward(2)

Now add all of these to the palette

    addPalette rtriangle, 'r'
    addPalette rtriangleh, 'p'

    addPalette mtriangle, 'm'
    addPalette wtriangle, 'w'
    addPalette ltriangle, 'l'

    addPalette eqtriangle, 'v'

    addPalette isoceles, 'i'

    addPalette box, 'b'
    addPalette diamond, 'd'
    addPalette ubend, 'u'

    addPalette golden, 'g'
    addPalette goldener, 'f'


    addPalette arrow, 'a'
    addPalette tee, 't'
    addPalette qswirl, 'q'

    addPalette fork, 'y'
    addPalette normal, 'n'
    addPalette sbend, 's'
    addPalette zbend, 'z'
    addPalette hook, 'j'
    addPalette slash, '/'
    addPalette backslash, '\\'

    addPalette kay, 'k'
    addPalette star, '*'
    addPalette intersect, 'x'


    addPalette bulb, 'o'
    addPalette diamondbulb, 'h'
    addPalette latch, 'c'

    addPalette bang, '!'
    addPalette extend, 'e'
    addPalette ngon(n), String(n%10) for n in [3..12]

    addPalette halve, '.'
    addPalette double, ','

    activate rtriangle
    activate rtriangle # Second time so we reverse it


