/**
 * Service d'envoi d'emails avec Resend
 *
 * Resend est utilisé pour envoyer des notifications par email :
 * - Nouvelles missions assignées aux chauffeurs
 * - Confirmations de missions acceptées
 * - Alertes de missions refusées
 * - Rappels de missions à venir
 * - Notifications de changement de statut
 *
 * Plan gratuit : 3,000 emails/mois
 * Documentation : https://resend.com/docs
 */

import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@festivaldrive.com';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface MissionAssignedData {
  driverEmail: string;
  driverName: string;
  vipName: string;
  pickupAddress: string;
  dropoffAddress: string;
  requestedDatetime: Date;
  missionId: string;
}

interface MissionStatusChangedData {
  recipientEmail: string;
  recipientName: string;
  driverName: string;
  vipName: string;
  newStatus: string;
  pickupAddress: string;
  dropoffAddress: string;
  requestedDatetime: Date;
}

/**
 * Envoie un email de nouvelle mission assignée à un chauffeur
 */
export async function sendMissionAssignedEmail(
  data: MissionAssignedData
): Promise<EmailResult> {
  if (!resend) {
    console.warn('Resend not configured - email not sent');
    return {
      success: false,
      error: 'Service email non configuré',
    };
  }

  try {
    const formattedDate = new Date(data.requestedDatetime).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const missionUrl = `${APP_URL}/dashboard/my-missions`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Nouvelle mission assignée</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f4f4f7;
            }
            .container {
              background-color: #ffffff;
              border-radius: 8px;
              padding: 30px;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .header h1 {
              color: #9333ea;
              margin: 0;
              font-size: 28px;
            }
            .mission-card {
              background-color: #f9fafb;
              border-left: 4px solid #9333ea;
              padding: 20px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .mission-detail {
              margin: 12px 0;
            }
            .mission-detail strong {
              display: inline-block;
              width: 120px;
              color: #6b7280;
            }
            .location {
              font-size: 16px;
              margin: 10px 0;
            }
            .location-icon {
              display: inline-block;
              width: 16px;
              height: 16px;
              margin-right: 8px;
            }
            .button {
              display: inline-block;
              background-color: #9333ea;
              color: #ffffff;
              text-decoration: none;
              padding: 12px 30px;
              border-radius: 6px;
              font-weight: 600;
              margin: 20px 0;
              text-align: center;
            }
            .button:hover {
              background-color: #7c3aed;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              color: #6b7280;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚗 Nouvelle Mission</h1>
            </div>

            <p>Bonjour <strong>${data.driverName}</strong>,</p>

            <p>Une nouvelle mission vous a été assignée pour le transport de <strong>${data.vipName}</strong>.</p>

            <div class="mission-card">
              <div class="mission-detail">
                <strong>Date et heure :</strong>
                <span>${formattedDate}</span>
              </div>

              <div class="mission-detail">
                <strong>Passager :</strong>
                <span>${data.vipName}</span>
              </div>

              <div class="location">
                <div style="margin: 8px 0;">
                  📍 <strong>Départ :</strong><br/>
                  <span style="padding-left: 24px;">${data.pickupAddress}</span>
                </div>
                <div style="margin: 8px 0;">
                  🎯 <strong>Arrivée :</strong><br/>
                  <span style="padding-left: 24px;">${data.dropoffAddress}</span>
                </div>
              </div>
            </div>

            <p style="text-align: center;">
              <a href="${missionUrl}" class="button">Voir mes missions</a>
            </p>

            <p style="color: #6b7280; font-size: 14px;">
              Connectez-vous à votre tableau de bord pour accepter ou refuser cette mission.
            </p>

            <div class="footer">
              <p>
                Cet email a été envoyé par FestivalDrive<br/>
                Si vous avez des questions, contactez votre coordinateur.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const result = await resend.emails.send({
      from: `FestivalDrive <${FROM_EMAIL}>`,
      to: data.driverEmail,
      subject: `Nouvelle mission : Transport de ${data.vipName}`,
      html: htmlContent,
    });

    return {
      success: true,
      messageId: result.data?.id,
    };
  } catch (error) {
    console.error('Error sending mission assigned email:', error);
    return {
      success: false,
      error: 'Erreur lors de l\'envoi de l\'email',
    };
  }
}

/**
 * Envoie un email de notification de changement de statut
 */
export async function sendMissionStatusChangedEmail(
  data: MissionStatusChangedData
): Promise<EmailResult> {
  if (!resend) {
    console.warn('Resend not configured - email not sent');
    return {
      success: false,
      error: 'Service email non configuré',
    };
  }

  try {
    const formattedDate = new Date(data.requestedDatetime).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const statusLabels: Record<string, { label: string; color: string; icon: string }> = {
      ACCEPTED: { label: 'Acceptée', color: '#10b981', icon: '✅' },
      DECLINED: { label: 'Refusée', color: '#ef4444', icon: '❌' },
      IN_PROGRESS: { label: 'En cours', color: '#8b5cf6', icon: '🚗' },
      COMPLETED: { label: 'Terminée', color: '#059669', icon: '✔️' },
    };

    const statusInfo = statusLabels[data.newStatus] || {
      label: data.newStatus,
      color: '#6b7280',
      icon: 'ℹ️',
    };

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Mise à jour de mission</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f4f4f7;
            }
            .container {
              background-color: #ffffff;
              border-radius: 8px;
              padding: 30px;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .status-badge {
              display: inline-block;
              background-color: ${statusInfo.color};
              color: white;
              padding: 8px 16px;
              border-radius: 20px;
              font-weight: 600;
              font-size: 16px;
              margin: 10px 0;
            }
            .mission-info {
              background-color: #f9fafb;
              padding: 20px;
              margin: 20px 0;
              border-radius: 4px;
              border-left: 4px solid ${statusInfo.color};
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              color: #6b7280;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${statusInfo.icon} Mission ${statusInfo.label}</h1>
            </div>

            <p>Bonjour <strong>${data.recipientName}</strong>,</p>

            <p>La mission du <strong>${formattedDate}</strong> a changé de statut :</p>

            <div style="text-align: center;">
              <span class="status-badge">${statusInfo.label}</span>
            </div>

            <div class="mission-info">
              <p><strong>Chauffeur :</strong> ${data.driverName}</p>
              <p><strong>Passager :</strong> ${data.vipName}</p>
              <p><strong>Trajet :</strong></p>
              <p>📍 ${data.pickupAddress}</p>
              <p>🎯 ${data.dropoffAddress}</p>
            </div>

            <div class="footer">
              <p>
                Cet email a été envoyé par FestivalDrive<br/>
                Si vous avez des questions, contactez votre coordinateur.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const result = await resend.emails.send({
      from: `FestivalDrive <${FROM_EMAIL}>`,
      to: data.recipientEmail,
      subject: `Mission ${statusInfo.label} - ${data.vipName}`,
      html: htmlContent,
    });

    return {
      success: true,
      messageId: result.data?.id,
    };
  } catch (error) {
    console.error('Error sending status changed email:', error);
    return {
      success: false,
      error: 'Erreur lors de l\'envoi de l\'email',
    };
  }
}

/**
 * Envoie un email de rappel de mission à venir (24h avant)
 */
export async function sendMissionReminderEmail(
  driverEmail: string,
  driverName: string,
  vipName: string,
  pickupAddress: string,
  dropoffAddress: string,
  requestedDatetime: Date
): Promise<EmailResult> {
  if (!resend) {
    console.warn('Resend not configured - email not sent');
    return {
      success: false,
      error: 'Service email non configuré',
    };
  }

  try {
    const formattedDate = new Date(requestedDatetime).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Rappel de mission</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f4f4f7;
            }
            .container {
              background-color: #ffffff;
              border-radius: 8px;
              padding: 30px;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            .alert-box {
              background-color: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 20px;
              margin: 20px 0;
              border-radius: 4px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 style="color: #f59e0b;">⏰ Rappel de Mission</h1>

            <p>Bonjour <strong>${driverName}</strong>,</p>

            <p>Votre mission approche !</p>

            <div class="alert-box">
              <p><strong>📅 Date et heure :</strong> ${formattedDate}</p>
              <p><strong>👤 Passager :</strong> ${vipName}</p>
              <p><strong>📍 Départ :</strong> ${pickupAddress}</p>
              <p><strong>🎯 Arrivée :</strong> ${dropoffAddress}</p>
            </div>

            <p>N'oubliez pas de vous présenter à l'heure au lieu de rendez-vous.</p>

            <p style="color: #6b7280; font-size: 14px; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
              Cet email a été envoyé par FestivalDrive
            </p>
          </div>
        </body>
      </html>
    `;

    const result = await resend.emails.send({
      from: `FestivalDrive <${FROM_EMAIL}>`,
      to: driverEmail,
      subject: `⏰ Rappel : Mission demain à ${new Date(requestedDatetime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
      html: htmlContent,
    });

    return {
      success: true,
      messageId: result.data?.id,
    };
  } catch (error) {
    console.error('Error sending reminder email:', error);
    return {
      success: false,
      error: 'Erreur lors de l\'envoi de l\'email',
    };
  }
}

/**
 * Teste la configuration de Resend
 */
export async function testEmailConfiguration(): Promise<EmailResult> {
  if (!resend) {
    return {
      success: false,
      error: 'Resend API key not configured',
    };
  }

  try {
    const result = await resend.emails.send({
      from: `FestivalDrive <${FROM_EMAIL}>`,
      to: 'test@example.com',
      subject: 'Test de configuration FestivalDrive',
      html: '<p>Configuration email OK !</p>',
    });

    return {
      success: true,
      messageId: result.data?.id,
    };
  } catch (error) {
    console.error('Error testing email configuration:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
