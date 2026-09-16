---
title: Telehealth Eligibility by State
type: docs
weight: 5
bookToc: false
bookHidden: true
---

# Telehealth Eligibility by State

Telehealth is governed by the laws of the state where **you, the client, are physically located** at the time of the session. Some states restrict unlicensed practitioners like me from serving residents.

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
#telehealth-map-svg-holder g[id] circle { cursor: pointer; transition: opacity 0.1s ease; }
#telehealth-map-svg-holder g[id]:hover circle {
  opacity: 0.75;
  stroke: #333;
  stroke-width: 1.5;
}
#telehealth-map-svg-holder g[id].telehealth-active circle {
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
    MA: {
      color: 'green',
      note: 'Unlicensed practice as "counselor" or "therapist" is expressly permitted if not held out as licensed. See <a href="https://malegislature.gov/Laws/GeneralLaws/PartI/TitleXVI/Chapter112/Section164" target="_blank" rel="noopener">Mass. Gen. Laws ch. 112, §164</a>.'
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
    DC: {
      color: 'red',
      note: 'Its psychology act is broad, non-diagnosis-dependent, and has prior drafting history explicitly folding "coaching" into regulated practice. Unlicensed practice of a health occupation in DC is a criminal offense under <a href="https://code.dccouncil.gov/us/dc/council/code/sections/3-1210.07" target="_blank" rel="noopener">DC Code § 3-1210.07</a>.'
    },
    WA: {
      color: 'green',
      note: 'Liability is restricted to representing yourself as a licensed psychologist. See <a href="https://app.leg.wa.gov/rcw/default.aspx?cite=18.83.020" target="_blank" rel="noopener">RCW 18.83.020</a>.'
    },
    TX: {
      color: 'red',
      note: '<a href="https://statutes.capitol.texas.gov/?tab=1&amp;code=OC&amp;chapter=OC.501&amp;artSec=501.003" target="_blank" rel="noopener">Tex. Occ. Code §501.003(c)(3)</a> exempts advice, counsel, or guidance offered through "an organized or structured program or peer support service" designed to support a self-identified goal of changing or improving mental, emotional, or behavioral health, which might cover this work. But <a href="https://codes.findlaw.com/tx/occupations-code/occ-sect-503-003/" target="_blank" rel="noopener">Chapter 503 (professional counseling)</a> separately restricts unlicensed counseling, and it is not clear the §501.003(c)(3) exemption carries over to Chapter 503.'
    },
    NC: {
      color: 'green',
      note: '<a href="https://law.justia.com/codes/north-carolina/chapter-90/article-24/section-90-330/" target="_blank" rel="noopener">N.C. Gen. Stat. §90-330</a> defines "practice of counseling" as holding oneself out to the public as a "professional counselor." The restriction is tied to that title, which I do not use, so I am available to North Carolina residents.'
    },
    MI: {
      color: 'green',
      note: '<a href="https://www.legislature.mi.gov/Laws/MCL?objectName=mcl-333-18115" target="_blank" rel="noopener">MCL §333.18115</a> does not limit the practice of another occupation where counseling is incidental, "and the individual does not hold himself or herself out as a counselor regulated under this article." The law otherwise restricts only use of the word "counselor" paired with "licensed" or "professional."'
    },
    IA: {
      color: 'green',
      note: '<a href="https://www.legis.iowa.gov/docs/ico/chapter/154D.pdf" target="_blank" rel="noopener">Iowa Code §154D.4(1)</a> lets members of other professions "provide or advertise" mental-health-counseling-type services, so long as they do not use a title or description denoting that they are licensed. I do not use restricted titles.'
    },
    NM: {
      color: 'red',
      note: '<a href="https://law.justia.com/codes/new-mexico/chapter-61/article-9a/section-61-9a-6/" target="_blank" rel="noopener">N.M. Stat. §61-9A-6</a> exempts an "alternative, metaphysical or holistic practitioner" engaging in "nonclinical activities" from the Counseling and Therapy Practice Act, but it is genuinely unclear whether paid, structured IFS sessions addressing emotional and mental conditions count as "nonclinical," so I am marking this red out of caution.'
    },
    FL: {
      color: 'red',
      note: '<a href="https://www.flsenate.gov/Laws/Statutes/2023/491.003" target="_blank" rel="noopener">Fla. Stat. §491.003</a> broadly defines "practice of mental health counseling" as using behavioral science methods to describe, prevent, and treat undesired behavior. <a href="https://www.flsenate.gov/laws/statutes/2018/491.012" target="_blank" rel="noopener">§491.012</a> bans that activity for compensation without a license, with no general exemption for unlicensed practitioners.'
    },
    GA: {
      color: 'red',
      note: '<a href="https://law.justia.com/codes/georgia/title-43/chapter-39/article-1/section-43-39-7/" target="_blank" rel="noopener">O.C.G.A. §43-39-7</a> exempts other *licensed* professions (nursing, counseling, social work) from the psychology act, which does not help an unlicensed practitioner. The underlying "practice of psychology" definition is broad.'
    },
    SC: {
      color: 'red',
      note: '<a href="https://www.scstatehouse.gov/code/t40c055.php" target="_blank" rel="noopener">S.C. Code §40-55-90</a> exempts clergy, school personnel, other licensed professionals acting within their scope, and unpaid voluntary emotional support&mdash;but has no exemption for a paid, unlicensed private practice.'
    },
    VA: {
      color: 'red',
      note: '<a href="https://law.lis.virginia.gov/vacode/title54.1/chapter35/section54.1-3501/" target="_blank" rel="noopener">Va. Code §54.1-3501</a> exempts several categories from counseling licensure, but explicitly states: "Any person who, in addition to the above-enumerated employment, engages in an independent private practice shall not be exempt from the requirements for licensure."'
    },
    OH: {
      color: 'red',
      note: '<a href="https://codes.ohio.gov/ohio-revised-code/section-4757.02" target="_blank" rel="noopener">Ohio Rev. Code §4757.02(A)</a> bars the activity of "engag[ing] in... the practice of professional counseling for a fee" without a license. The exemptions in §4757.41 are tied to specific government/employment roles, not general unlicensed practice.'
    },
    WI: {
      color: 'red',
      note: '<a href="https://docs.legis.wisconsin.gov/document/statutes/457.04" target="_blank" rel="noopener">Wis. Stat. §457.04(6)</a> prohibits any person from practicing professional counseling, or designating themselves a counselor, or using protected titles, unless licensed&mdash;an activity-based ban, not just a title restriction.'
    },
    PA: {
      color: 'red',
      note: '<a href="https://codes.findlaw.com/pa/title-63-ps-professions-and-occupations-state-licensed/pa-st-sect-63-1203/" target="_blank" rel="noopener">63 P.S. §1203</a> exempts only "qualified members of other recognized professions" (clergy, drug/alcohol counselors, social workers, etc.) from the psychology act. An unlicensed IFS practitioner does not fit any listed category.'
    },
    NJ: {
      color: 'red',
      note: '<a href="https://law.justia.com/codes/new-jersey/title-45/section-45-14b-6/" target="_blank" rel="noopener">N.J. Stat. §45:14B-6</a> exempts unlicensed psychological work only when performed as an employee of specific institutions (academic, government, business, or supervised nonprofit). There is no exemption for independent unlicensed practice.'
    },
    AZ: {
      color: 'red',
      note: '<a href="https://www.azleg.gov/ars/32/03271.htm" target="_blank" rel="noopener">A.R.S. §32-3271</a> exempts persons already licensed/certified under another chapter of Title 32 acting within that scope, clergy, unpaid self-help groups, students, and short-term non-residents. There is no exemption for an unlicensed private practitioner.'
    },
    NV: {
      color: 'red',
      note: '<a href="https://law.justia.com/codes/nevada/chapter-641a/statute-641a.410" target="_blank" rel="noopener">NRS 641A.410</a> bans unlicensed "practice of clinical professional counseling," defined broadly to include counseling toward mental, emotional, and behavioral disorders. Exemptions cover only other licensed/certified professionals and clergy incidental to ministry.'
    },
    UT: {
      color: 'red',
      note: '<a href="https://le.utah.gov/xcode/Title58/Chapter60/C58-60-S107_2023050320230503.pdf" target="_blank" rel="noopener">Utah Code §58-60-107</a> exempts clergy, academic researchers, students, and friends/relatives giving informal advice&mdash;but has no general exemption for a paid, unlicensed private practice.'
    },
    ID: {
      color: 'red',
      note: '<a href="https://legislature.idaho.gov/statutesrules/idstat/title54/t54ch34/sect54-3402/" target="_blank" rel="noopener">Idaho Code §54-3402</a> exempts only *licensed or credentialed* members of other professions acting within their scope. An unlicensed practitioner does not qualify, and practicing "for compensation" without a license is unlawful.'
    },
    MT: {
      color: 'red',
      note: '<a href="https://mca.legmt.gov/bills/2019/mca/title_0370/chapter_0170/part_0010/section_0040/0370-0170-0010-0040.html" target="_blank" rel="noopener">Mont. Code §37-17-104</a> exempts "qualified members of other professions" from psychology-type work, but the listed professions (physicians, social workers, lawyers, licensed counselors/therapists, educators) do not include unlicensed practitioners.'
    },
    WY: {
      color: 'red',
      note: '<a href="https://law.justia.com/codes/wyoming/2022/title-33/chapter-27/section-33-27-114/" target="_blank" rel="noopener">Wyo. Stat. §33-38-103</a> exempts clergy (unpaid, religiously-framed counseling) and approved volunteers for nonprofits/charities. There is no exemption for a paid, independent, unlicensed practice.'
    },
    AK: {
      color: 'red',
      note: '<a href="https://law.justia.com/codes/alaska/title-8/chapter-29/article-2/section-08-29-100/" target="_blank" rel="noopener">AS 08.29.100</a> bars unlicensed people from professing to be a counselor or using a confusable title, which alone would be a title restriction like Illinois or Washington. But <a href="https://law.justia.com/codes/alaska/title-8/chapter-29/article-4/section-08-29-490/" target="_blank" rel="noopener">AS 08.29.490</a> separately defines "practice of professional counseling" broadly, and I could not confirm whether unlicensed practice of that activity itself is also barred elsewhere in the chapter, so I am marking this red out of caution.'
    },
    HI: {
      color: 'green',
      note: '<a href="https://law.justia.com/codes/hawaii/title-25/chapter-465/section-465-3/" target="_blank" rel="noopener">Haw. Rev. Stat. §465-3(a)(6)</a> exempts any member of a mental health profession not requiring licensure, provided they function within that capacity and do not represent themselves as a psychologist or their services as psychological. I do not claim to be a psychologist, so I am available to Hawaii residents.'
    },
    IN: {
      color: 'red',
      note: '<a href="https://law.justia.com/codes/indiana/title-25/article-33/chapter-1/section-25-33-1-14/" target="_blank" rel="noopener">Ind. Code §25-33-1-14</a> bars anyone from rendering "psychological services" without a license. Exemptions cover clergy, licensed professionals, students, and nonprofit volunteers&mdash;not paid independent unlicensed practice.'
    },
    MO: {
      color: 'red',
      note: '<a href="https://law.justia.com/codes/missouri/title-xxii/chapter-337/section-337-505/" target="_blank" rel="noopener">Mo. Rev. Stat. §337.505</a> exempts counseling performed within another licensed occupation, school/postsecondary employment, and student interns. There is no exemption for an independent unlicensed practice.'
    },
    KS: {
      color: 'red',
      note: '<a href="https://ksrevisor.gov/statutes/chapters/ch65/065_058_0002.html" target="_blank" rel="noopener">Kan. Stat. §65-5802</a> defines "practice of professional counseling" to include diagnosis and treatment of mental disorders for a fee, and exempts only other licensed professionals and unpaid counseling&mdash;not paid unlicensed practice.'
    },
    NE: {
      color: 'red',
      note: '<a href="https://law.justia.com/codes/nebraska/chapter-38/statute-38-2115/" target="_blank" rel="noopener">Neb. Rev. Stat. §38-2115</a> defines "mental health practice" broadly (treatment, assessment, psychotherapy, counseling for emotional/behavioral conditions) and requires licensure or compact privilege to engage in it.'
    },
    ND: {
      color: 'red',
      note: '<a href="https://ndlegis.gov/cencode/t43c47.html" target="_blank" rel="noopener">N.D. Cent. Code §43-47-05</a> exempts only other *licensed* professionals acting within their own scope, plus government/school employees and students. An unlicensed private practitioner does not qualify.'
    },
    SD: {
      color: 'red',
      note: '<a href="https://sdlegislature.gov/Statutes/36-32-76" target="_blank" rel="noopener">S.D. Codified Laws §36-32-76</a> exempts only counseling performed by people in specific licensed, educational, governmental, or clergy roles. There is no exemption for a paid, unlicensed private practice.'
    },
    OK: {
      color: 'red',
      note: '<a href="https://law.justia.com/codes/oklahoma/title-59/section-59-1903/" target="_blank" rel="noopener">Okla. Stat. tit. 59, §1903</a> exemptions are tied to specific state-contracted nonprofit/for-profit employment settings, not general unlicensed practice.'
    },
    AR: {
      color: 'red',
      note: 'Arkansas\'s counseling act (<a href="https://law.justia.com/codes/arkansas/title-17/subtitle-2/chapter-27/subchapter-1/" target="_blank" rel="noopener">Ark. Code §17-27-101 et seq.</a>) is "both title and practice," meaning a license is required to render counseling services to Arkansas residents regardless of title used.'
    },
    LA: {
      color: 'red',
      note: '<a href="https://legis.la.gov/legis/Law.aspx?d=93055" target="_blank" rel="noopener">La. Rev. Stat. §37:1111</a> bans engaging in "the practice of mental health counseling" without a license, separate from its title-use ban. The only broad exemption is for clergy acting within their church employment.'
    },
    CT: {
      color: 'red',
      note: '<a href="https://law.justia.com/codes/connecticut/title-20/chapter-383c/section-20-195bb/" target="_blank" rel="noopener">Conn. Gen. Stat. §20-195bb(a)</a>: "no person may practice professional counseling unless licensed." Exemptions cover uncompensated counseling, emergencies, and clergy&mdash;not paid independent practice.'
    },
    RI: {
      color: 'red',
      note: '<a href="https://law.justia.com/codes/rhode-island/title-5/chapter-5-63-2/section-5-63-2-12/" target="_blank" rel="noopener">R.I. Gen. Laws §5-63.2-12</a> exempts "qualified members of other professions" doing consistent work, but it is unclear this reaches an unlicensed IFS coach with no other professional credential, so I am marking this red out of caution.'
    },
    VT: {
      color: 'red',
      note: '<a href="https://legislature.vermont.gov/statutes/section/26/065/03261" target="_blank" rel="noopener">26 V.S.A. §3261</a> defines "psychotherapy" as treatment, diagnosis, evaluation, or counseling for the purpose of alleviating mental disorders, for a consideration. No general exemption for unlicensed practitioners was found.'
    },
    NH: {
      color: 'red',
      note: 'New Hampshire\'s Mental Health Practice Act (<a href="https://law.justia.com/codes/new-hampshire/title-xxx/chapter-330-a/section-330-a-34/" target="_blank" rel="noopener">RSA 330-A:34</a>) exempts clergy and employees of licensed clinical organizations, but not independent unlicensed practitioners, from its ban on unlicensed diagnosis/treatment of DSM-referenced disorders.'
    },
    ME: {
      color: 'red',
      note: '<a href="https://legislature.maine.gov/legis/statutes/32/title32sec13851-1.pdf" target="_blank" rel="noopener">32 M.R.S. §13851</a> defines "professional counselor" and "counselor" by reference to rendering counseling services for a fee. No general unlicensed-practice exemption was found, so I am marking this red out of caution.'
    },
    MD: {
      color: 'red',
      note: '<a href="https://law.justia.com/codes/maryland/health-occupations/title-17/subtitle-1/section-17-101/" target="_blank" rel="noopener">Md. Health Occ. §17-101 et seq.</a> bars practicing "clinical professional counseling" for compensation without a license. Exemptions are limited to supervised students/trainees, not independent unlicensed practice.'
    },
    DE: {
      color: 'green',
      note: '<a href="https://delcode.delaware.gov/title24/c030/sc02/index.html" target="_blank" rel="noopener">24 Del. Code §3030</a> restricts only holding oneself out as a "licensed professional counselor of mental health" or using words implying that licensure&mdash;a title restriction, not a ban on the underlying practice. I do not use restricted titles, so I am available to Delaware residents.'
    },
    WV: {
      color: 'red',
      note: '<a href="https://code.wvlegislature.gov/30-31-11/" target="_blank" rel="noopener">W. Va. Code §30-31-11</a> exempts "qualified members of other recognized professions" (physicians, psychologists, social workers, lawyers, clergy, nurses, teachers) doing counseling consistent with their training&mdash;a list that does not include unlicensed IFS practitioners.'
    },
    KY: {
      color: 'red',
      note: '<a href="https://apps.legislature.ky.gov/law/statutes/statute.aspx?id=31957" target="_blank" rel="noopener">KRS §335.505</a> prohibits unlicensed practice of professional counseling; the activities it does not limit are tied to other specified licensed service providers, not independent unlicensed practice.'
    },
    TN: {
      color: 'red',
      note: 'Under Tennessee\'s mental health practice statutes, an unlicensed person is not considered competent to provide treatment for a mental health disorder, and such unlicensed treatment is illegal. See <a href="https://law.justia.com/codes/tennessee/title-63/chapter-22/part-1/section-63-22-117/" target="_blank" rel="noopener">Tenn. Code §63-22-117</a>.'
    },
    AL: {
      color: 'red',
      note: '<a href="https://law.justia.com/codes/alabama/title-34/chapter-8a/" target="_blank" rel="noopener">Ala. Code §34-8A-3</a>: "no person shall engage in the private practice of counseling in the state of Alabama without a valid license," subject only to specific listed exemptions that do not include unlicensed practitioners.'
    },
    MS: {
      color: 'red',
      note: 'Mississippi\'s counselor and psychologist licensing chapters (<a href="https://law.justia.com/codes/mississippi/2016/title-73/chapter-30" target="_blank" rel="noopener">Miss. Code Title 73, Ch. 30</a>) exempt only "qualified members of other professional groups," which does not clearly include an unlicensed IFS practitioner, so I am marking this red out of caution.'
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
        var target = region.tagName.toLowerCase() === 'g' ? region.querySelector('circle.telehealth-bubble') : region;
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
