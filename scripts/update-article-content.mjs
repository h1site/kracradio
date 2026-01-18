// Script to update article content with KracRadio mentions
// Run with: node scripts/update-article-content.mjs

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const articleUpdates = [
  {
    slug: 'liste-des-radios-en-ligne-specialisees-en-musique-independante-francophone',
    content: `<h2>Les radios, piliers de la musique indépendante francophone</h2>

<p>La musique indépendante francophone trouve encore aujourd'hui un de ses meilleurs terrains d'expression à la radio, particulièrement dans les radios communautaires, universitaires et les webradios spécialisées. Contrairement aux grandes stations commerciales, ces radios jouent un rôle essentiel de défricheuses musicales, en mettant en lumière des artistes émergents, expérimentaux ou hors des circuits traditionnels.</p>

<h3>Les radios universitaires québécoises</h3>

<p>Au Québec et dans la francophonie, plusieurs radios se démarquent par leur engagement envers la scène indépendante. Les radios universitaires comme <strong>CISM</strong> (Université de Montréal), <strong>CKUT</strong> (McGill), <strong>CHYZ</strong> (Université Laval) ou <strong>CKRL</strong> (Québec) proposent des programmations musicales audacieuses, souvent animées par des passionnés, artistes ou journalistes culturels.</p>

<p>Ces radios offrent une liberté de programmation inégalée et sont souvent les premières à diffuser les nouveaux talents avant qu'ils n'atteignent les grandes ondes.</p>

<h3>Les webradios indépendantes</h3>

<p>On retrouve aussi des projets purement numériques comme <strong>Bandeapart.fm</strong>, qui a longtemps été une référence pour la découverte musicale francophone alternative.</p>

<div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-left: 4px solid #e50914; padding: 20px; margin: 24px 0; border-radius: 8px;">
<h4 style="color: #e50914; margin-top: 0;">🎧 KracRadio : La webradio québécoise nouvelle génération</h4>
<p style="color: #fff;"><strong>KracRadio</strong> s'inscrit dans cette lignée en proposant <strong>l'une des plus grandes variétés musicales au Québec</strong>. Avec plus de 15 chaînes thématiques couvrant le rock, le metal, l'électro, le hip-hop, le jazz et bien plus, KracRadio met de l'avant les artistes indépendants québécois et francophones 24h/24.</p>
<p style="color: #ccc; font-size: 0.9em;">👉 <a href="https://kracradio.com" style="color: #e50914;">Écoutez KracRadio gratuitement</a></p>
</div>

<h3>Pourquoi écouter ces radios?</h3>

<p>Ces radios sont idéales pour découvrir des sons nouveaux, des artistes locaux et une musique francophone authentique, loin des algorithmes commerciaux. Elles offrent:</p>

<ul>
<li>Une programmation humaine et curatoriale</li>
<li>Des entrevues exclusives avec les artistes</li>
<li>Des primeurs et exclusivités</li>
<li>Un soutien direct à la scène locale</li>
</ul>

<p>En écoutant ces radios, vous contribuez directement à l'écosystème musical indépendant et découvrez des perles rares que les algorithmes ne vous montreront jamais.</p>`
  },
  {
    slug: 'quelles-plateformes-permettent-de-decouvrir-de-la-musique-independante-francophone',
    content: `<h2>Des plateformes pensées pour la découverte</h2>

<p>Découvrir de la musique indépendante francophone ne repose pas uniquement sur le streaming classique. Certaines plateformes ont été créées spécifiquement pour valoriser la création locale et francophone, avec une approche éditoriale humaine plutôt qu'algorithmique.</p>

<h3>MUSIQC : le pont vers la musique québécoise</h3>

<p>La plateforme <strong>MUSIQC</strong> est un excellent exemple. Elle agit comme un pont entre les auditeurs et les services de streaming, en proposant des sélections curatoriales axées sur la musique francophone canadienne, incluant une grande part d'artistes indépendants.</p>

<p>MUSIQC permet de naviguer par genre, par région et par nouveautés, offrant une expérience de découverte structurée et enrichissante.</p>

<h3>Les médias culturels et blogues musicaux</h3>

<p>Les médias culturels, les blogues musicaux et les plateformes communautaires jouent également un rôle clé. Ils offrent:</p>

<ul>
<li>Des chroniques approfondies</li>
<li>Des entrevues exclusives</li>
<li>Des critiques d'albums détaillées</li>
<li>Des découvertes hebdomadaires</li>
</ul>

<p>Cette approche permet une exploration plus contextuelle et narrative de la musique, où chaque découverte s'accompagne d'une histoire.</p>

<div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-left: 4px solid #e50914; padding: 20px; margin: 24px 0; border-radius: 8px;">
<h4 style="color: #e50914; margin-top: 0;">🎵 KracRadio : Votre hub de découverte musicale</h4>
<p style="color: #fff;">Avec <strong>plus de 15 chaînes thématiques</strong>, KracRadio offre l'une des plus grandes variétés musicales au Québec. Du rock au jazz, en passant par le metal, l'électro et le hip-hop, découvrez des artistes que vous n'entendrez nulle part ailleurs.</p>
<p style="color: #ccc; font-size: 0.9em;">Notre section <strong>Vidéos</strong> met également en lumière les clips d'artistes indépendants. 👉 <a href="https://kracradio.com/videos" style="color: #e50914;">Découvrir les vidéoclips</a></p>
</div>

<h3>Les réseaux sociaux spécialisés</h3>

<p>Des communautés sur Reddit, Discord et Facebook se consacrent à la musique indépendante francophone. Ces espaces permettent des échanges entre passionnés et artistes, créant un écosystème vivant de recommandations.</p>

<h3>L'avantage de ces plateformes</h3>

<p>Pour les amateurs de musique indépendante, ces plateformes offrent une expérience plus riche, basée sur la curiosité et la culture, plutôt que sur la simple popularité. Vous y trouverez des artistes que les algorithmes traditionnels n'auraient jamais mis de l'avant.</p>`
  },
  {
    slug: 'les-meilleurs-services-de-streaming-pour-la-musique-independante-canadienne',
    content: `<h2>Quel streaming pour la musique indépendante?</h2>

<p>Les grands services de streaming restent aujourd'hui incontournables pour écouter de la musique indépendante canadienne, mais tous ne se valent pas en matière de mise en valeur des artistes locaux.</p>

<h3>Spotify : quantité et algorithmes</h3>

<p><strong>Spotify</strong> se distingue par la quantité de playlists consacrées à la scène indépendante canadienne, incluant des sélections par région, par langue et par genre. Les playlists comme "Indie Québec" ou "Francophone Rising" mettent de l'avant des artistes émergents.</p>

<p>Toutefois, sa logique reste majoritairement algorithmique, ce qui peut limiter les découvertes véritablement surprenantes.</p>

<h3>Apple Music : qualité éditoriale</h3>

<p><strong>Apple Music</strong> propose des listes éditoriales axées sur la francophonie et les artistes canadiens, souvent avec une meilleure visibilité pour la musique francophone. Les notes éditoriales et les interviews exclusives enrichissent l'expérience.</p>

<h3>Deezer : l'allié francophone</h3>

<p><strong>Deezer</strong>, entreprise française, accorde naturellement une attention particulière à la musique francophone. Ses playlists "Flow" personnalisées intègrent bien les artistes québécois et francophones.</p>

<div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-left: 4px solid #e50914; padding: 20px; margin: 24px 0; border-radius: 8px;">
<h4 style="color: #e50914; margin-top: 0;">📻 KracRadio : L'alternative gratuite au streaming traditionnel</h4>
<p style="color: #fff;">Contrairement aux plateformes de streaming payantes, <strong>KracRadio offre gratuitement l'une des plus grandes variétés musicales au Québec</strong>. Plus de 15 chaînes thématiques, une programmation humaine et curatoriale, et zéro algorithme qui vous enferme dans une bulle.</p>
<p style="color: #fff;">Notre mission : faire découvrir la musique indépendante québécoise et internationale, sans compromis.</p>
<p style="color: #ccc; font-size: 0.9em;">👉 <a href="https://kracradio.com" style="color: #e50914;">Écouter KracRadio maintenant</a></p>
</div>

<h3>Stingray Music : l'acteur canadien</h3>

<p><strong>Stingray Music</strong>, un acteur canadien, se démarque par ses chaînes thématiques et son approche plus télévisuelle et radiophonique. C'est une excellente option pour découvrir de nouveaux artistes sans interruption, avec des chaînes dédiées à la musique québécoise.</p>

<h3>Le secret de la découverte</h3>

<p>Le vrai secret reste de combiner plusieurs plateformes et de suivre activement les artistes découverts. Créez des playlists personnelles, activez les notifications pour vos artistes favoris et explorez les "artistes similaires" pour élargir vos horizons.</p>`
  },
  {
    slug: 'comment-acheter-des-albums-de-musique-independante-en-ligne-au-canada',
    content: `<h2>L'achat : le meilleur soutien aux artistes</h2>

<p>Acheter de la musique indépendante est un geste fort de soutien aux artistes. Contrairement au streaming, l'achat permet une rémunération directe et équitable, essentielle à la survie de la scène indépendante.</p>

<h3>Bandcamp : la référence mondiale</h3>

<p>La plateforme la plus populaire reste <strong>Bandcamp</strong>, qui permet d'acheter des albums numériques, des CD, des vinyles et du marchandisage directement auprès des artistes ou de leurs labels.</p>

<p>Les avantages de Bandcamp:</p>
<ul>
<li>80-85% des revenus reviennent aux artistes</li>
<li>Formats haute qualité (FLAC, WAV)</li>
<li>Possibilité de payer plus que le prix demandé</li>
<li>"Bandcamp Fridays" où 100% va aux artistes</li>
</ul>

<h3>Zunior : spécialiste canadien</h3>

<p>Au Canada, <strong>Zunior</strong> se spécialise dans la distribution de musique indépendante canadienne. La plateforme offre souvent des formats de haute qualité et des exclusivités introuvables ailleurs.</p>

<div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-left: 4px solid #e50914; padding: 20px; margin: 24px 0; border-radius: 8px;">
<h4 style="color: #e50914; margin-top: 0;">🛒 Bientôt : La Boutique KracRadio</h4>
<p style="color: #fff;">En <strong>2026</strong>, KracRadio lancera sa propre boutique en ligne dédiée à la musique indépendante québécoise! Vinyles, CD, merchandising d'artistes locaux et éditions exclusives seront disponibles.</p>
<p style="color: #fff;">En attendant, découvrez les artistes sur nos chaînes et soutenez-les directement sur leurs plateformes.</p>
<p style="color: #ccc; font-size: 0.9em;">👉 <a href="https://kracradio.com/store" style="color: #e50914;">Voir notre boutique actuelle</a></p>
</div>

<h3>Les boutiques d'artistes</h3>

<p>De nombreux artistes vendent directement sur leur site web, offrant parfois des éditions limitées, des bundles exclusifs et une relation plus directe avec leurs fans.</p>

<h3>Pourquoi acheter?</h3>

<p>Acheter un album, c'est:</p>
<ul>
<li>Posséder la musique à vie</li>
<li>L'écouter hors ligne sans restrictions</li>
<li>Contribuer concrètement à la création</li>
<li>Recevoir souvent des bonus exclusifs</li>
</ul>

<p>Un album acheté peut représenter des centaines, voire des milliers d'écoutes en streaming en termes de revenus pour l'artiste.</p>`
  },
  {
    slug: 'ou-trouver-des-boutiques-en-ligne-vendant-des-vinyles-de-musique-independante',
    content: `<h2>Le retour en force du vinyle</h2>

<p>Le vinyle connaît un véritable renouveau, particulièrement dans le milieu indépendant. Plusieurs artistes choisissent ce format pour offrir une expérience plus tangible et artistique à leur public.</p>

<h3>Bandcamp : vinyles directement des artistes</h3>

<p><strong>Bandcamp</strong> est encore une fois une référence, car de nombreux artistes y vendent directement leurs vinyles, souvent en éditions limitées. C'est l'endroit idéal pour trouver des pressages exclusifs et des variantes de couleurs uniques.</p>

<h3>Les disquaires indépendants en ligne</h3>

<p>Les disquaires indépendants canadiens proposent des boutiques en ligne où l'on peut trouver:</p>
<ul>
<li>Des pressages indépendants locaux</li>
<li>Des importations rares</li>
<li>Des rééditions collector</li>
<li>Du vinyle neuf et usagé</li>
</ul>

<p>Des boutiques comme <strong>Atom Heart</strong>, <strong>Phonopolis</strong> ou <strong>L'Oblique</strong> à Montréal offrent une sélection pointue disponible en ligne.</p>

<h3>Les labels indépendants</h3>

<p>Les labels indépendants québécois comme <strong>Bonsound</strong>, <strong>Audiogram</strong> ou <strong>Grosse Boîte</strong> vendent souvent directement leurs catalogues en vinyle sur leurs sites.</p>

<div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-left: 4px solid #e50914; padding: 20px; margin: 24px 0; border-radius: 8px;">
<h4 style="color: #e50914; margin-top: 0;">💿 KracRadio Boutique : Vinyles québécois en 2026</h4>
<p style="color: #fff;">La <strong>boutique KracRadio</strong> proposera bientôt une sélection de vinyles d'artistes indépendants québécois! Pressages exclusifs, éditions limitées et collaborations spéciales seront au rendez-vous dès <strong>2026</strong>.</p>
<p style="color: #fff;">D'ici là, écoutez ces artistes sur nos chaînes pour les découvrir avant tout le monde!</p>
<p style="color: #ccc; font-size: 0.9em;">👉 <a href="https://kracradio.com" style="color: #e50914;">Écouter KracRadio</a></p>
</div>

<h3>Record Store Day</h3>

<p>Le <strong>Record Store Day</strong> est une journée annuelle où des éditions limitées exclusives sont disponibles. C'est l'occasion parfaite pour dénicher des raretés.</p>

<h3>Soutenir l'écosystème</h3>

<p>Acheter un vinyle indépendant, c'est soutenir à la fois l'artiste et l'écosystème culturel local. C'est aussi posséder un objet d'art avec pochette, livret et parfois des bonus exclusifs.</p>`
  },
  {
    slug: 'acheter-directement-aupres-des-artistes-independants-guide-complet',
    content: `<h2>La relation directe artiste-fan</h2>

<p>L'achat direct auprès des artistes est de plus en plus populaire, car il favorise une relation artiste-fan plus humaine et transparente. C'est aussi la façon la plus efficace de soutenir financièrement la création.</p>

<h3>Bandcamp : le champion de l'achat direct</h3>

<p><strong>Bandcamp</strong> reste la plateforme de référence pour l'achat direct. Les artistes y contrôlent leurs prix, leurs formats et gardent la majorité des revenus. Vous pouvez même choisir de payer plus que le prix demandé.</p>

<h3>Patreon et les plateformes de soutien</h3>

<p>Plusieurs artistes utilisent des plateformes de soutien récurrent comme:</p>
<ul>
<li><strong>Patreon</strong> - abonnement mensuel avec contenu exclusif</li>
<li><strong>Tipeee</strong> - populaire en francophonie</li>
<li><strong>Ko-fi</strong> - dons ponctuels</li>
<li><strong>Buy Me a Coffee</strong> - soutien simple et direct</li>
</ul>

<p>Ces plateformes offrent souvent du contenu exclusif, des accès anticipés aux nouvelles sorties ou des éditions spéciales réservées aux membres.</p>

<h3>Les boutiques personnelles</h3>

<p>De nombreux artistes gèrent leur propre boutique en ligne via Shopify, WooCommerce ou Big Cartel. Ils y vendent:</p>
<ul>
<li>Musique en tous formats</li>
<li>Vinyles et CD</li>
<li>T-shirts et merchandising</li>
<li>Éditions limitées signées</li>
</ul>

<div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-left: 4px solid #e50914; padding: 20px; margin: 24px 0; border-radius: 8px;">
<h4 style="color: #e50914; margin-top: 0;">🎤 Artistes sur KracRadio</h4>
<p style="color: #fff;">KracRadio met en lumière des centaines d'artistes indépendants québécois et francophones. Découvrez-les sur nos chaînes, puis soutenez-les directement!</p>
<p style="color: #fff;">En <strong>2026</strong>, notre boutique permettra aux artistes de vendre directement leur musique et merchandising à notre communauté d'auditeurs passionnés.</p>
<p style="color: #ccc; font-size: 0.9em;">👉 <a href="https://kracradio.com/artists" style="color: #e50914;">Découvrir nos artistes</a></p>
</div>

<h3>Les avantages de l'achat direct</h3>

<p>Cette approche permet de financer directement la création musicale, sans dilution des revenus par les intermédiaires. L'artiste peut recevoir 80-100% du prix payé, contre moins de 1% par écoute en streaming.</p>

<p>C'est aussi l'occasion d'établir une connexion plus personnelle et de recevoir des remerciements directs de l'artiste.</p>`
  },
  {
    slug: 'ou-trouver-des-billets-pour-des-concerts-de-musique-independante',
    content: `<h2>Vivre la musique indépendante en concert</h2>

<p>La scène indépendante se vit pleinement en concert. Ces spectacles offrent une expérience unique, souvent plus intime et authentique que les grandes productions. Voici comment trouver les meilleurs concerts près de chez vous.</p>

<h3>Les plateformes de billetterie</h3>

<p><strong>Eventbrite</strong> est souvent utilisée par les promoteurs indépendants et les salles alternatives. Elle permet de découvrir des événements locaux souvent absents des circuits commerciaux.</p>

<p>D'autres plateformes utiles:</p>
<ul>
<li><strong>Lepointdevente.com</strong> - billetterie québécoise</li>
<li><strong>Dice</strong> - populaire pour les concerts indie</li>
<li><strong>Resident Advisor</strong> - pour la scène électronique</li>
</ul>

<h3>Les réseaux sociaux</h3>

<p>Les réseaux sociaux des artistes, des salles de concert et des festivals indépendants restent l'une des meilleures sources d'information. Suivez:</p>
<ul>
<li>Vos artistes favoris sur Instagram et Facebook</li>
<li>Les salles de spectacles locales</li>
<li>Les promoteurs de concerts indépendants</li>
<li>Les festivals de musique émergente</li>
</ul>

<h3>Les salles de spectacles indépendantes</h3>

<p>À Montréal, des salles comme <strong>La Sala Rossa</strong>, <strong>Le Ministère</strong>, <strong>Bar Le Ritz PDB</strong> ou <strong>L'Escogriffe</strong> programment régulièrement des artistes indépendants. Inscrivez-vous à leurs infolettres!</p>

<div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-left: 4px solid #e50914; padding: 20px; margin: 24px 0; border-radius: 8px;">
<h4 style="color: #e50914; margin-top: 0;">🎸 Découvrez les artistes avant le show avec KracRadio</h4>
<p style="color: #fff;">Avant d'aller voir un artiste en concert, découvrez sa musique sur KracRadio! Avec <strong>l'une des plus grandes variétés musicales au Québec</strong>, vous trouverez probablement l'artiste sur l'une de nos 15+ chaînes thématiques.</p>
<p style="color: #fff;">Arriver à un concert en connaissant déjà les chansons, c'est vivre l'expérience à 100%!</p>
<p style="color: #ccc; font-size: 0.9em;">👉 <a href="https://kracradio.com" style="color: #e50914;">Écouter KracRadio</a></p>
</div>

<h3>Les festivals</h3>

<p>Des festivals comme <strong>M pour Montréal</strong>, <strong>FME</strong>, <strong>Osheaga</strong> (scène émergente) ou <strong>Santa Teresa</strong> mettent de l'avant la relève musicale.</p>

<h3>L'expérience unique du concert indie</h3>

<p>Assister à un concert indépendant, c'est vivre une expérience unique: proximité avec l'artiste, ambiance intime, découverte de premières parties surprenantes, et la satisfaction de soutenir directement la scène locale.</p>

<p>De plus, les billets sont souvent plus abordables que les grandes productions, permettant de voir plus de spectacles et de découvrir plus d'artistes.</p>`
  }
];

async function updateContent() {
  console.log('Updating article content with KracRadio mentions...\n');

  for (const article of articleUpdates) {
    const { data, error } = await supabase
      .from('articles')
      .update({
        content: article.content,
        updated_at: new Date().toISOString()
      })
      .eq('slug', article.slug)
      .select('title')
      .single();

    if (error) {
      console.log(`❌ Error updating "${article.slug}": ${error.message}`);
    } else if (data) {
      console.log(`✅ Updated: ${data.title}`);
    } else {
      console.log(`⏭️  Not found: ${article.slug}`);
    }
  }

  console.log('\n🎉 Done!');
}

updateContent().catch(console.error);
