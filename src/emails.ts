// Templates d'emails transactionnels.
// Chaque fonction retourne { subject, html, text } prêt à passer à sendMail().
// Convention CSS : inline uniquement (les clients email ignorent les <style> externes).

function wrap(content: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:ui-sans-serif,system-ui,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:480px;background:#ffffff;border-radius:8px;padding:40px 32px;">
        <tr><td>
          ${content}
          <p style="margin:24px 0 0;font-size:12px;color:#aaa;border-top:1px solid #eee;padding-top:16px;">
            Cet email a été envoyé par Replang. Si vous n'êtes pas à l'origine de cette demande, ignorez-le.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function ctaButton(url: string, label: string): string {
  return `<a href="${url}" style="display:inline-block;background:#1d4ed8;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:600;font-size:15px;">${label}</a>
  <p style="margin:16px 0 0;font-size:12px;color:#888;line-height:1.6;">
    Si le bouton ne fonctionne pas, copiez ce lien :<br>
    <a href="${url}" style="color:#1d4ed8;word-break:break-all;">${url}</a>
  </p>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Vérification d'email
// ─────────────────────────────────────────────────────────────────────────────

export function verificationEmail(data: { name: string | null; url: string }) {
  const greeting = data.name ? `Bonjour ${data.name},` : "Bonjour,";

  return {
    subject: "Confirmez votre adresse email - Replang",
    html: wrap(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111;">Confirmez votre email</h1>
      <p style="margin:0 0 24px;color:#444;font-size:15px;line-height:1.6;">
        ${greeting}<br>
        Cliquez sur le bouton ci-dessous pour activer votre compte Replang.
        Ce lien est valable <strong>24&nbsp;heures</strong>.
      </p>
      ${ctaButton(data.url, "Confirmer mon email")}
    `),
    text: [
      greeting,
      "",
      "Confirmez votre adresse email sur Replang en cliquant sur ce lien :",
      data.url,
      "",
      "Ce lien est valable 24 heures.",
    ].join("\n"),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Réinitialisation de mot de passe
// ─────────────────────────────────────────────────────────────────────────────

export function resetPasswordEmail(data: { name: string | null; url: string }) {
  const greeting = data.name ? `Bonjour ${data.name},` : "Bonjour,";

  return {
    subject: "Réinitialisation de votre mot de passe - Replang",
    html: wrap(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111;">Réinitialiser votre mot de passe</h1>
      <p style="margin:0 0 24px;color:#444;font-size:15px;line-height:1.6;">
        ${greeting}<br>
        Vous avez demandé à réinitialiser votre mot de passe Replang.
        Ce lien est valable <strong>1&nbsp;heure</strong>.
      </p>
      ${ctaButton(data.url, "Choisir un nouveau mot de passe")}
    `),
    text: [
      greeting,
      "",
      "Vous avez demandé à réinitialiser votre mot de passe Replang.",
      "Cliquez sur ce lien pour en choisir un nouveau :",
      data.url,
      "",
      "Ce lien est valable 1 heure.",
    ].join("\n"),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Confirmation de changement d'email (étape 1.6)
// Envoyé à l'adresse ACTUELLE pour confirmer le changement.
// Sécurité : un attaquant avec une session volée ne peut pas changer l'email
// sans accès à l'ancienne boîte mail.
// ─────────────────────────────────────────────────────────────────────────────

export function changeEmailEmail(data: { name: string | null; newEmail: string; url: string }) {
  const greeting = data.name ? `Bonjour ${data.name},` : "Bonjour,";

  return {
    subject: "Confirmez le changement de votre email - Replang",
    html: wrap(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111;">Changer votre adresse email</h1>
      <p style="margin:0 0 24px;color:#444;font-size:15px;line-height:1.6;">
        ${greeting}<br>
        Vous avez demandé à changer votre email Replang vers
        <strong>${data.newEmail}</strong>.<br>
        Cliquez sur le bouton ci-dessous pour confirmer ce changement.
      </p>
      ${ctaButton(data.url, "Confirmer le changement")}
      <p style="margin:16px 0 0;font-size:13px;color:#888;">
        Si vous n'avez pas fait cette demande, ignorez cet email — votre adresse actuelle reste inchangée.
      </p>
    `),
    text: [
      greeting,
      "",
      `Vous avez demandé à changer votre email Replang vers : ${data.newEmail}`,
      "Confirmez ce changement en cliquant sur ce lien :",
      data.url,
      "",
      "Si vous n'avez pas fait cette demande, ignorez cet email.",
    ].join("\n"),
  };
}
