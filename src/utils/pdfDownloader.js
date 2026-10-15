/**
 * Génère un PDF téléchargeable directement (sans passer par l'impression)
 * Utilise html2canvas + jsPDF
 * ⚠️ Uniquement pour le web
 */
export async function downloadPlanningAsPDF({
  planning, persons, weeksData, conges, settings, teamName,
  filename,
}) {
  // Import dynamique (chargé uniquement sur web)
  const html2canvasModule = await import('html2canvas');
  const { jsPDF } = await import('jspdf');

  const html2canvas = html2canvasModule.default;

  // 1. Créer un container caché avec le planning stylé
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-10000px';
  container.style.top = '0';
  container.style.width = '210mm';
  container.style.background = '#ffffff';
  container.style.padding = '20mm';
  container.style.fontFamily = "'Helvetica Neue', Arial, sans-serif";
  container.style.color = '#1A202C';
  container.style.boxSizing = 'border-box';

  // 2. Injecter le HTML du planning
  container.innerHTML = buildPrintableHTML({
    planning, persons, weeksData, conges, settings, teamName,
  });

  document.body.appendChild(container);

  try {
    // 3. Attendre le rendu
    await new Promise(r => setTimeout(r, 300));

    // 4. Capturer en canvas haute résolution
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    // 5. Créer le PDF au format A4
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 0;

    const imgWidth = pageWidth - margin * 2;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const imgData = canvas.toDataURL('image/jpeg', 0.92);

    // 6. Pagination : si le contenu dépasse une page A4, on découpe
    let heightLeft = imgHeight;
    let position = margin;

    pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight);
    heightLeft -= (pageHeight - margin * 2);

    while (heightLeft > 0) {
      position = -(imgHeight - heightLeft) + margin;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight);
      heightLeft -= (pageHeight - margin * 2);
    }

    // 7. Télécharger le fichier
    const defaultName = filename ||
      `Planning_${(teamName || 'Ooredoo').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(defaultName);

    return { success: true, filename: defaultName };
  } catch (e) {
    console.error('[PDF DOWNLOAD] Erreur :', e);
    return { success: false, error: e.message };
  } finally {
    document.body.removeChild(container);
  }
}

/**
 * Construit le HTML "printable" du planning (sans toolbar, sans CSS externe)
 */
function buildPrintableHTML({ planning, persons, weeksData, conges, settings, teamName }) {
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

  const s1 = settings?.shift1Label || 'Shift 1';
  const s2 = settings?.shift2Label || 'Shift 2';
  const h1 = `${settings?.shift1Start || '09:00'} - ${settings?.shift1End || '15:00'}`;
  const h2 = `${settings?.shift2Start || '15:00'} - ${settings?.shift2End || '09:00'}`;

  // Header
  const headerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #E30613;padding-bottom:16px;margin-bottom:20px;">
      <div style="display:flex;align-items:center;gap:14px;">
        <div style="width:48px;height:48px;background:#E30613;border-radius:12px;display:flex;align-items:center;justify-content:center;color:white;font-size:24px;font-weight:bold;">O</div>
        <div>
          <div style="font-size:24px;font-weight:800;color:#1A202C;">${teamName || 'Planning'}</div>
          <div style="font-size:12px;color:#718096;margin-top:2px;">Planning du travail</div>
        </div>
      </div>
      <div style="text-align:right;font-size:12px;color:#718096;">
        <div style="font-size:14px;font-weight:700;color:#1A202C;">${new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
        <div>${persons.length} personne${persons.length>1?'s':''} · ${weeksData.length} semaine${weeksData.length>1?'s':''}</div>
      </div>
    </div>
  `;

  // Legend
  const legendHTML = `
    <div style="display:flex;gap:16px;justify-content:center;margin-bottom:24px;padding:10px;background:#F7FAFC;border-radius:10px;flex-wrap:wrap;">
      <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:#4A5568;">
        <div style="width:14px;height:14px;border-radius:4px;background:#3B82F6;"></div>${s1} (${h1})
      </div>
      <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:#4A5568;">
        <div style="width:14px;height:14px;border-radius:4px;background:#8B5CF6;"></div>${s2} (${h2})
      </div>
      <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:#4A5568;">
        <div style="width:14px;height:14px;border-radius:4px;background:#FBBF24;"></div>Repos
      </div>
      <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:#4A5568;">
        <div style="width:14px;height:14px;border-radius:4px;background:#EF4444;"></div>Congé
      </div>
    </div>
  `;

  // Weeks
  const weeksHTML = weeksData.map(w => {
    const weekNum = getWeekNumberFromDate(w.days[0]);
    const d1 = formatDateShort(w.days[0]);
    const d2 = formatDateShort(w.days[6]);

    const headerCells = w.days.map((d, i) => {
      const isWeekend = [5, 6].includes((d.getDay() + 6) % 7);
      const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
      return `<th style="padding:6px 4px;font-size:11px;color:${isWeekend ? '#E30613' : '#718096'};font-weight:700;text-align:center;border-bottom:2px solid #E8ECF1;">
        ${dayNames[i]}<br/>
        <span style="font-size:14px;font-weight:800;color:${isWeekend ? '#E30613' : '#1A202C'};">${d.getDate()}</span>
      </th>`;
    }).join('');

    const rowsHTML = persons.map(p => {
      const stats = getPersonStats(planning, p.name);
      const cells = w.days.map(d => {
        const k = formatDateKey(d);
        const val = planning[p.name]?.[k] || '';
        return `<td style="padding:3px;vertical-align:middle;">
          <div style="width:42px;height:42px;margin:0 auto;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;background:${getColor(val)};color:${getTextColor(val)};">
            ${getLabel(val)}
          </div>
        </td>`;
      }).join('');
      return `<tr>
        <td style="width:130px;padding-right:8px;">
          <div style="font-size:13px;font-weight:700;">${p.isResponsable ? '⭐ ' : ''}${p.name}</div>
          <div style="font-size:9px;color:#A0AEC0;margin-top:1px;">G1:${stats.G1} G3:${stats.G3} R:${stats.REPOS} C:${stats.CONGE}</div>
        </td>
        ${cells}
      </tr>`;
    }).join('');

    return `
      <div style="margin-bottom:30px;">
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px;padding-bottom:6px;border-bottom:2px solid #E8ECF1;">
          <div style="font-size:18px;font-weight:800;">Semaine ${weekNum}</div>
          <div style="font-size:12px;color:#718096;">${d1} → ${d2}</div>
        </div>
        <table style="width:100%;border-collapse:collapse;">
          <thead><tr>
            <th style="text-align:left;font-size:12px;color:#1A202C;padding:6px 4px;">Personne</th>
            ${headerCells}
          </tr></thead>
          <tbody>${rowsHTML}</tbody>
        </table>
      </div>`;
  }).join('');

  // Congés
  const congesHTML = conges.length > 0 ? `
    <div style="margin-top:24px;">
      <div style="font-size:15px;font-weight:800;margin-bottom:10px;">🏖️ Congés programmés</div>
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <th style="background:#F7FAFC;padding:8px 10px;font-size:11px;text-align:left;color:#4A5568;border-bottom:1px solid #E8ECF1;">Personne</th>
          <th style="background:#F7FAFC;padding:8px 10px;font-size:11px;text-align:left;color:#4A5568;border-bottom:1px solid #E8ECF1;">Début</th>
          <th style="background:#F7FAFC;padding:8px 10px;font-size:11px;text-align:left;color:#4A5568;border-bottom:1px solid #E8ECF1;">Fin</th>
          <th style="background:#F7FAFC;padding:8px 10px;font-size:11px;text-align:left;color:#4A5568;border-bottom:1px solid #E8ECF1;">Durée</th>
        </tr>
        ${conges.map(c => {
          const days = Math.round((new Date(c.endDate) - new Date(c.startDate)) / (1000*60*60*24)) + 1;
          return `<tr>
            <td style="padding:8px 10px;font-size:12px;border-bottom:1px solid #F1F5F9;">${c.personName}</td>
            <td style="padding:8px 10px;font-size:12px;border-bottom:1px solid #F1F5F9;">${c.startDate}</td>
            <td style="padding:8px 10px;font-size:12px;border-bottom:1px solid #F1F5F9;">${c.endDate}</td>
            <td style="padding:8px 10px;font-size:12px;border-bottom:1px solid #F1F5F9;">${days} jour${days>1?'s':''}</td>
          </tr>`;
        }).join('')}
      </table>
    </div>` : '';

  // Stats
  const statsHTML = `
    <div style="margin-top:24px;">
      <div style="font-size:15px;font-weight:800;margin-bottom:10px;">📊 Statistiques globales</div>
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <th style="background:#F7FAFC;padding:8px 10px;font-size:11px;text-align:left;color:#4A5568;border-bottom:1px solid #E8ECF1;">Personne</th>
          <th style="background:#F7FAFC;padding:8px 10px;font-size:11px;text-align:left;color:#4A5568;border-bottom:1px solid #E8ECF1;">Rôle</th>
          <th style="background:#F7FAFC;padding:8px 10px;font-size:11px;text-align:left;color:#4A5568;border-bottom:1px solid #E8ECF1;">G1</th>
          <th style="background:#F7FAFC;padding:8px 10px;font-size:11px;text-align:left;color:#4A5568;border-bottom:1px solid #E8ECF1;">G3</th>
          <th style="background:#F7FAFC;padding:8px 10px;font-size:11px;text-align:left;color:#4A5568;border-bottom:1px solid #E8ECF1;">Repos</th>
          <th style="background:#F7FAFC;padding:8px 10px;font-size:11px;text-align:left;color:#4A5568;border-bottom:1px solid #E8ECF1;">Congés</th>
          <th style="background:#F7FAFC;padding:8px 10px;font-size:11px;text-align:left;color:#4A5568;border-bottom:1px solid #E8ECF1;">Total</th>
        </tr>
        ${persons.map(p => {
          const s = getPersonStats(planning, p.name);
          return `<tr>
            <td style="padding:8px 10px;font-size:12px;border-bottom:1px solid #F1F5F9;">${p.isResponsable?'⭐ ':''}${p.name}</td>
            <td style="padding:8px 10px;font-size:12px;border-bottom:1px solid #F1F5F9;">${p.isResponsable?'Responsable':'Employé'}</td>
            <td style="padding:8px 10px;font-size:12px;border-bottom:1px solid #F1F5F9;">${s.G1}</td>
            <td style="padding:8px 10px;font-size:12px;border-bottom:1px solid #F1F5F9;">${s.G3}</td>
            <td style="padding:8px 10px;font-size:12px;border-bottom:1px solid #F1F5F9;">${s.REPOS}</td>
            <td style="padding:8px 10px;font-size:12px;border-bottom:1px solid #F1F5F9;">${s.CONGE}</td>
            <td style="padding:8px 10px;font-size:12px;border-bottom:1px solid #F1F5F9;"><b>${s.G1 + s.G3}</b></td>
          </tr>`;
        }).join('')}
      </table>
    </div>`;

  return `
    ${headerHTML}
    ${legendHTML}
    ${weeksHTML}
    ${congesHTML}
    ${statsHTML}
    <div style="margin-top:30px;padding-top:14px;border-top:1px solid #E8ECF1;font-size:10px;color:#A0AEC0;text-align:center;">
      Généré par Planning Ooredoo · ${new Date().toLocaleString('fr-FR')}
    </div>
  `;
}

// ===== Helpers =====
function formatDateShort(date) {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${d}/${m}`;
}

function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getWeekNumberFromDate(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(
    ((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7
  );
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
