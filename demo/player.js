// Plays the quality gate demo live inside the tool: gates move from "not ready"
// through conditional go / no-go to an all-green release, then the demo loops.
(function () {
  "use strict";
  var qg = window.__qg;
  document.documentElement.setAttribute("data-theme", "dark");
  var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var run = 0;

  var cap = document.createElement("div"); cap.id = "cap"; document.body.appendChild(cap);
  var bar = document.createElement("div"); bar.id = "demo-bar";
  bar.innerHTML = '<span class="demo-tag">Live demo</span><button id="demo-replay" type="button">Replay</button><a href="../">Open the tool</a>';
  document.body.appendChild(bar);

  // Show the whole 1400 px wide layout, all six gates included, on smaller screens such as phones.
  function fit() { document.documentElement.style.zoom = window.innerWidth < 1400 ? String(window.innerWidth / 1400) : ""; }
  window.addEventListener("resize", fit); fit();

  function caption(label, text) { cap.innerHTML = (label ? "<b>" + label + "</b>" : "") + text; }
  function flash(g) { var el = document.querySelectorAll(".gate")[g]; if (el) el.classList.add("flash"); }
  function set(patch, gate) {
    qg.update(function (s) {
      s.levels.forEach(function (l) {
        l.entry.concat(l.exit).forEach(function (c) {
          if (!(c.id in patch)) return;
          if (c.kind === "check") c.met = patch[c.id]; else c.actual = patch[c.id];
        });
      });
    });
    if (gate != null) flash(gate);
  }
  function reset() {
    window.scrollTo(0, 0);
    qg.update(function (s) {
      s.project = "Payments Portal 3.2";
      s.levels.forEach(function (l) { l.entry.concat(l.exit).forEach(function (c) { c.actual = null; c.met = null; }); });
    });
    qg.select(0);
  }
  async function typeInto(id, text, my) {
    var el = document.getElementById(id); if (!el) return;
    el.focus(); el.value = "";
    for (var i = 0; i < text.length; i++) { if (my !== run) return; await wait(220); el.value += text[i]; }
    await wait(300);
    el.dispatchEvent(new Event("change", { bubbles: true }));
    qg.update(function () {});
  }

  async function play() {
    var my = ++run;
    var step = async function (ms) { await wait(ms); if (my !== run) throw "stopped"; };
    try {
      reset(); caption("", "Release 3.2 starts: every quality gate is not ready"); await step(3000);

      set({ L1e1: true, L1e2: true, L1e3: 0, L1e4: false }, 0);
      caption("QG0", "Stubs and drivers missing: conditional go"); await step(2600);
      set({ L1e4: true }, 0);
      caption("QG0", "Test environment complete: go into component testing"); await step(2400);

      set({ L1x1: 86, L1x2: 66, L1x3: 100, L1x4: 0, L1x5: true, L2e1: true, L2e2: true, L2e3: 100, L2e4: true }, 1);
      caption("QG1", "Branch coverage 66% is below 70%: conditional go"); await step(2600);
      qg.select(1); set({ L1x2: 74 }, 1);
      caption("QG1", "Coverage raised to 74%: go"); await step(2400);

      set({ L2x1: 97, L2x2: 92, L2x3: 0, L2x4: 3, L2x5: 61, L3e1: true, L3e2: true, L3e3: 100, L3e4: true }, 2);
      caption("QG2", "Regression automation 61% is below 70%: conditional go"); await step(2600);
      qg.select(2); set({ L2x5: 72 }, 2);
      caption("QG2", "Automation at 72%: go into system testing"); await step(2400);

      set({ L3x1: 96, L3x2: 93, L3x3: 0, L3x4: 2, L3x5: 870, L3x6: 0, L3x7: true, L4e1: true, L4e2: true, L4e3: true }, 3);
      caption("QG3", "Test pass rate 93% is below the 95% must: no-go"); await step(3200);
      document.getElementById("L3x2-actual").scrollIntoView({ behavior: "smooth", block: "center" });
      caption("QG3", "Defects fixed and retested..."); await step(1400);
      await typeInto("L3x2-actual", "97", my); await step(1300);
      window.scrollTo({ top: 0, behavior: "smooth" }); await step(700);
      flash(3); caption("QG3", "Pass rate now 97%: go into system integration testing"); await step(2600);

      qg.select(3); set({ L4x1: 100, L4x2: 0.8, L4x3: 0, L4x4: 99.95, L5e1: true, L5e2: true, L5e3: true }, 4);
      caption("QG4", "Interface error rate 0.8% is above 0.5%: conditional go"); await step(2600);
      set({ L4x2: 0.3 }, 4);
      caption("QG4", "Error rate down to 0.3%: go into acceptance testing"); await step(2400);

      qg.select(4); set({ L5x1: 100, L5x2: 0, L5x3: 1, L5x4: true, L5x5: false, L5x6: true }, 5);
      caption("QG5", "Rollback plan not ready yet: conditional go"); await step(2600);
      set({ L5x5: true }, 5);
      caption("", "All six quality gates are green: ready for release ✓"); await step(6000);
      play();
    } catch (e) { if (e !== "stopped") throw e; }
  }

  document.getElementById("demo-replay").addEventListener("click", play);
  play();
})();
