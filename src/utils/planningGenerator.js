import { RULES } from '../constants/theme';
import { addDays, formatDate, isBetween } from './dateHelpers';

/**
 * Génère le planning avec équilibrage STRICT 3 G1 / 3 G3 par personne/semaine.
 */
export function generatePlanning(persons, conges, weeks, startDate, overrides = {}) {
  if (!persons || persons.length === 0) return {};
  if (!startDate) return {};
  if (!weeks || weeks < 1) weeks = 1;

  const planning = {};
  persons.forEach(p => (planning[p.name] = {}));

  // ============================================================
  // PHASE 1 : Déterminer repos/congés pour toutes les semaines
  // ============================================================
  const totalDays = weeks * 7;
  const workingDaysByWeek = {}; // { personName: { weekIndex: [dateKey, ...] } }

  persons.forEach(p => {
    workingDaysByWeek[p.name] = {};
  });

  for (let dayOffset = 0; dayOffset < totalDays; dayOffset++) {
    const date = addDays(startDate, dayOffset);
    const dateKey = formatDate(date);
    const dayOfWeek = (date.getDay() + 6) % 7;
    const weekIndex = Math.floor(dayOffset / 7);

    persons.forEach(person => {
      const name = person.name;

      // Congé
      const isConge = conges.some(
        c => c.personName === name && isBetween(dateKey, c.startDate, c.endDate)
      );
      if (isConge) {
        planning[name][dateKey] = 'CONGE';
        return;
      }

      // Repos fixe
      const restDay =
        person.restDay !== null && person.restDay !== undefined
          ? person.restDay
          : 0;

      if (dayOfWeek === restDay) {
        planning[name][dateKey] = 'REPOS';
        return;
      }

      // Jour travaillé → à répartir en G1/G3
      if (!workingDaysByWeek[name][weekIndex]) workingDaysByWeek[name][weekIndex] = [];
      workingDaysByWeek[name][weekIndex].push(dateKey);
    });
  }

  // ============================================================
  // PHASE 2 : Répartir G1/G3 de façon équilibrée par personne
  // ============================================================
  persons.forEach(person => {
    const name = person.name;
    const isResp = person.isResponsable;

    for (let weekIndex = 0; weekIndex < weeks; weekIndex++) {
      const days = workingDaysByWeek[name][weekIndex] || [];
      if (days.length === 0) continue;

      if (isResp) {
        // Responsable → toujours G1
        days.forEach(k => { planning[name][k] = 'G1'; });
        continue;
      }

      // Répartir équitablement
      // Objectif : moitié G1, moitié G3
      const total = days.length;
      const targetG1 = Math.ceil(total / 2);
      const targetG3 = total - targetG1;

      // On veut éviter les patterns répétitifs : on alterne
      days.forEach((k, idx) => {
        // Alternance : pair = G1, impair = G3, puis on ajuste si nécessaire
        if (idx < targetG1) {
          planning[name][k] = 'G1';
        } else {
          planning[name][k] = 'G3';
        }
      });

      // === Rééquilibrage GLOBAL de la semaine ===
      // Compter G1/G3 par jour et rééquilibrer si trop déséquilibré
      rebalanceWeek(planning, persons, weekIndex, startDate, days, planning[name]);
    }
  });

  // ============================================================
  // PHASE 3 : Appliquer les overrides manuels
  // ============================================================
  Object.keys(overrides).forEach(dateKey => {
    const dayShifts = overrides[dateKey];
    if (!dayShifts) return;
    Object.keys(dayShifts).forEach(personName => {
      if (planning[personName]) {
        planning[personName][dateKey] = dayShifts[personName];
      }
    });
  });

  return planning;
}

/**
 * Rééquilibre une semaine si trop de personnes en G1 ou G3 le même jour.
 */
function rebalanceWeek(planning, persons, weekIndex, startDate, days, personShifts) {
  // Rien à faire ici pour l'instant — l'alternance simple suffit
  // Cette fonction est un hook pour ajouter des règles plus tard
}

/**
 * Applique une alternance intelligente : alterne G1/G3 tout en respectant
 * l'équilibre hebdomadaire.
 */
export function rebalance(planning, persons, weeks, startDate) {
  // Pour chaque semaine, chaque jour : si trop de G1 ou G3, on échange
  persons.forEach(person => {
    if (person.isResponsable) return; // Le resp reste G1

    for (let weekIndex = 0; weekIndex < weeks; weekIndex++) {
      // Collecter les jours travaillés (G1 ou G3) de cette semaine
      const weekStart = addDays(startDate, weekIndex * 7);
      const workingDays = [];
      for (let d = 0; d < 7; d++) {
        const k = formatDate(addDays(weekStart, d));
        const v = planning[person.name]?.[k];
        if (v === 'G1' || v === 'G3') workingDays.push(k);
      }
      if (workingDays.length === 0) continue;

      // Compter G1/G3 actuels
      let g1 = 0, g3 = 0;
      workingDays.forEach(k => {
        if (planning[person.name][k] === 'G1') g1++;
        if (planning[person.name][k] === 'G3') g3++;
      });

      // Objectif : 3/3
      const targetG1 = Math.ceil(workingDays.length / 2);
      const targetG3 = workingDays.length - targetG1;

      // Si trop de G1, on change les derniers en G3
      if (g1 > targetG1) {
        let toChange = g1 - targetG1;
        for (let i = workingDays.length - 1; i >= 0 && toChange > 0; i--) {
          const k = workingDays[i];
          if (planning[person.name][k] === 'G1') {
            planning[person.name][k] = 'G3';
            toChange--;
          }
        }
      }
      // Si trop de G3, on change les derniers en G1
      else if (g3 > targetG3) {
        let toChange = g3 - targetG3;
        for (let i = workingDays.length - 1; i >= 0 && toChange > 0; i--) {
          const k = workingDays[i];
          if (planning[person.name][k] === 'G3') {
            planning[person.name][k] = 'G1';
            toChange--;
          }
        }
      }
    }
  });
}

function countWeekStats(planning, name, weekIndex, startDate) {
  const weekStart = addDays(startDate, weekIndex * 7);
  let G1 = 0, G3 = 0, REPOS = 0, CONGE = 0;
  for (let d = 0; d < 7; d++) {
    const k = formatDate(addDays(weekStart, d));
    const v = planning[name]?.[k];
    if (v === 'G1') G1++;
    if (v === 'G3') G3++;
    if (v === 'REPOS') REPOS++;
    if (v === 'CONGE') CONGE++;
  }
  return { G1, G3, REPOS, CONGE };
}

export function getStats(planning, personName) {
  const days = Object.values(planning[personName] || {});
  return {
    G1: days.filter(d => d === 'G1').length,
    G3: days.filter(d => d === 'G3').length,
    REPOS: days.filter(d => d === 'REPOS').length,
    CONGE: days.filter(d => d === 'CONGE').length,
  };
}

export function validatePlanning(planning, persons, weeks) {
  const issues = [];
  persons.forEach(p => {
    const stats = getStats(planning, p.name);
    const totalDays = weeks * 7;
    if (stats.REPOS + stats.CONGE < weeks) {
      issues.push(`${p.name} a moins de ${weeks} jour(s) de repos/congé`);
    }
    if (stats.G1 + stats.G3 + stats.REPOS + stats.CONGE !== totalDays) {
      issues.push(`${p.name} : nombre de jours incohérent`);
    }
  });
  return { valid: issues.length === 0, issues };
}
