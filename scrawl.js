// Generated by CoffeeScript 1.10.0
(function() {
  var $, $$, PHI, activate, addPalette, arrow, backslash, bang, box, bulb, curTool, currentHover, deg2rad, diamond, diamondbulb, divs, double, eqtriangle, extend, fork, getAngle, golden, goldener, halve, hook, hoverbox, i, intersect, isoceles, kay, keymap, latch, ltriangle, mtriangle, n, ngon, normal, origTool, qswirl, rad2deg, refreshHover, rightangle, rtriangle, rtriangleh, sbend, scrawl, scrawlFromLine, scrawlProto, slash, star, tee, toolState, ubend, wrapFunc, wtriangle, zbend;

  $ = document.querySelector.bind(document);

  $$ = document.querySelectorAll.bind(document);

  deg2rad = function(θ) {
    return θ * Math.PI / 180;
  };

  rad2deg = function(θ) {
    return θ / Math.PI * 180;
  };

  wrapFunc = function(f) {
    return function(f2) {};
  };

  scrawlProto = {
    scrawlWith: function(props) {
      var k;
      return scrawl.apply(null, (function() {
        var i, len, ref, ref1, results;
        ref = ['svg', 'start', 'end', 'focus', 'angle', 'drawing', 'flipped'];
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          k = ref[i];
          results.push((ref1 = props[k]) != null ? ref1 : this[k]);
        }
        return results;
      }).call(this));
    },
    rotate: function(deg) {
      if (this.flipped) {
        deg = -deg;
      }
      return this.scrawlWith({
        angle: this.angle + deg2rad(deg)
      });
    },
    forward: function(rate) {
      var end;
      if (rate == null) {
        rate = 1;
      }
      end = {
        x: this.focus.x + Math.cos(this.angle) * rate * this.length,
        y: this.focus.y + Math.sin(this.angle) * rate * this.length
      };
      return this.to(end);
    },
    backward: function(rate) {
      if (rate == null) {
        rate = 1;
      }
      return this.forward(-rate);
    },
    to: function(point) {
      var s;
      s = this.scrawlWith({
        start: this.focus,
        end: point,
        focus: point
      });
      if (this.drawing) {
        s.draw();
      }
      return s;
    },
    penUp: function() {
      return this.scrawlWith({
        drawing: false
      });
    },
    penDown: function() {
      return this.scrawlWith({
        drawing: true
      });
    },
    fromStart: function() {
      return this.scrawlWith({
        focus: this.start
      });
    },
    fromEnd: function() {
      return this.scrawlWith({
        focus: this.end
      });
    },
    fromMiddle: function() {
      return this.scrawlWith({
        focus: this.middle
      });
    },
    from: function(n) {
      return this.scrawlWith({
        focus: {
          x: (this.start.x * n + this.end.x * (1 - n)) / 2,
          y: (this.start.y * n + this.end.y * (1 - n)) / 2
        }
      });
    },
    reverse: function() {
      return scrawl(this.svg, this.end, this.start);
    },
    flip: function() {
      return this.scrawlWith({
        flipped: true
      });
    },
    draw: function() {
      var clickables, el, invisEl, k, ref, v;
      el = document.createElementNS("http://www.w3.org/2000/svg", "line");
      ref = {
        x1: this.start.x,
        y1: this.start.y,
        x2: this.end.x,
        y2: this.end.y
      };
      for (k in ref) {
        v = ref[k];
        el.setAttribute(k, v);
      }
      this.svg.appendChild(el);
      if (clickables = this.svg.querySelector('.clickables')) {
        invisEl = el.cloneNode();
        clickables.appendChild(invisEl);
      }
      return this;
    }
  };

  getAngle = function(start, end) {
    return Math.atan2(end.y - start.y, end.x - start.x);
  };

  scrawl = function(svg, start, end, focus, angle, drawing, flipped) {
    var s;
    if (focus == null) {
      focus = end;
    }
    if (drawing == null) {
      drawing = true;
    }
    if (flipped == null) {
      flipped = false;
    }
    if (svg && svg.tagName === 'line') {
      return scrawlFromLine(svg);
    }
    if (angle == null) {
      angle = getAngle(start, end);
    }
    s = Object.create(scrawlProto);
    s.svg = svg;
    s.start = start;
    s.end = end;
    s.focus = focus;
    s.angle = angle;
    s.drawing = drawing;
    s.flipped = flipped;
    s.middle = {
      x: (start.x + end.x) / 2,
      y: (start.y + end.y) / 2
    };
    s.length = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
    return s;
  };

  scrawlFromLine = function(el) {
    var attr, end, start;
    attr = function(x) {
      return Number(el.getAttribute(x));
    };
    start = {
      x: attr('x1'),
      y: attr('y1')
    };
    end = {
      x: attr('x2'),
      y: attr('y2')
    };
    return scrawl(el.ownerSVGElement, start, end);
  };

  curTool = function() {};

  $('#drawbox').addEventListener('click', function(ev) {
    var el;
    el = ev.target;
    if (el.tagName !== 'line') {
      return;
    }
    if (ev.shiftKey) {
      return el.remove();
    } else {
      return curTool(scrawl(el));
    }
  });

  hoverbox = $('#drawbox').querySelector('.hover');

  currentHover = null;

  $('#drawbox').addEventListener('mouseover', function(ev) {
    var s;
    if (ev.target.tagName !== 'line') {
      return;
    }
    currentHover = ev.target;
    s = scrawl(ev.target);
    s.svg = hoverbox;
    return curTool(s);
  });

  $('#drawbox').addEventListener('mouseout', function(ev) {
    if (ev.target.tagName !== 'line') {
      return;
    }
    currentHover = null;
    return hoverbox.innerHTML = "";
  });

  refreshHover = function() {
    var s;
    if (!currentHover) {
      return;
    }
    hoverbox.innerHTML = "";
    s = scrawl(currentHover);
    s.svg = hoverbox;
    return curTool(s);
  };

  $('#download').addEventListener('click', function() {
    var a, d, f;
    d = $('#drawbox').cloneNode(true);
    d.querySelector('.clickables').remove();
    d.querySelector('.hover').remove();
    f = new File([d.outerHTML], "scrawl.svg", {
      type: "image/svg+xml"
    });
    a = document.createElement('a');
    a.href = URL.createObjectURL(f);
    a.download = "scrawl.svg";
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    return a.remove();
  });

  toolState = 0;

  origTool = null;

  activate = function(func, backwards) {
    var activeDiv, bottom, el, flipped, i, len, parent, ref, reversed, top;
    if (origTool === func) {
      if (backwards) {
        toolState = toolState - 1;
        if (toolState < 0) {
          toolState = 3;
        }
      } else {
        toolState = (toolState + 1) % 4;
      }
    } else {
      toolState = 0;
    }
    reversed = (toolState + 1) % 2 === 0;
    flipped = toolState > 1;
    origTool = func;
    curTool = function(x) {
      if (reversed) {
        x = x.reverse();
      }
      if (flipped) {
        x = x.flip();
      }
      return func(x);
    };
    ref = $$('.palettebutton');
    for (i = 0, len = ref.length; i < len; i++) {
      el = ref[i];
      el.classList.remove('active', 'reversed', 'flipped');
    }
    if (activeDiv = divs.get(func)) {
      activeDiv.classList.add('active', (reversed ? 'reversed' : void 0), (flipped ? 'flipped' : void 0));
      parent = activeDiv.parentNode;
      top = parent.scrollTop;
      bottom = top + parent.offsetHeight;
      if (activeDiv.offsetTop < top) {
        parent.scrollTop = activeDiv.offsetTop;
      } else if (activeDiv.offsetTop + activeDiv.offsetHeight > bottom) {
        parent.scrollTop = activeDiv.offsetTop - parent.offsetHeight + activeDiv.offsetHeight;
      }
    }
    return refreshHover();
  };

  keymap = {};

  window.addEventListener('keypress', function(ev) {
    var char, func;
    char = String.fromCharCode(event.which || event.keyCode);
    if (func = keymap[char.toLowerCase()]) {
      return activate(func, ev.shiftKey);
    }
  });

  divs = new Map();

  addPalette = function(func, key) {
    var div;
    if (key) {
      keymap[key] = func;
    }
    div = document.createElement('div');
    divs.set(func, div);
    div.className = 'palettebutton';
    div.innerHTML = "<div class=\"key\">" + (key || '') + "</div>\n<svg xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\"\nviewBox=\"0 0 100 100\" preserveAspectRatio=\"xMidYMid slice\"\nstroke=\"black\" stroke-width=\"2\" stroke-linecap=\"round\">\n  <line x1=\"25\" y1=\"50\" x2=\"75\" y2=\"50\"></line>\n</svg>";
    div.addEventListener('click', function() {
      return activate(func);
    });
    func(scrawl(div.querySelector('line')));
    return $('#palette').appendChild(div);
  };

  rtriangle = function(line) {
    return line.rotate(135).forward(1 / Math.sqrt(2)).rotate(90).forward();
  };

  rtriangleh = function(line) {
    return line.rotate(90).forward(1).to(line.start);
  };

  wtriangle = function(line) {
    return line.rotate(120).forward(1 / 2).rotate(90).forward(Math.sqrt(3));
  };

  mtriangle = function(line) {
    return line.rotate(90).forward(Math.sqrt(3)).rotate(150).forward(2 / Math.sqrt(3));
  };

  ltriangle = function(line) {
    return line.rotate(90).forward(1 / Math.sqrt(3)).rotate(120).forward(2);
  };

  eqtriangle = function(line) {
    return line.rotate(120).forward().rotate(120).forward();
  };

  isoceles = function(line) {
    var base;
    base = tee(line);
    return base.to(line.start).to(base.start);
  };

  box = function(line) {
    return rightangle(rightangle(rightangle(tee(line))));
  };

  diamond = function(line) {
    return rightangle(rightangle(rightangle(line.rotate(135).forward(1 / Math.sqrt(2)))));
  };

  ubend = function(line) {
    return rightangle(rightangle(rightangle(line)));
  };

  PHI = (1 + Math.sqrt(5)) / 2;

  golden = function(line) {
    return line.rotate(90).forward(1 / PHI).rotate(90).forward(PHI).rotate(90).forward(1 / PHI);
  };

  goldener = function(line) {
    return line.rotate(90).forward(PHI).rotate(90).forward(1 / PHI).rotate(90).forward(PHI);
  };

  rightangle = function(line) {
    return line.rotate(90).forward();
  };

  arrow = function(line) {
    line.rotate(135).forward(1 / Math.sqrt(2));
    return line.rotate(-135).forward(1 / Math.sqrt(2));
  };

  tee = function(line) {
    return line.rotate(90).penUp().backward(0.5).penDown().forward(2);
  };

  qswirl = function(line) {
    return line.rotate(90).forward(0.5).rotate(90).forward().rotate(90).forward();
  };

  hook = function(line) {
    return line.rotate(90).forward(0.5).rotate(90).forward(1);
  };

  sbend = function(line) {
    return line.rotate(90).forward(0.5);
  };

  zbend = function(line) {
    return line.rotate(135).forward(1 / Math.sqrt(2));
  };

  fork = function(line) {
    line.rotate(30).forward();
    return line.rotate(-30).forward();
  };

  latch = function(line) {
    var t;
    t = tee(line);
    t.fromStart().rotate(-90).forward(1);
    return t.rotate(-90).forward(1);
  };

  bulb = function(line) {
    return line.rotate(-90).penUp().backward(0.5).penDown().forward(2).rotate(90).forward(1).rotate(90).forward(1).rotate(90).forward(1);
  };

  diamondbulb = function(line) {
    return line.rotate(-45).forward(1 / Math.sqrt(2)).rotate(90).forward(1).rotate(90).forward(1).rotate(90).forward(1);
  };

  slash = function(line) {
    return line.rotate(135).penUp().backward(1 / Math.sqrt(2)).penDown().forward(2);
  };

  backslash = function(line) {
    return line.rotate(-135).penDown().forward(Math.sqrt(2));
  };

  intersect = function(line) {
    return line.fromMiddle().penUp().rotate(90).backward(0.5).penDown().forward(2);
  };

  normal = function(line) {
    return line.fromMiddle().rotate(90).forward(0.5);
  };

  kay = function(line) {
    line.fromMiddle().rotate(45).forward(1 / Math.sqrt(2));
    return line.fromMiddle().rotate(135).forward(1 / Math.sqrt(2));
  };

  star = function(line) {
    intersect(line);
    intersect(line.rotate(45));
    return intersect(line.rotate(135));
  };

  extend = function(line) {
    return line.forward();
  };

  bang = function(line) {
    return line.penUp().forward(1 / 2).penDown().forward(1);
  };

  ngon = function(n) {
    return function(line) {
      return line.rotate(180 - (1 - 2 / n) * 180).forward();
    };
  };

  halve = function(line) {
    return line.fromStart().forward(0.5).forward(1);
  };

  double = function(line) {
    return line.fromStart().forward(2);
  };

  addPalette(rtriangle, 'r');

  addPalette(rtriangleh, 'p');

  addPalette(mtriangle, 'm');

  addPalette(wtriangle, 'w');

  addPalette(ltriangle, 'l');

  addPalette(eqtriangle, 'v');

  addPalette(isoceles, 'i');

  addPalette(box, 'b');

  addPalette(diamond, 'd');

  addPalette(ubend, 'u');

  addPalette(golden, 'g');

  addPalette(goldener, 'f');

  addPalette(arrow, 'a');

  addPalette(tee, 't');

  addPalette(qswirl, 'q');

  addPalette(fork, 'y');

  addPalette(normal, 'n');

  addPalette(sbend, 's');

  addPalette(zbend, 'z');

  addPalette(hook, 'j');

  addPalette(slash, '/');

  addPalette(backslash, '\\');

  addPalette(kay, 'k');

  addPalette(star, '*');

  addPalette(intersect, 'x');

  addPalette(bulb, 'o');

  addPalette(diamondbulb, 'h');

  addPalette(latch, 'c');

  addPalette(bang, '!');

  addPalette(extend, 'e');

  for (n = i = 3; i <= 12; n = ++i) {
    addPalette(ngon(n), String(n % 10));
  }

  addPalette(halve, '.');

  addPalette(double, ',');

  activate(rtriangle);

}).call(this);
