import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform, Alert } from 'react-native';
import { DAYS_FR_SHORT, MONTHS_FR } from '../constants/theme';
import { formatDate, getWeekNumber } from './dateHelpers';

/**
 * Exporte le planning en fichier Excel (.xlsx)
 */
export async function exportPlanningToExcel({
  planning,
  persons,
  weeksData,
  conges = [],
  filename,
}) {
  try {
    const wb = XLSX.utils.book_new();

    // ===== Feuille 1 : Planning par semaine =====
    weeksData.forEach(week => {
      const rows = [];

      // En-tête titre
      rows.push([
        'OOREDOO - PLANNING',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
      ]);
      rows.push([
        `Semaine ${getWeekNumber(week.days[0])}`,
        '',
        '',
        `Du ${formatDateFR(week.days[0])}`,
        `Au ${formatDateFR(week.days[6])}`,
      ]);
      rows.push([]); // ligne vide

      // En-tête jours
      const headerRow = ['Personne', 'Rôle'];
      week.days.forEach(d => {
        headerRow.push(
          `${DAYS_FR_SHORT[(d.getDay() + 6) % 7]}\n${d.getDate()}`
        );
      });
      headerRow.push('G1', 'G3', 'Repos', 'Congé');
      rows.push(headerRow);

      // Lignes personnes
      persons.forEach(p => {
        const row = [p.name, p.isResponsable ? 'Responsable' : 'Employé'];
        let g1 = 0, g3 = 0, repos = 0, conge = 0;

        week.days.forEach(d => {
          const k = formatDate(d);
          const val = planning[p.name]?.[k] || '';
          row.push(val);
          if (val === 'G1') g1++;
          if (val === 'G3') g3++;
          if (val === 'REPOS') repos++;
          if (val === 'CONGE') conge++;
        });

        row.push(g1, g3, repos, conge);
        rows.push(row);
      });

      rows.push([]);
      rows.push(['Légende :', 'G1 = 09h-15h', 'G3 = 15h-09h', 'R = Repos', 'C = Congé']);

      // Créer la feuille
      const ws = XLSX.utils.aoa_to_sheet(rows);

      // Largeurs de colonnes
      ws['!cols'] = [
        { wch: 18 }, { wch: 14 }, // Personne, Rôle
        ...week.days.map(() => ({ wch: 8 })),
        { wch: 5 }, { wch: 5 }, { wch: 7 }, { wch: 7 },
      ];

      // Nom de la feuille
      const sheetName = `Semaine ${getWeekNumber(week.days[0])}`;
      XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31));
    });

    // ===== Feuille 2 : Congés =====
    if (conges.length > 0) {
      const congesRows = [['Personne', 'Début', 'Fin', 'Durée (jours)']];
      conges.forEach(c => {
        const d1 = new Date(c.startDate);
        const d2 = new Date(c.endDate);
        const days = Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
        congesRows.push([c.personName, c.startDate, c.endDate, days]);
      });

      const wsConges = XLSX.utils.aoa_to_sheet(congesRows);
      wsConges['!cols'] = [
        { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 12 },
      ];
      XLSX.utils.book_append_sheet(wb, wsConges, 'Congés');
    }

    // ===== Feuille 3 : Statistiques =====
    const statsRows = [
      ['Personne', 'Rôle', 'G1 (jours)', 'G3 (jours)', 'Repos', 'Congés', 'Total travaillé'],
    ];
    persons.forEach(p => {
      let g1 = 0, g3 = 0, repos = 0, conge = 0;
      Object.values(planning[p.name] || {}).forEach(v => {
        if (v === 'G1') g1++;
        if (v === 'G3') g3++;
        if (v === 'REPOS') repos++;
        if (v === 'CONGE') conge++;
      });
      statsRows.push([
        p.name,
        p.isResponsable ? 'Responsable' : 'Employé',
        g1, g3, repos, conge, g1 + g3,
      ]);
    });
    const wsStats = XLSX.utils.aoa_to_sheet(statsRows);
    wsStats['!cols'] = [
      { wch: 18 }, { wch: 14 }, { wch: 12 }, { wch: 12 },
      { wch: 8 }, { wch: 8 }, { wch: 16 },
    ];
    XLSX.utils.book_append_sheet(wb, wsStats, 'Statistiques');

    // ===== Générer le fichier =====
    const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

    const defaultFilename = filename ||
      `Planning_Ooredoo_${new Date().toISOString().split('T')[0]}.xlsx`;

    if (Platform.OS === 'web') {
      // Web : téléchargement direct
      const blob = base64ToBlob(wbout);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = defaultFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return { success: true, path: defaultFilename };
    } else {
      // Mobile : écrire + partager
      const fileUri = FileSystem.documentDirectory + defaultFilename;
      await FileSystem.writeAsStringAsync(fileUri, wbout, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: 'Partager le planning',
        });
      } else {
        Alert.alert('Fichier enregistré', fileUri);
      }
      return { success: true, path: fileUri };
    }
  } catch (e) {
    console.error('[EXPORT] Erreur :', e);
    return { success: false, error: e.message };
  }
}

// Helpers
function formatDateFR(date) {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${d}/${m}/${date.getFullYear()}`;
}

function base64ToBlob(base64) {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}
