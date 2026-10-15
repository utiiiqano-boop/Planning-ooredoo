import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform, Alert } from 'react-native';
import { downloadPlanningAsPDF } from './pdfDownloader';

/**
 * Exporte le planning en PDF
 * - Sur WEB : téléchargement direct (jsPDF + html2canvas)
 * - Sur MOBILE : génération + partage
 */
export async function exportPlanningToPDF({
  planning, persons, weeksData, conges, settings, teamName,
}) {
  try {
    if (Platform.OS === 'web') {
      // Téléchargement direct, pas de print
      const result = await downloadPlanningAsPDF({
        planning, persons, weeksData, conges, settings, teamName,
      });

      if (!result.success) {
        Alert.alert('Erreur PDF', result.error || 'Impossible de générer le PDF');
      }
      return result;
    } else {
      // Mobile : vraie génération PDF via expo-print
      const html = buildMobileHTML({
        planning, persons, weeksData, conges, settings, teamName,
      });
      const { uri } = await Print.printToFileAsync({ html, base64: false });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Enregistrer ou partager le planning',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('Fichier PDF', `Enregistré à : ${uri}`);
      }
      return { success: true, path: uri };
    }
  } catch (e) {
    console.error('[PDF] Erreur :', e);
    return { success: false, error: e.message };
  }
}

/**
 * HTML utilisé pour mobile (expo-print)
 */
function buildMobileHTML({ planning, persons, weeksData, conges, settings, teamName }) {
  const getColor = (val) => {
    switch (val) {
      case 'G1': return '#3B82F6';
      case 'G3': return '#8B5CF6';
      case 'REPOS': return '#FBBF24';
      case 'CONGE': return '#EF4444';
      default: return '#F3F4F6';
    }
  };
  const getTextColor = (val) => {
    if (val === 'REPOS') return '#78350F';
    if (val === 'G1' || val === 'G3' || val === 'CONGE') return '#ffffff';
    return '#9CA3AF';
  };
  const getLabel = (val) => {
    if (val === 'REPOS') return 'R';
    if (val === 'CONGE') return 'C';
    return val || '–';
  };
  const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const s1 = settings?.shift1Label || 'Shift 1';
  const s2 = settings?.shift2Label || 'Shift 2';
  const h1 = `${settings?.shift1Start || '09:00'} - ${settings?.shift1End || '15:00'}`;
  const h2 = `${settings?.shift2Start || '15:00'} - ${settings?.shift2End || '09:00'}`;

  const weeksHTML = weeksData.map(w => {
    const headerCells = w.days.map((d, i) => {
      const isWeekend = [5, 6].includes((d.getDay() + 6) % 7);
      return `<th style="padding:6px 4px;font-size:11px;color:${isWeekend ? '#E30613' : '#718096'};font-weight:700;text-align:center;border-bottom:2px solid #E8ECF1;">
        ${dayNames[i]}<br/><span style="font-size:14px;font-weight:800;color:${isWeekend ? '#E30613' : '#1A202C'};">${d.getDate()}</span>
      </th>`;
    }).join('');

    const rowsHTML = persons.map(p => {
      const stats = getPersonStats(planning, p.name);
      const cells = w.days.map(d => {
        const k = formatDateKey(d);
        const val = planning[p.name]?.[k] || '';
        return `<td style="padding:3px;">
          <div style="width:42px;height:42px;margin:0 auto;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;background:${getColor(val)};color:${getTextColor(val)};">
            ${getLabel(val)}
          </div>
        </td>`;
      }).join('');
      return `<tr>
        <td style="width:130px;padding-right:8px;">
          <div style="font-size:13px;font-weight:700;">${p.isResponsable ? '⭐ ' : ''}${p.name}</div>
          <div style="font-size:9px;color:#A0AEC0;">G1:${stats.G1} G3:${stats.G3} R:${stats.REPOS} C:${stats.CONGE}</div>
        </td>
        ${cells}
      </tr>`;
    }).join('');

    return `
      <div style="margin-bottom:30px;">
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px;padding-bottom:6px;border-bottom:2px solid #E8ECF1;">
          <div style="font-size:18px;font-weight:800;">Semaine ${getWeekNumberFromDate(w.days[0])}</div>
          <div style="font-size:12px;color:#718096;">${formatDateShort(w.days[0])} → ${formatDateShort(w.days[6])}</div>
        </div>
        <table style="width:100%;border-collapse:collapse;">
          <thead><tr><th style="text-align:left;font-size:12px;padding:6px 4px;">Personne</th>${headerCells}</tr></thead>
          <tbody>${rowsHTML}</tbody>
        </table>
      </div>`;
  }).join('');

  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"/><style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1A202C; padding: 30px; background: #fff; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #E30613; padding-bottom: 16px; margin-bottom: 20px; }
    .logo { width: 48px; height: 48px; background: #E30613; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold; }
    .team-name { font-size: 24px; font-weight: 800; }
    .subtitle { font-size: 12px; color: #718096; }
    .legend { display: flex; gap: 16px; justify-content: center; margin-bottom: 24px; padding: 10px; background: #F7FAFC; border-radius: 10px; }
    .legend-item { display: flex; align-items: center; gap: 6px; font-size: 11px; }
    .legend-dot { width: 14px; height: 14px; border-radius: 4px; }
    table { width: 100%; border-collapse: collapse; }
  </style></head><body>
    <div class="header">
      <div style="display:flex;align-items:center;gap:14px;">
        <div class="logo">O</div>
        <div>
          <div class="team-name">${teamName || 'Planning'}</div>
          <div class="subtitle">Planning du travail</div>
        </div>
      </div>
      <div style="text-align:right;font-size:12px;color:#718096;">
        <div style="font-size:14px;font-weight:700;">${new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
        <div>${persons.length} pers. · ${weeksData.length} sem.</div>
      </div>
    </div>
    <div class="legend">
      <div class="legend-item"><div class="legend-dot" style="background:#3B82F6"></div>${s1} (${h1})</div>
      <div class="legend-item"><div class="legend-dot" style="background:#8B5CF6"></div>${s2} (${h2})</div>
      <div class="legend-item"><div class="legend-dot" style="background:#FBBF24"></div>Repos</div>
      <div class="legend-item"><div class="legend-dot" style="background:#EF4444"></div>Congé</div>
    </div>
    ${weeksHTML}
    <div style="margin-top:30px;padding-top:14px;border-top:1px solid #E8ECF1;font-size:10px;color:#A0AEC0;text-align:center;">
      Généré par Planning Ooredoo · ${new Date().toLocaleString('fr-FR')}
    </div>
  </body></html>`;
}

// Helpers
function formatDateShort(date) {
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
}
function formatDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function getWeekNumberFromDate(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}
function getPersonStats(planning, name) {
  const days = Object.values(planning[name] || {});
  return {
    G1: days.filter(d => d === 'G1').length,
    G3: days.filter(d => d === 'G3').length,
    REPOS: days.filter(d => d === 'REPOS').length,
    CONGE: days.filter(d => d === 'CONGE').length,
  };
}
