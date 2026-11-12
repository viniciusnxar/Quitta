/** Envia e-mail pela API do Resend (sem SDK: é um POST). */
export async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to, subject, html }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}

export function linkEmail(text: string, url: string, label: string) {
  return `<p>${text}</p><p><a href="${url}">${label}</a></p><p>Se não foi você, ignore este e-mail.</p>`;
}
