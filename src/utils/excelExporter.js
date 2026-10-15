import { Platform, Alert } from 'react-native';
import { DAYS_FR_SHORT } from '../constants/theme';
import { formatDate, getWeekNumber } from './dateHelpers';
import { getStats } from './planningGenerator';

/**
 * Exporte le planning en fichier Excel (.xlsx)
 * - Charge xlsx dynamiquement (uniquement sur web)
 * - Sur mobile : utilise une méthode alternative ou affiche un message
 */
export async function exportPlanningToExcel({
  planning,
  persons,
  weeksData,
  conges = [],
  filename,
}) {
  try {
    // 1. Vérifier la plateforme
    if (Platform.OS !== 'web') {
      Alert.alert(
        'Export Excel',
        'L\'export Excel est disponible uniquement sur le web. Utilisez l\'export PDF sur mobile.',
        [{ text: 'OK' }]
      );
      return { success: false, error: 'not_supported_on_mobile' };
    }

    // 2. Charger xlsx dynamiquement (seulement au clic)
    const XLSX = await import('xlsx');

    // 3. Créer le classeur
    const wb = XLSX.utils.book_new();

    weeksData.forEach(week => {
      const rows = [];

      rows.push(['OOREDOO - PLANNING', '', '', '', '', '', '', '']);
      rows.push([
        `Semaine ${getWeekNumber(week.days[0])}`,
        '', '',
        `Du ${formatDateFR(week.days[0])}`,
        `Au ${formatDateFR(week.days[6])}`,
      ]);
      rows.push([]);

      const headerRow = ['Personne', 'Rôle'];
      week.days.forEach(d => {
        headerRow.push(
          `${DAYS_FR_SHORT[(d.getDay() + 6) % 7]}\n${d.getDate()}`
        );
      });
      headerRow.push('G1', 'G3', 'Repos', 'Congé');
      rows.push(headerRow);

      persons.forEach(p => {
        const row = [p.name, p.isResponsable ? 'Responsable' : 'Employé'];
        const stats = getStats(planning, p.name);

        week.days.forEach(d => {
          const k = formatDate(d);
          row.push(planning[p.name]?.[k] || '');
        });

        row.push(stats.G1, stats.G3, stats.REPOS, stats.CONGE);
        rows.push(row);
      });

      rows.push([]);
      rows.push(['Légende :', 'G1 = 09h-15h', 'G3 = 15h-09h', 'R = Repos', 'C = Congé']);

      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws['!cols'] = [
        { wch: 18 }, { wch: 14 },
        ...week.days.map(() => ({ wch: 8 })),
        { wch: 5 }, { wch: 5 }, { wch: 7 }, { wch: 7 },
      ];

      const sheetName = `Semaine ${getWeekNumber(week.days[0])}`;
      XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31));
    });

    // Congés
    if (conges.length > 0) {
      const congesRows = [['Personne', 'Début', 'Fin', 'Durée (jours)']];
      conges.forEach(c => {
        const d1 = new Date(c.startDate);
        const d2 = new Date(c.endDate);
        const days = Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
        congesRows.push([c.personName, c.startDate, c.endDate, days]);
      });

      const wsConges = XLSX.utils.aoa_to_sheet(congesRows);
      wsConges['!cols'] = [{ wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 12 }];
      XLSX.utils.book_append_sheet(wb, wsConges, 'Congés');
    }

    // Stats
    const statsRows = [
      ['Personne', 'Rôle', 'G1', 'G3', 'Repos', 'Congés', 'Total travaillé'],
    ];
    persons.forEach(p => {
      const s = getStats(planning, p.name);
      statsRows.push([
        p.name,
        p.isResponsable ? 'Responsable' : 'Employé',
        s.G1, s.G3, s.REPOS, s.CONGE, s.G1 + s.G3,
      ]);
    });
    const wsStats = XLSX.utils.aoa_to_sheet(statsRows);
    wsStats['!cols'] = [
      { wch: 18 }, { wch: 14 }, { wch: 12 }, { wch: 12 },
      { wch: 8 }, { wch: 8 }, { wch: 16 },
    ];
    XLSX.utils.book_append_sheet(wb, wsStats, 'Statistiques');

    // 4. Générer le fichier
    const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

    const defaultFilename =
      filename ||
      `Planning_Ooredoo_${new Date().toISOString().split('T')[0]}.xlsx`;

    // 5. Télécharger (web only)
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
  } catch (e) {
    console.error('[EXPORT EXCEL] Erreur :', e);
    return { success: false, error: e.message };
  }
}

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
