// Types pour les règles personnalisables de la ligue de hockey

export interface LeagueRules {
  aiRules: AIRules
  gameplayRules: GameplayRules
  leagueOptions: LeagueOptions
}

// ===== RÈGLES DE L'IA =====
export interface AIRules {
  // Comportement général de l'IA
  aiDifficulty: 'facile' | 'normal' | 'difficile' | 'expert'
  aiAggressiveness: number // 0-100
  aiLineChangeBehavior: 'conservateur' | 'normal' | 'agressif'

  // Décisions tactiques
  aiPullGoalie: boolean // Sortir le gardien en fin de match
  aiPullGoalieTime: number // Minutes restantes pour sortir le gardien (défaut: 2)
  aiIcingStrategy: 'éviter' | 'normal' | 'agressif' // Stratégie de dégagement
  aiPenaltyKilling: 'défensif' | 'équilibré' | 'agressif'
  aiPowerPlayStrategy: 'conservateur' | 'équilibré' | 'offensif'

  // Gestion des joueurs
  aiRespectDepthChart: boolean // Respecter les lignes établies
  aiInjuryManagement: boolean // Gérer automatiquement les blessures
  aiCallUpPlayers: boolean // Rappeler automatiquement des joueurs de l'AHL

  // Bagarres et discipline
  aiFightingTendency: number // 0-100, probabilité de bagarre
  aiRetaliation: boolean // Riposter aux coups
  aiProtectStars: boolean // Protéger les joueurs vedettes
}

// ===== RÈGLES DE GAMEPLAY =====
export interface GameplayRules {
  // Durée et format du match
  periodLength: number // Minutes par période (défaut: 20)
  numberOfPeriods: number // Nombre de périodes (défaut: 3)
  intermissionLength: number // Durée de l'entracte en minutes (défaut: 15)

  // Prolongation et fusillade
  overtimeEnabled: boolean
  overtimeLength: number // Minutes (défaut: 5)
  overtimeFormat: '3v3' | '4v4' | '5v5'
  shootoutEnabled: boolean
  shootoutRounds: number // Nombre de tireurs initiaux (défaut: 3)

  // Règles de jeu de base
  icingEnabled: boolean // Dégagement interdit activé
  hybridIcing: boolean // Dégagement hybride (évite les collisions)
  offsideEnabled: boolean // Hors-jeu activé
  offsideReview: boolean // Révision vidéo des hors-jeux

  // Zones et trapèze
  goalieTrapezoid: boolean // Trapèze du gardien activé

  // Changements de ligne
  lineChangeAfterIcing: boolean // Interdire le changement après un icing
  lineChangeTimeout: number // Temps alloué pour changer (secondes)

  // Pénalités
  penaltiesEnabled: boolean
  fightingAllowed: boolean // Bagarres autorisées
  fightingPenalty: 'majeure' | 'expulsion' // Type de pénalité pour bagarre
  instigatorPenalty: boolean // Pénalité supplémentaire pour l'instigateur
  minorPenaltyDuration: number // Durée en minutes (défaut: 2)
  majorPenaltyDuration: number // Durée en minutes (défaut: 5)
  misconductDuration: number // Durée en minutes (défaut: 10)

  // Pénalités spécifiques
  highStickingEnabled: boolean
  hookingEnabled: boolean
  slashingEnabled: boolean
  trippingEnabled: boolean
  interferenceEnabled: boolean
  chargingEnabled: boolean
  crossCheckingEnabled: boolean
  roughingEnabled: boolean
  elbowingEnabled: boolean
  kneeingEnabled: boolean
  headContactPenalty: boolean // Pénalité pour contact à la tête
  delayOfGameEnabled: boolean // Retard de jeu

  // Révision vidéo
  goalReview: boolean // Révision des buts
  coachChallenge: boolean // Contestation d'entraîneur
  coachChallengeLimit: number // Nombre de contestations (défaut: 1)
  challengeFailurePenalty: boolean // Pénalité si contestation échouée

  // Timeouts
  timeoutsPerTeam: number // Nombre de temps morts par équipe (défaut: 1)
  timeoutDuration: number // Durée en secondes (défaut: 30)

  // Mise au jeu
  faceoffViolationPenalty: boolean // Pénalité après 2 violations

  // Équipement
  helmetRequired: boolean // Casque obligatoire
  visorRequired: boolean // Visière obligatoire
  neckGuardRequired: boolean // Protège-cou obligatoire

  // Buts
  goalKickAllowed: boolean // But marqué avec le patin autorisé (généralement false)
  highStickGoal: boolean // But avec bâton élevé autorisé (généralement false)
  netDisplacementReview: boolean // Vérifier si le filet était déplacé
}

// ===== OPTIONS DE LIGUE =====
export interface LeagueOptions {
  // Format de la ligue
  numberOfTeams: number // Nombre d'équipes dans la ligue
  conferenceEnabled: boolean // Divisions en conférences
  divisionEnabled: boolean // Divisions activées

  // Saison régulière
  regularSeasonGames: number // Nombre de matchs par saison (défaut: 82)
  pointsForWin: number // Points pour une victoire (défaut: 2)
  pointsForOTWin: number // Points pour victoire en prolongation (défaut: 2)
  pointsForOTLoss: number // Points pour défaite en prolongation (défaut: 1)
  pointsForLoss: number // Points pour une défaite (défaut: 0)

  // Séries éliminatoires
  playoffsEnabled: boolean
  playoffTeams: number // Nombre d'équipes qualifiées (défaut: 16)
  playoffFormat: 'standard' | 'divisional' | 'wildcard' // Format des séries
  playoffSeriesLength: number // Matchs par série (défaut: 7, format best-of)
  playoffOvertimeFormat: '5v5' | '4v4' | '3v3'
  playoffOvertimeLength: number // Minutes par période de prolongation
  playoffShootout: boolean // Fusillade en séries (généralement false)
  playoffReseed: boolean // Reclasser les équipes après chaque ronde

  // Plafond salarial
  salaryCapEnabled: boolean
  salaryCapAmount: number // Montant du plafond (défaut: 82 500 000)
  salaryFloor: number // Plancher salarial
  luxuryTaxEnabled: boolean // Taxe de luxe pour dépassement
  luxuryTaxRate: number // Pourcentage de taxe

  // Contrats - Règles de base
  maxContractYears: number // Durée maximale des contrats (défaut: 8)
  minContractYears: number // Durée minimale (défaut: 1)
  contractExtensionEnabled: boolean // Extensions de contrat autorisées
  frontLoadingAllowed: boolean // Contrats front-loaded autorisés
  backDivingAllowed: boolean // Contrats back-diving autorisés
  noMoveClauses: boolean // Clauses de non-échange autorisées
  noTradeClauses: boolean // Clauses de non-transaction autorisées

  // Contrats d'entrée (Entry-Level Contracts)
  elcEnabled: boolean // Contrats d'entrée obligatoires
  elcMaxSalary: number // Salaire de base maximal ELC (défaut: 950 000)
  elcMaxBonus: number // Bonus de performance max (défaut: 2 850 000)
  elcDuration18to21: number // Durée pour joueurs 18-21 ans (défaut: 3)
  elcDuration22to23: number // Durée pour joueurs 22-23 ans (défaut: 2)
  elcDuration24plus: number // Durée pour joueurs 24+ ans (défaut: 1)
  twoWayContractsEnabled: boolean // Contrats bidirectionnels autorisés

  // Structure salariale
  salaryVariationLimit: number // Variation annuelle max en % (défaut: 20)
  signingBonusMaxPercent: number // % max du contrat en bonus à la signature (défaut: 60)
  performanceBonusesEnabled: boolean // Bonus de performance autorisés
  deferredPaymentsAllowed: boolean // Paiements différés autorisés
  minimumNHLSalary: number // Salaire minimum NHL (défaut: 775 000)

  // Clauses spéciales
  buyoutEnabled: boolean // Rachat de contrat autorisé
  buyoutRateOver26: number // Taux de rachat pour 26+ ans (défaut: 66.67%)
  buyoutRateUnder26: number // Taux de rachat pour -26 ans (défaut: 33.33%)
  noMovementClausesEnabled: boolean // Clauses NMC autorisées
  limitedNoTradeEnabled: boolean // NTC limitées (liste d'équipes)

  // Arbitrage salarial
  salaryArbitrationEnabled: boolean // Arbitrage salarial activé
  arbitrationEligibilityYears: number // Années d'expérience requises (défaut: 4)
  clubElectedArbitration: boolean // Arbitrage initié par le club
  arbitrationDecisionBinding: boolean // Décision de l'arbitre contraignante

  // Blessures et assurances
  injuredReserveEnabled: boolean // Liste des blessés activée (IR)
  irMinimumDays: number // Jours minimum en IR (défaut: 7)
  ltirEnabled: boolean // Liste blessés long terme activée (LTIR)
  ltirMinimumDays: number // Jours minimum en LTIR (défaut: 24)
  ltirMinimumGames: number // Matchs minimum en LTIR (défaut: 10)
  ltirCapRelief: boolean // Soulagement du plafond pour LTIR
  healthInsuranceProvided: boolean // Assurance santé fournie
  disabilityInsuranceProvided: boolean // Assurance invalidité fournie

  // Retraite et pensions
  pensionEnabled: boolean // Système de pension activé
  pensionYearsRequired: number // Années de service pour pension complète (défaut: 10)
  earlyRetirementPenalty: boolean // Pénalité pour retraite anticipée
  capRecaptureRule: boolean // Règle de récupération du plafond

  // Échanges
  tradeDeadlineEnabled: boolean
  tradeDeadlineDate: string // Date limite des transactions (format: 'MM-DD')
  tradeSalaryCap: boolean // Vérifier le plafond lors des échanges
  tradeApproval: 'commissioner' | 'vote' | 'automatic' // Approbation des échanges
  tradeVetoEnabled: boolean // Veto des échanges activé

  // Repêchage
  draftEnabled: boolean
  draftRounds: number // Nombre de rondes (défaut: 7)
  draftLottery: boolean // Loterie pour le premier choix
  draftOrder: 'reverse_standings' | 'lottery' | 'custom'

  // Agence libre
  freeAgencyEnabled: boolean
  restrictedFreeAgency: boolean // Agence libre avec compensation
  offerSheets: boolean // Offres hostiles autorisées

  // Waivers
  waiversEnabled: boolean
  waiversClearTime: number // Heures avant que les waivers soient clairs (défaut: 24)

  // Roster et alignement
  rosterSize: number // Taille de l'effectif (défaut: 23)
  minRosterSize: number // Effectif minimum (défaut: 20)
  activeRosterSize: number // Joueurs actifs par match (défaut: 20)
  injuredReserveSlots: number // Places en réserve blessés (défaut: 3)

  // Lignes et compositions
  linesPerTeam: number // Nombre de lignes par équipe (défaut: 4)
  defensePerLine: number // Défenseurs par paire (défaut: 2)
  goaltendersPerTeam: number // Gardiens par équipe (défaut: 2-3)

  // Blessures et fatigue
  injuriesEnabled: boolean
  injuryFrequency: 'rare' | 'normal' | 'fréquent'
  injuryRecoveryTime: 'rapide' | 'normal' | 'réaliste'
  fatigueEnabled: boolean // Fatigue des joueurs activée
  fatigueImpact: 'faible' | 'moyen' | 'élevé'

  // Développement des joueurs
  playerDevelopment: boolean // Progression des joueurs
  playerRegression: boolean // Régression des vétérans
  rookieDevelopmentBonus: boolean // Bonus de développement pour les recrues

  // AHL et affiliations
  ahlEnabled: boolean // Ligue AHL activée
  ahlRosterSize: number // Taille de l'effectif AHL
  callUpLimit: number // Nombre maximum de rappels par saison

  // Statistiques et records
  trackIndividualStats: boolean // Suivre les stats individuelles
  trackTeamStats: boolean // Suivre les stats d'équipe
  hallOfFame: boolean // Temple de la renommée activé
  retireJerseys: boolean // Retrait de chandails autorisé

  // Réalisme
  realisticLineChanges: boolean // Changements de ligne réalistes
  realisticPenalties: boolean // Pénalités réalistes
  homeIceAdvantage: boolean // Avantage de la glace locale
  homeIceAdvantagePercent: number // Pourcentage d'avantage (défaut: 5)

  // Mode de simulation
  simulationSpeed: 'lent' | 'normal' | 'rapide' | 'instantané'
  autoSimSchedule: boolean // Simuler automatiquement le calendrier

  // Game Mode (mode jeu pour testing)
  gameMode: boolean // Mode jeu activé (GM gère 1 équipe, AI gère les autres)
  gameModeTeamId: string | null // ID de l'équipe gérée par le GM en mode jeu

  // Options avancées
  weatherEffects: boolean // Effets météo (pour matchs extérieurs)
  fanMorale: boolean // Moral des partisans
  teamChemistry: boolean // Chimie d'équipe
  coachRating: boolean // Évaluation de l'entraîneur
}

// Valeurs par défaut
export const DEFAULT_AI_RULES: AIRules = {
  aiDifficulty: 'normal',
  aiAggressiveness: 50,
  aiLineChangeBehavior: 'normal',
  aiPullGoalie: true,
  aiPullGoalieTime: 2,
  aiIcingStrategy: 'normal',
  aiPenaltyKilling: 'équilibré',
  aiPowerPlayStrategy: 'équilibré',
  aiRespectDepthChart: true,
  aiInjuryManagement: true,
  aiCallUpPlayers: true,
  aiFightingTendency: 30,
  aiRetaliation: true,
  aiProtectStars: true,
}

export const DEFAULT_GAMEPLAY_RULES: GameplayRules = {
  periodLength: 20,
  numberOfPeriods: 3,
  intermissionLength: 15,
  overtimeEnabled: true,
  overtimeLength: 5,
  overtimeFormat: '3v3',
  shootoutEnabled: true,
  shootoutRounds: 3,
  icingEnabled: true,
  hybridIcing: true,
  offsideEnabled: true,
  offsideReview: true,
  goalieTrapezoid: true,
  lineChangeAfterIcing: false,
  lineChangeTimeout: 30,
  penaltiesEnabled: true,
  fightingAllowed: true,
  fightingPenalty: 'majeure',
  instigatorPenalty: true,
  minorPenaltyDuration: 2,
  majorPenaltyDuration: 5,
  misconductDuration: 10,
  highStickingEnabled: true,
  hookingEnabled: true,
  slashingEnabled: true,
  trippingEnabled: true,
  interferenceEnabled: true,
  chargingEnabled: true,
  crossCheckingEnabled: true,
  roughingEnabled: true,
  elbowingEnabled: true,
  kneeingEnabled: true,
  headContactPenalty: true,
  delayOfGameEnabled: true,
  goalReview: true,
  coachChallenge: true,
  coachChallengeLimit: 1,
  challengeFailurePenalty: true,
  timeoutsPerTeam: 1,
  timeoutDuration: 30,
  faceoffViolationPenalty: true,
  helmetRequired: true,
  visorRequired: true,
  neckGuardRequired: false,
  goalKickAllowed: false,
  highStickGoal: false,
  netDisplacementReview: true,
}

export const DEFAULT_LEAGUE_OPTIONS: LeagueOptions = {
  numberOfTeams: 32,
  conferenceEnabled: true,
  divisionEnabled: true,
  regularSeasonGames: 82,
  pointsForWin: 2,
  pointsForOTWin: 2,
  pointsForOTLoss: 1,
  pointsForLoss: 0,
  playoffsEnabled: true,
  playoffTeams: 16,
  playoffFormat: 'standard',
  playoffSeriesLength: 7,
  playoffOvertimeFormat: '5v5',
  playoffOvertimeLength: 20,
  playoffShootout: false,
  playoffReseed: false,
  salaryCapEnabled: true,
  salaryCapAmount: 82_500_000,
  salaryFloor: 60_200_000,
  luxuryTaxEnabled: false,
  luxuryTaxRate: 0,
  maxContractYears: 8,
  minContractYears: 1,
  contractExtensionEnabled: true,
  frontLoadingAllowed: true,
  backDivingAllowed: false,
  noMoveClauses: true,
  noTradeClauses: true,

  // Contrats d'entrée (Entry-Level Contracts)
  elcEnabled: true,
  elcMaxSalary: 950_000,
  elcMaxBonus: 2_850_000,
  elcDuration18to21: 3,
  elcDuration22to23: 2,
  elcDuration24plus: 1,
  twoWayContractsEnabled: true,

  // Structure salariale
  salaryVariationLimit: 20,
  signingBonusMaxPercent: 60,
  performanceBonusesEnabled: true,
  deferredPaymentsAllowed: false,
  minimumNHLSalary: 775_000,

  // Clauses spéciales
  buyoutEnabled: true,
  buyoutRateOver26: 66.67,
  buyoutRateUnder26: 33.33,
  noMovementClausesEnabled: true,
  limitedNoTradeEnabled: true,

  // Arbitrage salarial
  salaryArbitrationEnabled: true,
  arbitrationEligibilityYears: 4,
  clubElectedArbitration: true,
  arbitrationDecisionBinding: true,

  // Blessures et assurances
  injuredReserveEnabled: true,
  irMinimumDays: 7,
  ltirEnabled: true,
  ltirMinimumDays: 24,
  ltirMinimumGames: 10,
  ltirCapRelief: true,
  healthInsuranceProvided: true,
  disabilityInsuranceProvided: true,

  // Retraite et pensions
  pensionEnabled: true,
  pensionYearsRequired: 10,
  earlyRetirementPenalty: true,
  capRecaptureRule: true,

  tradeDeadlineEnabled: true,
  tradeDeadlineDate: '03-03',
  tradeSalaryCap: true,
  tradeApproval: 'commissioner',
  tradeVetoEnabled: true,
  draftEnabled: true,
  draftRounds: 7,
  draftLottery: true,
  draftOrder: 'lottery',
  freeAgencyEnabled: true,
  restrictedFreeAgency: true,
  offerSheets: true,
  waiversEnabled: true,
  waiversClearTime: 24,
  rosterSize: 23,
  minRosterSize: 20,
  activeRosterSize: 20,
  injuredReserveSlots: 3,
  linesPerTeam: 4,
  defensePerLine: 2,
  goaltendersPerTeam: 2,
  injuriesEnabled: true,
  injuryFrequency: 'normal',
  injuryRecoveryTime: 'normal',
  fatigueEnabled: true,
  fatigueImpact: 'moyen',
  playerDevelopment: true,
  playerRegression: true,
  rookieDevelopmentBonus: true,
  ahlEnabled: true,
  ahlRosterSize: 25,
  callUpLimit: 4,
  trackIndividualStats: true,
  trackTeamStats: true,
  hallOfFame: true,
  retireJerseys: true,
  realisticLineChanges: true,
  realisticPenalties: true,
  homeIceAdvantage: true,
  homeIceAdvantagePercent: 5,
  simulationSpeed: 'normal',
  autoSimSchedule: false,
  gameMode: false,
  gameModeTeamId: null,
  weatherEffects: false,
  fanMorale: true,
  teamChemistry: true,
  coachRating: true,
}

export const DEFAULT_LEAGUE_RULES: LeagueRules = {
  aiRules: DEFAULT_AI_RULES,
  gameplayRules: DEFAULT_GAMEPLAY_RULES,
  leagueOptions: DEFAULT_LEAGUE_OPTIONS,
}
