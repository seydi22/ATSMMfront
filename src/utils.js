export function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("fr-FR");
}

export function formatPeriode(debut, fin) {
  const d1 = formatDate(debut);
  const d2 = formatDate(fin || debut);
  if (d1 === d2) return d1;
  return `${d1} → ${d2}`;
}

export function formatMontant(n) {
  return Number(n || 0).toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export const STATUT_LABELS = {
  brouillon: "Brouillon",
  demande_ov_envoyee: "Demande OV envoyée",
  ov_recue: "OV reçue",
  envoye_banque: "Envoyé à la banque",
};

export function statutClass(statut) {
  return `badge badge-${statut || "brouillon"}`;
}
