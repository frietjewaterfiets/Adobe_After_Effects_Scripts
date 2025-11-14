function badBulbsPanel(thisObj) {
  // Window / panel
  var win = (thisObj instanceof Panel)
    ? thisObj
    : new Window("palette", "badbulbs by frietjewaterfiets", undefined, {resizeable:true});
  win.preferredSize = [300, 430];

  win.orientation = "column";
  win.alignChildren = ["fill", "top"];

  // Title
  var title = win.add("statictext", undefined, "badbulbs by frietjewaterfiets");
  try { title.graphics.font = ScriptUI.newFont("Arial", "BOLD", 14); } catch(e) {}

  // Reset button
  var btnReset = win.add("button", undefined, "Reset (Remove All Expressions)");
  btnReset.onClick = function() {
    removeAllExpressionsOnSelectedLayers();
  };

  // Main panel
  var mainPanel = win.add("panel", undefined, undefined, {borderStyle: "sunken"});
  mainPanel.alignChildren = ["fill", "top"];
  mainPanel.margins = 10;

  // Speed
  var speedGroup = mainPanel.add("group");
  speedGroup.orientation = "row";
  speedGroup.add("statictext", undefined, "Speed (multiplier):");
  var speedInput = speedGroup.add("edittext", undefined, "1.0");
  speedInput.characters = 4;

  // Startup checkbox
  var startupGroup = mainPanel.add("group");
  startupGroup.orientation = "row";
  var startupCheckbox = startupGroup.add(
    "checkbox",
    undefined,
    "Startup flicker (lamp struggling to turn on)"
  );
  startupCheckbox.value = false;

  // Label – opacity presets
  mainPanel.add("statictext", undefined, "Opacity bulbs:");

  // Helper to add buttons
  function addBulbButton(label, index) {
    var btn = mainPanel.add("button", undefined, label);
    btn.onClick = function() {
      var spd = parseFloat(speedInput.text);
      if (isNaN(spd) || spd <= 0) {
        alert("Please enter a valid speed (> 0).");
        return;
      }
      var expr = buildBadBulbOpacityExpression(index, spd, startupCheckbox.value);
      applyOpacityExpressionToSelectedLayers(expr);
    };
  }

  // Opacity bulbs 1–9
  addBulbButton("Bulb 1 – Soft flicker",              1);
  addBulbButton("Bulb 2 – Hard flicker",              2);
  addBulbButton("Bulb 3 – Pulsing",                   3);
  addBulbButton("Bulb 4 – Random bursts",             4);
  addBulbButton("Bulb 5 – Dying bulb",                5);
  addBulbButton("Bulb 6 – Nervous jitter",            6);
  addBulbButton("Bulb 7 – Chaotic neon",              7);
  addBulbButton("Bulb 8 – Stable with rare flicker",  8);
  addBulbButton("Bulb 9 – Heartbeat blink",           9);

  // Info
  var info = win.add(
    "statictext",
    undefined,
    "All bulbs affect Opacity on selected layers.\nUse Speed to make patterns faster or slower.",
    {multiline:true}
  );
  info.alignment = ["fill","top"];

  // ------------- LOGIC ------------- //

  // --------- Opacity expressions ---------- //

  function buildBaseOpacityBulbExpr(bulbIndex, speedFactor) {
    var s = "";

    switch (bulbIndex) {
      case 1: // soft flicker
        s =
          "var speedFactor = " + speedFactor + ";\n" +
          "posterizeTime(24*speedFactor);\n" +
          "seedRandom(index + time*10*speedFactor, true);\n" +
          "var base = 100;\n" +
          "var dipChance = 0.08;\n" +
          "var dipStrength = random(20,60);\n" +
          "if (random() < dipChance) {\n" +
          "  base - dipStrength;\n" +
          "} else {\n" +
          "  base;\n" +
          "}\n";
        break;

      case 2: // hard flicker
        s =
          "var speedFactor = " + speedFactor + ";\n" +
          "posterizeTime(18*speedFactor);\n" +
          "seedRandom(index + time*20*speedFactor, true);\n" +
          "var offChance = 0.5;\n" +
          "var flashChance = 0.15;\n" +
          "var r = random();\n" +
          "if (r < flashChance) {\n" +
          "  random(80,100);\n" +
          "} else if (r < offChance + flashChance) {\n" +
          "  0;\n" +
          "} else {\n" +
          "  random(30,70);\n" +
          "}\n";
        break;

      case 3: // pulsing (sin wave)
        s =
          "var speedFactor = " + speedFactor + ";\n" +
          "var freq = (3 + (index%2)) * speedFactor;\n" +
          "var amp  = 40;\n" +
          "var base = 80;\n" +
          "var s1   = Math.sin(time*freq*2*Math.PI);\n" +
          "base + s1*amp;\n";
        break;

      case 4: // random bursts
        s =
          "var speedFactor = " + speedFactor + ";\n" +
          "posterizeTime(24*speedFactor);\n" +
          "seedRandom(index, true);\n" +
          "var cycle = 4/speedFactor;\n" +
          "var t = time/cycle;\n" +
          "var phase = Math.floor(t);\n" +
          "seedRandom(phase + index*100, true);\n" +
          "var chaotic = random() < 0.35;\n" +
          "if (chaotic) {\n" +
          "  seedRandom(phase*1000 + time*50*speedFactor, true);\n" +
          "  random(0,100);\n" +
          "} else {\n" +
          "  100;\n" +
          "}\n";
        break;

      case 5: // dying bulb
        s =
          "var speedFactor = " + speedFactor + ";\n" +
          "var life = 10/speedFactor;\n" +
          "var t = Math.max(time - inPoint, 0);\n" +
          "var decay = 1 - t/life;\n" +
          "decay = Math.max(Math.min(decay,1),0);\n" +
          "var base = ease(decay, 0, 1, 10, 100);\n" +
          "posterizeTime(24*speedFactor);\n" +
          "seedRandom(index + time*15*speedFactor, true);\n" +
          "var jitter = random(-25, 15);\n" +
          "Math.max(base + jitter, 0);\n";
        break;

      case 6: // nervous jitter
        s =
          "var speedFactor = " + speedFactor + ";\n" +
          "posterizeTime(30*speedFactor);\n" +
          "seedRandom(index + time*60*speedFactor, true);\n" +
          "var base = 90;\n" +
          "var jitter = random(-35, 10);\n" +
          "base + jitter;\n";
        break;

      case 7: // chaotic neon
        s =
          "var speedFactor = " + speedFactor + ";\n" +
          "posterizeTime(24*speedFactor);\n" +
          "seedRandom(index + time*30*speedFactor, true);\n" +
          "var blackoutChance = 0.15;\n" +
          "var hardFlickerChance = 0.35;\n" +
          "var r = random();\n" +
          "if (r < blackoutChance) {\n" +
          "  0;\n" +
          "} else if (r < blackoutChance + hardFlickerChance) {\n" +
          "  random(0, 100);\n" +
          "} else {\n" +
          "  random(70, 100);\n" +
          "}\n";
        break;

      case 8: // stable with rare tiny flicker
        s =
          "var speedFactor = " + speedFactor + ";\n" +
          "posterizeTime(24*speedFactor);\n" +
          "seedRandom(index + time*5*speedFactor, true);\n" +
          "var base = 100;\n" +
          "var flickerChance = 0.02;\n" +   // 2% chance
          "if (random() < flickerChance) {\n" +
          "  base - random(5,15);\n" +
          "} else {\n" +
          "  base;\n" +
          "}\n";
        break;

      case 9: // heartbeat blink (double pulse: “bom-bom”)
        s =
          "var speedFactor = " + speedFactor + ";\n" +
          "var bpm   = 70 * speedFactor;   // beats per minute\n" +
          "var f     = bpm / 60;           // beats per second\n" +
          "var t     = time - inPoint;\n" +
          "var cycle = 1/f;                // length of one heartbeat cycle\n" +
          "var tt    = t % cycle;\n" +
          "var u     = tt / cycle;         // 0–1 over one beat\n" +
          "\n" +
          "// two pulses inside each heartbeat cycle\n" +
          "var w  = 0.10;   // width of each pulse\n" +
          "var p1 = 0.10;   // first pulse position\n" +
          "var p2 = 0.35;   // second pulse position\n" +
          "\n" +
          "var pulse1 = Math.max(0, 1 - Math.abs(u - p1)/w);\n" +
          "var pulse2 = Math.max(0, 1 - Math.abs(u - p2)/w);\n" +
          "\n" +
          "pulse1 = Math.pow(pulse1, 3);\n" +
          "pulse2 = Math.pow(pulse2, 3);\n" +
          "\n" +
          "var beat = Math.min(1, pulse1 + pulse2);\n" +
          "var minVal = 0;   // dark between beats\n" +
          "var maxVal = 100; // full brightness at peaks\n" +
          "minVal + beat*(maxVal-minVal);\n";
        break;

      default:
        s = "100;\n";
        break;
    }

    return s;
  }

  function buildBadBulbOpacityExpression(bulbIndex, speedFactor, useStartup) {
    var base = buildBaseOpacityBulbExpr(bulbIndex, speedFactor);
    if (!useStartup) return base;

    var s =
      "var speedFactor = " + speedFactor + ";\n" +
      "var t = time - inPoint;\n" +
      "var startupDur = 2/speedFactor;\n" +
      "if (t < startupDur) {\n" +
      "  posterizeTime(24*speedFactor);\n" +
      "  seedRandom(index + Math.floor(t*60*speedFactor), true);\n" +
      "  var flashChance = 0.6;\n" +
      "  var r = random();\n" +
      "  var ramp = ease(t, 0, startupDur, 0, 1);\n" +
      "  if (r < flashChance) {\n" +
      "    random(40,100) * ramp;\n" +
      "  } else {\n" +
      "    random(0,40) * ramp;\n" +
      "  }\n" +
      "} else {\n" +
      base +
      "}\n";
    return s;
  }

  // --------- Apply helpers ---------- //

  function applyOpacityExpressionToSelectedLayers(expr) {
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) { alert("No active composition."); return; }
    if (comp.selectedLayers.length === 0) { alert("Please select at least one layer."); return; }

    app.beginUndoGroup("Apply Badbulbs Opacity");

    for (var i = 0; i < comp.selectedLayers.length; i++) {
      var layer = comp.selectedLayers[i];
      var tGroup = layer.property("ADBE Transform Group");
      if (!tGroup) continue;
      var op = tGroup.property("ADBE Opacity");
      if (!op || !op.canSetExpression) continue;
      op.expression = expr;
    }

    app.endUndoGroup();
  }

  // Reset: remove all expressions from selected layers
  function removeAllExpressionsOnSelectedLayers() {
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) { alert("No active composition."); return; }
    if (comp.selectedLayers.length === 0) { alert("Please select at least one layer."); return; }

    app.beginUndoGroup("Remove All Expressions");

    function removeFromProperties(group) {
      for (var i = 1; i <= group.numProperties; i++) {
        var prop = group.property(i);
        if (prop.canSetExpression && prop.expression !== "") {
          prop.expression = "";
        }
        if (prop.numProperties && prop.numProperties > 0) {
          removeFromProperties(prop);
        }
      }
    }

    for (var l = 0; l < comp.selectedLayers.length; l++) {
      removeFromProperties(comp.selectedLayers[l]);
    }

    app.endUndoGroup();
  }

  // Show panel
  if (win instanceof Window) {
    win.center();
    win.show();
  } else {
    win.layout.layout(true);
  }
  return win;
}

badBulbsPanel(this);
