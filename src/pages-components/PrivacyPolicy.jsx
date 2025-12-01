'use client';
// src/pages/PrivacyPolicy.jsx
import React from 'react';
import { useI18n } from '../i18n';
import Seo from '../seo/Seo';

const CONTENT = {
  fr: {
    title: 'Politique de confidentialité',
    lastUpdated: 'Dernière mise à jour',
    intro: 'KracRadio ("nous", "notre", "nos") exploite l\'application mobile KracRadio et le site web kracradio.com. Cette page vous informe de nos politiques concernant la collecte, l\'utilisation et la divulgation des informations personnelles lorsque vous utilisez notre Service.',
    sections: [
      {
        title: '1. Informations que nous collectons',
        content: `Nous collectons plusieurs types d'informations à différentes fins pour vous fournir et améliorer notre Service.

**Données personnelles**
Lors de l'utilisation de notre Service, nous pouvons vous demander de nous fournir certaines informations personnellement identifiables qui peuvent être utilisées pour vous contacter ou vous identifier. Les informations personnellement identifiables peuvent inclure, mais sans s'y limiter :
- Adresse e-mail
- Nom d'utilisateur
- Photo de profil (optionnel)
- Préférences musicales

**Données d'utilisation**
Nous pouvons également collecter des informations sur la façon dont le Service est accédé et utilisé. Ces données d'utilisation peuvent inclure :
- Les chaînes radio écoutées
- Les chansons aimées ("likes")
- La durée d'écoute
- Le type d'appareil utilisé`
      },
      {
        title: '2. Utilisation des données',
        content: `KracRadio utilise les données collectées à diverses fins :
- Pour fournir et maintenir notre Service
- Pour vous notifier des changements apportés à notre Service
- Pour vous permettre de participer aux fonctionnalités interactives de notre Service
- Pour fournir un support client
- Pour recueillir des analyses ou des informations précieuses afin d'améliorer notre Service
- Pour surveiller l'utilisation de notre Service
- Pour détecter, prévenir et résoudre les problèmes techniques
- Pour générer des classements de chansons populaires (de manière anonyme et agrégée)`
      },
      {
        title: '3. Conservation des données',
        content: `KracRadio conservera vos données personnelles uniquement aussi longtemps que nécessaire aux fins énoncées dans cette politique de confidentialité. Nous conserverons et utiliserons vos données personnelles dans la mesure nécessaire pour nous conformer à nos obligations légales, résoudre les litiges et appliquer nos politiques.

Les données d'utilisation sont généralement conservées pendant une période plus courte, sauf lorsque ces données sont utilisées pour renforcer la sécurité ou améliorer la fonctionnalité de notre Service, ou lorsque nous sommes légalement obligés de conserver ces données pendant des périodes plus longues.`
      },
      {
        title: '4. Transfert des données',
        content: `Vos informations, y compris les données personnelles, peuvent être transférées vers — et maintenues sur — des ordinateurs situés en dehors de votre état, province, pays ou autre juridiction gouvernementale où les lois sur la protection des données peuvent différer de celles de votre juridiction.

Votre consentement à cette politique de confidentialité suivi de votre soumission de telles informations représente votre accord à ce transfert.

KracRadio prendra toutes les mesures raisonnablement nécessaires pour s'assurer que vos données sont traitées de manière sécurisée et conformément à cette politique de confidentialité.`
      },
      {
        title: '5. Sécurité des données',
        content: `La sécurité de vos données est importante pour nous. Nous utilisons Supabase comme infrastructure backend, qui fournit :
- Chiffrement des données au repos et en transit
- Authentification sécurisée (y compris OAuth avec Google)
- Contrôles d'accès basés sur les rôles

Cependant, aucune méthode de transmission sur Internet ou méthode de stockage électronique n'est sécurisée à 100%. Bien que nous nous efforcions d'utiliser des moyens commercialement acceptables pour protéger vos données personnelles, nous ne pouvons garantir leur sécurité absolue.`
      },
      {
        title: '6. Vos droits',
        content: `Vous avez le droit de :
- Accéder à vos données personnelles
- Corriger vos données personnelles
- Supprimer vos données personnelles
- Exporter vos données personnelles
- Retirer votre consentement à tout moment

Pour exercer ces droits, contactez-nous à l'adresse indiquée ci-dessous.`
      },
      {
        title: '7. Services tiers',
        content: `Notre Service peut contenir des liens vers d'autres sites qui ne sont pas exploités par nous. Si vous cliquez sur un lien tiers, vous serez dirigé vers le site de ce tiers. Nous vous conseillons fortement de consulter la politique de confidentialité de chaque site que vous visitez.

Nous n'avons aucun contrôle sur et n'assumons aucune responsabilité pour le contenu, les politiques de confidentialité ou les pratiques de tout site ou service tiers.

**Services intégrés :**
- Google Sign-In (pour l'authentification)
- Supabase (stockage des données)
- Vercel (hébergement)`
      },
      {
        title: '8. Confidentialité des enfants',
        content: `Notre Service ne s'adresse pas aux personnes de moins de 13 ans ("Enfants").

Nous ne collectons pas sciemment d'informations personnellement identifiables auprès de personnes de moins de 13 ans. Si vous êtes un parent ou un tuteur et que vous savez que votre enfant nous a fourni des données personnelles, veuillez nous contacter. Si nous apprenons que nous avons collecté des données personnelles d'enfants sans vérification du consentement parental, nous prenons des mesures pour supprimer ces informations de nos serveurs.`
      },
      {
        title: '9. Modifications de cette politique',
        content: `Nous pouvons mettre à jour notre politique de confidentialité de temps à autre. Nous vous informerons de tout changement en publiant la nouvelle politique de confidentialité sur cette page et en mettant à jour la date de "Dernière mise à jour".

Nous vous conseillons de consulter cette politique de confidentialité périodiquement pour tout changement. Les modifications apportées à cette politique de confidentialité sont effectives lorsqu'elles sont publiées sur cette page.`
      },
      {
        title: '10. Nous contacter',
        content: `Si vous avez des questions concernant cette politique de confidentialité, veuillez nous contacter :
- Par email : info@kracradio.com
- Via notre site web : https://kracradio.com/contact`
      }
    ]
  },
  en: {
    title: 'Privacy Policy',
    lastUpdated: 'Last updated',
    intro: 'KracRadio ("us", "we", or "our") operates the KracRadio mobile application and the kracradio.com website. This page informs you of our policies regarding the collection, use, and disclosure of personal information when you use our Service.',
    sections: [
      {
        title: '1. Information We Collect',
        content: `We collect several different types of information for various purposes to provide and improve our Service to you.

**Personal Data**
While using our Service, we may ask you to provide us with certain personally identifiable information that can be used to contact or identify you. Personally identifiable information may include, but is not limited to:
- Email address
- Username
- Profile picture (optional)
- Music preferences

**Usage Data**
We may also collect information on how the Service is accessed and used. This Usage Data may include:
- Radio channels listened to
- Songs liked
- Listening duration
- Device type used`
      },
      {
        title: '2. Use of Data',
        content: `KracRadio uses the collected data for various purposes:
- To provide and maintain our Service
- To notify you about changes to our Service
- To allow you to participate in interactive features of our Service
- To provide customer support
- To gather analysis or valuable information so that we can improve our Service
- To monitor the usage of our Service
- To detect, prevent and address technical issues
- To generate popular song charts (anonymously and aggregated)`
      },
      {
        title: '3. Data Retention',
        content: `KracRadio will retain your Personal Data only for as long as is necessary for the purposes set out in this Privacy Policy. We will retain and use your Personal Data to the extent necessary to comply with our legal obligations, resolve disputes, and enforce our policies.

Usage Data is generally retained for a shorter period, except when this data is used to strengthen the security or to improve the functionality of our Service, or we are legally obligated to retain this data for longer time periods.`
      },
      {
        title: '4. Transfer of Data',
        content: `Your information, including Personal Data, may be transferred to — and maintained on — computers located outside of your state, province, country or other governmental jurisdiction where the data protection laws may differ from those of your jurisdiction.

Your consent to this Privacy Policy followed by your submission of such information represents your agreement to that transfer.

KracRadio will take all the steps reasonably necessary to ensure that your data is treated securely and in accordance with this Privacy Policy.`
      },
      {
        title: '5. Security of Data',
        content: `The security of your data is important to us. We use Supabase as our backend infrastructure, which provides:
- Encryption of data at rest and in transit
- Secure authentication (including OAuth with Google)
- Role-based access controls

However, no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.`
      },
      {
        title: '6. Your Rights',
        content: `You have the right to:
- Access your personal data
- Correct your personal data
- Delete your personal data
- Export your personal data
- Withdraw your consent at any time

To exercise these rights, contact us at the address provided below.`
      },
      {
        title: '7. Third-Party Services',
        content: `Our Service may contain links to other sites that are not operated by us. If you click a third-party link, you will be directed to that third party's site. We strongly advise you to review the Privacy Policy of every site you visit.

We have no control over and assume no responsibility for the content, privacy policies or practices of any third-party sites or services.

**Integrated Services:**
- Google Sign-In (for authentication)
- Supabase (data storage)
- Vercel (hosting)`
      },
      {
        title: '8. Children\'s Privacy',
        content: `Our Service does not address anyone under the age of 13 ("Children").

We do not knowingly collect personally identifiable information from anyone under the age of 13. If you are a parent or guardian and you are aware that your child has provided us with Personal Data, please contact us. If we become aware that we have collected Personal Data from children without verification of parental consent, we take steps to remove that information from our servers.`
      },
      {
        title: '9. Changes to This Policy',
        content: `We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.

You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.`
      },
      {
        title: '10. Contact Us',
        content: `If you have any questions about this Privacy Policy, please contact us:
- By email: info@kracradio.com
- Via our website: https://kracradio.com/contact`
      }
    ]
  }
};

export default function PrivacyPolicy() {
  const { lang } = useI18n();
  const content = CONTENT[lang] || CONTENT.fr;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Seo
        lang={lang}
        title={content.title}
        description="Politique de confidentialité de KracRadio - Privacy Policy"
        path="/privacy"
        type="article"
      />

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 md:p-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
          {content.title}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          {content.lastUpdated}: 16 novembre 2025
        </p>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-8">
            {content.intro}
          </p>

          {content.sections.map((section, index) => (
            <div key={index} className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {section.title}
              </h2>
              <div className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                {section.content.split('**').map((part, i) =>
                  i % 2 === 1 ? (
                    <strong key={i} className="font-semibold text-gray-900 dark:text-white">
                      {part}
                    </strong>
                  ) : (
                    part
                  )
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Language switcher for this page */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {lang === 'fr' ? (
              <>
                This privacy policy is also available in{' '}
                <a href="/privacy?lang=en" className="text-red-600 hover:underline">
                  English
                </a>
              </>
            ) : (
              <>
                Cette politique de confidentialité est également disponible en{' '}
                <a href="/privacy?lang=fr" className="text-red-600 hover:underline">
                  français
                </a>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
