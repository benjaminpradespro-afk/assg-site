(function () {
  const $ = (s) => document.querySelector(s);
  const JOUR_MS = 86400000;

  const quand = (m) => new Date(m.d + "T" + (m.t || "12:00") + ":00");
  const fmt = (m, o) => new Intl.DateTimeFormat("fr-FR", o).format(quand(m));
  const dateLongue = (m) => fmt(m, { weekday: "long", day: "numeric", month: "long" });
  const dateCourte = (m) => fmt(m, { day: "2-digit", month: "2-digit" });
  const heure = (t) => (t ? t.replace(":", "h") : "");
  const joue = (m) => m.h !== undefined;

  const ICONES = {
    dom: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 2 12h3v9h5v-6h4v6h5v-9h3z"/></svg>',
    ext: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 11l1.6-4.6A2 2 0 0 1 8.5 5h7a2 2 0 0 1 1.9 1.4L19 11a2 2 0 0 1 2 2v5h-2v2h-3v-2H8v2H5v-2H3v-5a2 2 0 0 1 2-2zm2.2 0h9.6l-1.2-3.6a.5.5 0 0 0-.5-.4h-6.2a.5.5 0 0 0-.5.4zM6.5 16a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm11 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/></svg>'
  };

  function issue(m) {
    if (m.res) return m.res;
    const nous = m.dom ? m.h : m.a;
    const eux = m.dom ? m.a : m.h;
    return nous > eux ? "V" : nous < eux ? "D" : "N";
  }
  const LIBELLE = { V: "Victoire", N: "Match nul", D: "Défaite" };
  const PILL = { V: "Victoire", N: "Nul", D: "Défaite" };
  const affiche = (m) => (m.dom ? ["ASSG", m.adv] : [m.adv, "ASSG"]);

  const tous = EQUIPES.flatMap((e) => e.matchs.map((m) => ({ ...m, equipe: e })));
  const debutJour = new Date(); debutJour.setHours(0, 0, 0, 0);

  const aVenir = tous.filter((m) => !joue(m) && quand(m) >= debutJour)
    .sort((x, y) => quand(x) - quand(y) || x.equipe.id.localeCompare(y.equipe.id));
  const passes = tous.filter(joue).sort((x, y) => quand(y) - quand(x));

  const monogramme = (nom) => nom.replace(/^(AS|FC|CS|US|A\.)\s+/, "").replace(/[^A-Za-zÀ-ÿ]/g, "").slice(0, 3).toUpperCase();
  /* Logo d'un club d'après son numéro FFF ; sans logo connu, le site affiche ses initiales */
  const logo = (nom, num) => {
    if (nom === "ASSG" || num === 524952) return '<img class="logo" src="assets/logo.png" alt="">';
    return num
      ? `<img class="logo logo-club" src="assets/clubs/${num}.jpg" alt="">`
      : `<span class="mono" aria-hidden="true">${monogramme(nom)}</span>`;
  };

  /* Card du prochain match et compte à rebours */
  const prochain = aVenir[0];
  if (prochain) {
    const [a, b] = affiche(prochain);
    const equipe = (nom, lieu) => `<div class="eq-v">${logo(nom, prochain.logo)}<b>${nom}</b><small>${lieu}</small></div>`;
    $("#next").innerHTML = `
      <div class="next-haut">
        <span class="pill pill-vif">Prochain match</span>
        <span class="next-comp">${prochain.equipe.nom} · ${prochain.c}</span>
      </div>
      <div class="versus">
        ${equipe(a, "Domicile")}
        <span class="vs" aria-label="contre">VS</span>
        ${equipe(b, "Extérieur")}
      </div>
      <p class="next-date">${dateLongue(prochain).replace(/^./, (c) => c.toUpperCase())} à <mark>${heure(prochain.t)}</mark></p>
      <div class="next-bas">
        <div class="count" id="count" role="timer" aria-label="Temps restant avant le coup d'envoi"></div>
        <a class="btn" href="#prog-section">Le programme</a>
      </div>`;
    const tic = () => {
      const r = Math.max(0, quand(prochain) - Date.now());
      const parts = [[Math.floor(r / JOUR_MS), "jours"], [Math.floor(r / 3600000) % 24, "heures"], [Math.floor(r / 60000) % 60, "min"]];
      $("#count").innerHTML = parts.map(([n, l]) => `<span><b>${String(n).padStart(2, "0")}</b>${l}</span>`).join("");
    };
    tic();
    setInterval(tic, 30000);
  } else {
    $("#next").innerHTML ='<div class="next-haut"><span class="pill pill-vif">Saison terminée</span></div><p class="next-date" style="margin-top:18px">Rendez-vous à la reprise.</p>';
  }

  /* Calendrier en tuiles : les derniers résultats, puis les prochains matchs */
  const celluleScore = (m) => {
    const [a, b] = affiche(m);
    const fait = joue(m);
    const res = fait ? issue(m) : "";
    const gagnant = fait ? (m.h > m.a ? 0 : m.h < m.a ? 1 : -1) : -1;
    const estProchain = prochain && !fait && quand(m).getTime() === quand(prochain).getTime();
    const pill = fait
      ? `<span class="pill pill-${res}">${PILL[res]}</span>`
      : `<span class="pill ${estProchain ? "pill-vif" : "pill-h"}">${heure(m.t)}</span>`;
    const ligne = (nom, score, n) => `<span class="sb-l ${gagnant === n ? "sb-g" : ""}">${logo(nom, m.logo)}<span class="sb-n">${nom}</span>${fait ? `<b>${score}</b>` : ""}</span>`;
    return `<li><a class="sb tuile-pleine ${fait ? "r-" + res : "sb-fut"} ${estProchain ? "sb-next" : ""}" href="#resultats" data-voir="${m.equipe.id}" title="${m.note || m.c}">
      <span class="sb-haut"><span class="sb-d">${fmt(m, { weekday: "short", day: "numeric", month: "short" })}</span>${pill}</span>
      <span class="sb-c">${m.equipe.court} · ${m.c}</span>
      ${ligne(a, m.h, 0)}${ligne(b, m.a, 1)}
    </a></li>`;
  };
  const faits = passes.filter((m) => !m.ff).slice(0, 7).reverse();
  const sb = $("#scoreboard");
  sb.innerHTML = [...faits, ...aVenir.slice(0, 6)].map(celluleScore).join("");
  const premierFutur = sb.querySelector(".sb-fut");
  if (premierFutur) sb.scrollLeft = Math.max(0, premierFutur.parentElement.offsetLeft - sb.clientWidth * 0.5);
  const defiler = (sens) => sb.scrollBy({ left: sens * sb.clientWidth * 0.8, behavior: "smooth" });
  $("#sb-prec").addEventListener("click", () => defiler(-1));
  $("#sb-suiv").addEventListener("click", () => defiler(1));

  /* Programme du week-end : tous les matchs à moins de 2 jours du prochain */
  const weekend = prochain ? aVenir.filter((m) => quand(m) - quand(prochain) < 2 * JOUR_MS) : [];
  $("#wk-date").textContent = prochain ? `À partir du ${dateLongue(prochain)}` : "";
  $("#programme").innerHTML = weekend.map((m) => `
    <li class="prog tuile-pleine">
      <span class="prog-ico" title="${m.dom ? "À domicile" : "À l'extérieur"}">${m.dom ? ICONES.dom : ICONES.ext}</span>
      ${logo(m.adv, m.logo)}
      <span class="prog-adv">${m.adv}<small><span class="pill pill-vif">${m.equipe.court}</span> ${m.dom ? "À domicile" : "À l'extérieur"} · ${m.c}</small></span>
      <span class="prog-h"><small>${fmt(m, { weekday: "short" })}</small>${heure(m.t)}</span>
    </li>`).join("") || '<li class="vide">Aucun match programmé pour le moment.</li>';

  /* Résultats par équipe */
  const ligneMatch = (m) => {
    const [a, b] = affiche(m);
    const res = joue(m) ? (m.ff ? "F" : issue(m)) : "";
    const score = joue(m)
      ? `<span class="sc sc-${res}" aria-label="Score ${m.h} à ${m.a}"><b>${m.h}</b><b>${m.a}</b></span>`
      : `<span class="sc sc-h">${heure(m.t)}</span>`;
    return `<li class="m tuile-pleine ${res ? "r-" + res : ""}">
      <span class="m-date">${dateCourte(m)}</span>
      <span class="m-logo">${logo(m.adv, m.logo)}</span>
      <span class="m-eq"><span class="${m.dom ? "nous" : ""}">${a}</span><span class="${m.dom ? "" : "nous"}">${b}</span></span>
      <span class="m-comp">${m.c}${m.note ? " · " + m.note : ""}</span>
      ${score}
    </li>`;
  };

  function rendEquipe(e) {
    const res = e.matchs.filter(joue).slice().reverse();
    const fut = e.matchs.filter((m) => !joue(m) && quand(m) >= debutJour);
    const reel = res.filter((m) => !m.ff);
    const decompte = { V: 0, N: 0, D: 0 };
    res.forEach((m) => decompte[m.ff ? "D" : issue(m)]++);
    const total = res.length || 1;
    const forme = res.slice(0, 5).reverse().map((m) => {
      const i = m.ff ? "D" : issue(m);
      return `<i class="f f-${i}" title="${LIBELLE[i]} · ${m.adv}">${i}</i>`;
    }).join("");
    const pos = e.classement.findIndex((l) => l[0] === e.club) + 1;
    const buts = reel.reduce((s, m) => s + (m.dom ? m.h : m.a), 0);

    $("#equipe-panel").innerHTML = `
      <div class="eq-head">
        <div class="eq-titre card"><h3>${e.nom}</h3><p>${e.niveau}</p></div>
        ${e.avis ? "" : `<dl class="eq-kpi">
          <div class="card kpi-vif"><dt>Classement</dt><dd>${pos}<sup>e</sup></dd></div>
          <div class="card"><dt>Points</dt><dd>${e.classement[pos - 1][1]}</dd></div>
          <div class="card"><dt>Buts marqués</dt><dd>${buts}</dd></div>
          <div class="card eq-forme"><dt>Forme</dt><dd>${forme}</dd></div>
        </dl>`}
      </div>
      ${e.avis ? `<p class="avis">${e.avis}</p>` : ""}
      ${res.length && !e.avis ? `<div class="bilan" role="img" aria-label="${decompte.V} victoires, ${decompte.N} nuls, ${decompte.D} défaites toutes compétitions">
        <span class="b-V" style="flex:${decompte.V}">${decompte.V ? decompte.V + " V" : ""}</span>
        <span class="b-N" style="flex:${decompte.N}">${decompte.N ? decompte.N + " N" : ""}</span>
        <span class="b-D" style="flex:${decompte.D}">${decompte.D ? decompte.D + " D" : ""}</span>
      </div><p class="bilan-note">${total} matchs joués, toutes compétitions</p>` : ""}
      <div class="eq-cols">
        <div class="eq-matchs">
          ${fut.length ? `<h4>À venir</h4><ul class="ms">${fut.slice(0, 4).map(ligneMatch).join("")}</ul>` : ""}
          <h4>Résultats</h4>
          <ul class="ms">${res.map(ligneMatch).join("")}</ul>
        </div>
        <div class="eq-table">
          <h4>Classement</h4>
          <div class="table-wrap"><table>
            <thead><tr><th>#</th><th class="tl">Équipe</th><th>Pts</th><th>J</th><th>G</th><th>N</th><th>P</th><th>Diff</th></tr></thead>
            <tbody>${e.classement.map((l, i) => `<tr class="${l[0] === e.club ? "nous-row" : ""}">
              <td>${i + 1}</td><td class="tl"><span class="tb-eq">${logo(l[0], l[9])}<span>${l[0]}</span></span></td><td class="pts">${l[1]}</td><td>${l[2]}</td><td>${l[3]}</td><td>${l[4]}</td><td>${l[5]}</td><td>${l[8] > 0 ? "+" : ""}${l[8]}</td>
            </tr>`).join("")}</tbody>
          </table></div>
        </div>
      </div>`;
  }

  const onglets = $("#onglets");
  onglets.innerHTML = EQUIPES.map((e, i) =>
    `<button class="card" role="tab" id="tab-${e.id}" aria-controls="equipe-panel" aria-selected="${i === 0}" data-e="${e.id}"><b>${e.court}</b>${e.nom}</button>`
  ).join("");
  function choisir(id) {
    const e = EQUIPES.find((x) => x.id === id) || EQUIPES[0];
    onglets.querySelectorAll("button").forEach((b) => b.setAttribute("aria-selected", b.dataset.e === e.id));
    $("#equipe-panel").setAttribute("aria-labelledby", "tab-" + e.id);
    rendEquipe(e);
  }
  onglets.addEventListener("click", (ev) => {
    const b = ev.target.closest("button");
    if (b) choisir(b.dataset.e);
  });
  document.addEventListener("click", (ev) => {
    const a = ev.target.closest("[data-voir]");
    if (a) choisir(a.dataset.voir);
  });
  choisir("s1");

  /* Actualités : grande une, encart, article moyen, brèves */
  const dateActu = (d) => new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(d + "T12:00:00"));
  const meta = (a) => `<p class="actu-meta"><span class="pill pill-vif">${a.tag}</span> ${dateActu(a.date)}</p>`;
  /* Résumé des matchs : il change chaque lundi à 8 h, après la mise à jour matinale des résultats,
     et porte sur la dernière semaine terminée où l'ASSG a joué. Les forfaits du club n'y figurent pas. */
  const lundiDe = (d) => { const l = new Date(d); l.setDate(l.getDate() - (l.getDay() + 6) % 7); l.setHours(8, 0, 0, 0); return l; };
  const scoreDe = (m) => `${Math.max(m.h, m.a)}-${Math.min(m.h, m.a)}`;
  const auxTirs = (m) => /tirs au but/.test(m.note || "");
  const VERBE = { V: "s'imposent", N: "font match nul", D: "s'inclinent" };
  const titreMatch = (m) => {
    if (auxTirs(m)) return `${LIBELLE[issue(m)]} aux tirs au but contre ${m.adv}`;
    if (m.note) return `${LIBELLE[issue(m)]} par forfait contre ${m.adv}`;
    return `${LIBELLE[issue(m)]} <mark class="nb">${scoreDe(m)}</mark> contre ${m.adv}`;
  };

  function resumeDuLundi() {
    const maintenant = new Date();
    const bascule = lundiDe(maintenant);
    if (bascule > maintenant) bascule.setDate(bascule.getDate() - 7);
    const finis = passes.filter((m) => !m.ff && quand(m) < bascule);
    if (!finis.length) return null;
    const semaine = lundiDe(quand(finis[0])).getTime();
    const [m, ...autres] = finis.filter((x) => lundiDe(quand(x)).getTime() === semaine)
      .sort((x, y) => x.equipe.id.localeCompare(y.equipe.id) || quand(y) - quand(x));
    const e = m.equipe;
    const [a, b] = affiche(m);
    const lieu = m.dom ? "à domicile" : "à l'extérieur";
    const issueTexte = `${auxTirs(m) ? VERBE.N : VERBE[issue(m)]} ${scoreDe(m)} contre ${m.adv}${m.note ? ` (${m.note.toLowerCase()})` : ""}`;
    let texte =`${dateLongue(m).replace(/^./, (c) => c.toUpperCase())}, ${lieu}, les ${e.nom} ${issueTexte} en ${m.c}.`;
    const ligne = e.classement.find((l) => l[0] === e.club);
    if (ligne && !e.avis && e.niveau.startsWith(m.c)) {
      const rang = e.classement.indexOf(ligne) + 1;
      texte += ` Ils occupent la ${rang === 1 ? "1re" : rang + "e"} place avec <mark>${ligne[1]} point${ligne[1] > 1 ? "s" : ""}</mark>.`;
    }
    const prochainMatch = aVenir.find((x) => x.equipe === e);
    return {
      date: m.d, tag: m.c, voir: e.id, titre: titreMatch(m), texte,
      visuel: logo(a, m.logo) + logo(b, m.logo),
      une: { haut: "Résumé", bas: [0, 6].includes(quand(m).getDay()) ? "du week-end" : "du match", a, b, h: m.h, c: m.a },
      suite: (autres.length ? `<ul class="une-autres">${autres.map((x) => `<li><b>${x.equipe.nom}</b> · ${titreMatch(x)}</li>`).join("")}</ul>` : "")
        + (prochainMatch ? `<p class="une-suite">Prochain rendez-vous des ${e.nom} : ${dateLongue(prochainMatch)}${prochainMatch.t ? " à " + heure(prochainMatch.t) : ""}, ${prochainMatch.dom ? "à domicile" : "à l'extérieur"} contre ${prochainMatch.adv}.</p>` : "")
    };
  }

  /* Le résumé occupe la une, les posts Instagram les autres places ; à défaut, les actualités de data.js */
  const [actuFixe, ...autresActus] = ACTUS;
  const une = resumeDuLundi() || actuFixe;
  const [rail, moyen, ...breves] = [...POSTS_INSTAGRAM, ...autresActus].slice(0, 5);
  const u = une.une;
  $("#lede-une").innerHTML = `
    <div class="une-visuel">
      ${une.visuel ? `<div class="une-logos">${une.visuel}</div>` : `<div class="une-img"><img src="${une.img}" alt="${une.alt}"></div>`}
      <div class="une-type">
        <span class="une-gros">${u.haut}<br>${u.bas}</span>
        <span class="une-score"><small>${u.a}</small><b class="${u.h > u.c ? "gagne" : ""}">${u.h}</b><b class="${u.c > u.h ? "gagne" : ""}">${u.c}</b><small>${u.b}</small></span>
      </div>
    </div>
    <div class="actu-corps">
      ${meta(une)}
      <h3><a ${une.voir ? `href="#resultats" data-voir="${une.voir}"` : `href="${une.lien}" target="_blank" rel="noopener"`}>${une.titre}</a></h3>
      <p class="une-txt">${une.texte}</p>
      ${une.suite || ""}
    </div>`;
  $("#lede-rail").innerHTML = `
    <img src="${rail.img}" alt="${rail.alt}">
    <div class="actu-corps">
      ${meta(rail)}
      <h3><a href="${rail.lien}" target="_blank" rel="noopener">${rail.titre}</a></h3>
      <p>${rail.texte}</p>
    </div>`;
  $("#lede-moyen").innerHTML = `
    <div class="moyen-img"><img src="${moyen.img}" alt="${moyen.alt}" loading="lazy"></div>
    <div class="actu-corps">
      ${meta(moyen)}
      <h3><a href="${moyen.lien}" target="_blank" rel="noopener">${moyen.titre}</a></h3>
      <p>${moyen.texte}</p>
    </div>`;
  $("#lede-liste").innerHTML = breves.map((a) => `
    <li><a class="card" href="${a.lien}" target="_blank" rel="noopener">
      <img src="${a.img}" alt="" loading="lazy">
      <span>${meta(a)}<strong>${a.titre}</strong></span>
    </a></li>`).join("");

  /* Module « En images » : la vignette choisie s'ouvre en grand */
  const galImg = $("#gal-img");
  const galLien = $("#gal-lien");
  const galListe = $("#gal-liste");
  galListe.innerHTML = MUR.map((m, i) => `
    <li><button type="button" class="card" data-i="${i}" aria-current="${i === 0}">
      <span class="gal-t"><strong>${m.titre}</strong><small>${m.sous}</small></span>
      <img src="${m.img}" alt="" loading="lazy">
    </button></li>`).join("");
  function montrer(i) {
    const m = MUR[i];
    galImg.src = m.img;
    galImg.alt = m.alt;
    galLien.href = m.lien;
    galLien.setAttribute("aria-label", m.titre + ", voir sur Instagram");
    galListe.querySelectorAll("button").forEach((b) => b.setAttribute("aria-current", b.dataset.i === String(i)));
  }
  galListe.addEventListener("click", (ev) => {
    const b = ev.target.closest("button");
    if (b) montrer(Number(b.dataset.i));
  });
  montrer(0);

  /* Agenda : événements du club et matchs à domicile */
  const evts = EVENEMENTS.map((e) => ({ d: e.date, t: e.heure, titre: e.titre, lieu: e.lieu, type: "Événement" }))
    .filter((e) => quand(e) >= debutJour);
  const domicile = aVenir.filter((m) => m.dom).map((m) => ({
    d: m.d, t: m.t, titre: `ASSG contre ${m.adv}`, adv: m.adv, logo: m.logo, lieu: "Stade municipal", type: m.equipe.nom + " · " + m.c
  }));
  const agenda = [...evts, ...domicile].sort((x, y) => quand(x) - quand(y)).slice(0, 6);
  $("#agenda").innerHTML = agenda.map((e) => `
    <li class="ag tuile-pleine">
      <time datetime="${e.d}"><b>${fmt(e, { day: "2-digit" })}</b>${fmt(e, { month: "short" })}</time>
      <span class="ag-txt"><strong>${e.titre}</strong><small><span class="ag-h">${heure(e.t)}</span> · ${e.type}</small></span>
      ${e.adv ? `<span class="ag-logo">${logo(e.adv, e.logo)}</span>` : ""}
    </li>`).join("") || '<li class="vide">Le calendrier sera publié prochainement.</li>';

  /* Carte du stade : Plans sur iPhone et iPad, Google Maps sur Android et ordinateur.
     Un iPad récent se présente comme un Mac : on le reconnaît à son écran tactile.
     Sur mobile, le lien reste dans le même onglet pour ouvrir l'application sans laisser d'onglet vide. */
  const ua = navigator.userAgent;
  const surIOS = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  SITE.liens.carte = surIOS ? SITE.liens.plans : SITE.liens.googleMaps;
  if (surIOS || /Android/.test(ua)) $('[data-lien="carte"]').removeAttribute("target");

  /* Partenaires et liens */
  const partenaires = (attr) => PARTENAIRES.map((p) => `<li class="card"${attr}>${p}</li>`).join("");
  $("#partenaires").innerHTML = partenaires("") + partenaires(' aria-hidden="true"');
  $("#partenaires").style.setProperty("--duree", `${PARTENAIRES.length * 3.5}s`);
  $("#part-pause").addEventListener("click", (ev) => {
    ev.currentTarget.setAttribute("aria-pressed", $("#defile").classList.toggle("en-pause"));
  });
  document.querySelectorAll("[data-lien]").forEach((a) => { a.href = SITE.liens[a.dataset.lien]; });
  document.querySelectorAll("[data-maj]").forEach((n) => { n.textContent = MAJ_RESULTATS; });

  /* La surbrillance des cards suit la souris */
  document.addEventListener("pointermove", (ev) => {
    const c = ev.target.closest && ev.target.closest(".card");
    if (!c) return;
    const r = c.getBoundingClientRect();
    c.style.setProperty("--mx", ev.clientX - r.left + "px");
    c.style.setProperty("--my", ev.clientY - r.top + "px");
  }, { passive: true });

  /* Menu mobile */
  const burger = $("#burger");
  const nav = $("#nav");
  burger.addEventListener("click", () => {
    const ouvert = nav.classList.toggle("ouvert");
    burger.setAttribute("aria-expanded", ouvert);
  });
  nav.addEventListener("click", (e) => {
    if (e.target.tagName === "A") { nav.classList.remove("ouvert"); burger.setAttribute("aria-expanded", false); }
  });
})();
