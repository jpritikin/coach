---
title: Telehealth Eligibility by State
type: docs
weight: 5
bookToc: false
bookHidden: true
---

# Telehealth Eligibility by State

Telehealth practice is governed by the laws of the state where **you, the client, are physically located** at the time of the session. Because I am not a licensed therapist, some states restrict or prohibit unlicensed practitioners from providing telehealth services to residents physically located there.

This page is a work in progress. These data reflect preliminary research only and are not legal advice. I am not a lawyer.

<div id="telehealth-map-wrap">
  <div id="telehealth-map-svg-holder">

  </div>
  <div class="telehealth-legend">
    <span><svg class="swatch" viewBox="0 0 16 16" aria-hidden="true"><rect width="16" height="16" fill="#2e8b57"/><circle cx="8" cy="8" r="3.2" fill="#1f6b41"/></svg> Available</span>
    <span><i class="swatch swatch-red"></i> Not available</span>
    <span><i class="swatch swatch-neutral"></i> Not yet reviewed</span>
  </div>
  <p id="telehealth-map-status">Hover or tap a state for details. Click to keep details visible.</p>
</div>

<style>
#telehealth-map-wrap { margin: 1.5rem 0; }
#telehealth-map-status {
  min-height: 2.8em;
  line-height: 1.4em;
}
#telehealth-map-svg-holder svg { width: 100%; height: auto; max-width: 720px; display: block; }
#telehealth-map-svg-holder path,
#telehealth-map-svg-holder g[id] {
  outline: none;
}
#telehealth-map-svg-holder path {
  stroke: var(--body-background, #fff);
  stroke-width: 1;
  cursor: pointer;
  transition: opacity 0.1s ease;
}
#telehealth-map-svg-holder path:hover {
  opacity: 0.75;
  stroke: #333;
  stroke-width: 1.5;
}
#telehealth-map-svg-holder path.telehealth-active {
  opacity: 1;
  stroke: #000;
  stroke-width: 4;
  paint-order: stroke;
}
.telehealth-state-green   { fill: url(#pattern-green); }
.telehealth-state-red     { fill: #c0392b; }
.telehealth-state-neutral { fill: #b0b0b0; }
#telehealth-map-svg-holder g[id="OUTSIDE_USA"] circle { cursor: pointer; }
#telehealth-map-svg-holder g[id="OUTSIDE_USA"]:hover circle {
  opacity: 0.75;
  stroke: #333;
  stroke-width: 1.5;
}
#telehealth-map-svg-holder g[id="OUTSIDE_USA"].telehealth-active circle {
  opacity: 1;
  stroke: #000;
  stroke-width: 4;
}
.telehealth-legend { display: flex; gap: 1.25rem; flex-wrap: wrap; margin: 0.75rem 0; font-size: 0.9rem; }
.telehealth-legend .swatch { display: inline-block; width: 0.9em; height: 0.9em; margin-right: 0.35em; border-radius: 2px; vertical-align: -0.1em; }
.swatch-red     { background: #c0392b; }
.swatch-neutral { background: #b0b0b0; }
</style>

<script>
(function () {
  var STATUS = {
    OR: { color: 'green',   note: 'I practice under <a href="https://oregon.public.law/statutes/ors_675.825" target="_blank" rel="noopener">ORS 675.825(4)(a)</a>.' },
    IL: {
      color: 'green',
      note: '<a href="https://www.ilga.gov/Legislation/ILCS/Articles?ActID=1324&amp;ChapterID=24" target="_blank" rel="noopener">225 ILCS 107, Section 15</a> states: "This Act does not prohibit the practice of nonregulated professions whose practitioners are engaged in the delivery of human services as long as these practitioners do not represent themselves as or use the title of—" a restricted, licensed profession. I do not use restricted titles, so I am available to Illinois residents.'
    },
    MN: {
      color: 'green',
      note: 'Minnesota regulates unlicensed complementary and alternative health care practitioners under <a href="https://www.revisor.mn.gov/statutes/cite/146a" target="_blank" rel="noopener">Minn. Stat. Ch. 146A</a>. Prospective clients are required to read the <a href="https://www.revisor.mn.gov/statutes/cite/146A.11" target="_blank" rel="noopener">client bill of rights (Minn. Stat. §146A.11)</a> before I can work with you.'
    },
    CO: {
      color: 'red',
      note: 'As of December 31, 2022 new applications are no longer accepted for Unlicensed Psychotherapists. See <a href="https://dpo.colorado.gov/UnlicensedPsychotherapy/Applications" target="_blank" rel="noopener">Colorado DORA — Unlicensed Psychotherapist Applications</a>.'
    },
    CA: {
      color: 'red',
      note: '<a href="https://law.justia.com/codes/california/code-bpc/division-2/chapter-6-6/article-1/section-2903/" target="_blank" rel="noopener">Bus. &amp; Prof. Code \u00a72903</a> defines the "practice of psychology" broadly, as any psychological service "involving the application of psychological principles, methods, and procedures of understanding, predicting, and influencing behavior, such as the principles pertaining to learning, perception, motivation, emotions, and interpersonal relationships; and the methods and procedures of interviewing, counseling, psychotherapy, behavior modification, and hypnosis." This scope is broad enough to cover IFS-based work by an unlicensed practitioner.'
    },
    NY: {
      color: 'red',
      note: 'Treats "psychotherapy" as a restricted scope-of-practice activity shared among licensed professions. Unlicensed practice of psychology is a felony (<a href="https://www.nysenate.gov/legislation/laws/EDN/6512" target="_blank" rel="noopener">Ed. Law \u00a76512</a>). The NY Office of the Professions says that individuals/organizations may provide "instruction, advice, support, encouragement or information," which is the narrow lane coaches rely on. But it is not clear whether my services fit within that lane.'
    },
    OUTSIDE_USA: { color: 'green', note: 'Cross-border practice may still be subject to the laws of your own country.' }
  };
  var DEFAULT_NOTE = 'Not yet reviewed. Please raise this during the free consultation.';

  var holder = document.getElementById('telehealth-map-svg-holder');
  var statusEl = document.getElementById('telehealth-map-status');

  function infoFor(code) {
    return STATUS[code] || { color: 'neutral', note: DEFAULT_NOTE };
  }

  fetch('/svg/us-states.svg')
    .then(function (r) { return r.text(); })
    .then(function (svgText) {
      holder.innerHTML = svgText;
      var regions = holder.querySelectorAll('path[id], g[id]');
      var locked = null;

      function clearActive() {
        regions.forEach(function (r) { r.classList.remove('telehealth-active'); });
      }

      var hintText = statusEl.textContent;

      function render(region, name, info) {
        clearActive();
        if (region) {
          region.classList.add('telehealth-active');
          region.parentNode.appendChild(region);
          statusEl.innerHTML = '<strong>' + name + ':</strong> ' + info.note;
        } else {
          statusEl.textContent = hintText;
        }
      }

      regions.forEach(function (region) {
        var code = region.id;
        var info = infoFor(code);
        var target = region.tagName.toLowerCase() === 'g' ? region.querySelector('circle') : region;
        target.classList.add('telehealth-state-' + info.color);
        var name = region.getAttribute('data-name') || code;

        region.addEventListener('mouseenter', function () {
          if (!locked) render(region, name, info);
        });
        region.addEventListener('focus', function () {
          if (!locked) render(region, name, info);
        });
        region.addEventListener('mouseleave', function () {
          if (!locked) render(null);
        });
        region.addEventListener('click', function (e) {
          e.stopPropagation();
          if (locked === region) {
            locked = null;
            render(null);
          } else {
            locked = region;
            render(region, name, info);
          }
        });
        region.setAttribute('tabindex', '0');
        region.setAttribute('role', 'button');
        region.setAttribute('aria-label', name + ': ' + info.note);
      });

      holder.addEventListener('mouseleave', function () {
        if (!locked) render(null);
      });
      document.addEventListener('click', function (e) {
        if (locked && !holder.contains(e.target) && !statusEl.contains(e.target)) {
          locked = null;
          render(null);
        }
      });
    });
})();
</script>
