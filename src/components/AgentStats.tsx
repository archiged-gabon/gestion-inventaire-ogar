import React, { useState, useMemo } from 'react';
import { AgentStats as AgentStatsType, AgentDailyStats as AgentDailyStatsType } from '@/hooks/useInventory';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  Badge
} from '@/components/ui';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

// Composant pour afficher la répartition par agence
const AgenceBreakdown: React.FC<{
  okala_total: number;
  site_okala_total: number;
  nzeng_ayong_total: number;
  pk9_total: number;
  owendo_total: number;
  espace_conseil_total: number;
}> = ({ 
  okala_total, 
  site_okala_total,
  nzeng_ayong_total, 
  pk9_total, 
  owendo_total, 
  espace_conseil_total 
}) => {
  const hasAny =
    okala_total > 0 ||
    site_okala_total > 0 ||
    nzeng_ayong_total > 0 ||
    pk9_total > 0 ||
    owendo_total > 0 ||
    espace_conseil_total > 0;

  return (
    <div className="space-y-1.5 text-xs">
      {!hasAny && (
        <div className="text-gray-500">0</div>
      )}
      {/* Okala */}
      {okala_total > 0 && (
        <div className="flex items-center justify-between bg-blue-50 rounded px-2 py-1">
          <span className="font-medium text-blue-900">Agence Okala</span>
          <span className="text-blue-800 font-semibold">{okala_total}</span>
        </div>
      )}

      {/* Site Okala */}
      {site_okala_total > 0 && (
        <div className="flex items-center justify-between bg-sky-50 rounded px-2 py-1">
          <span className="font-medium text-sky-900">Site Okala</span>
          <span className="text-sky-800 font-semibold">{site_okala_total}</span>
        </div>
      )}
      
      {/* Nzeng-Ayong */}
      {nzeng_ayong_total > 0 && (
        <div className="flex items-center justify-between bg-indigo-50 rounded px-2 py-1">
          <span className="font-medium text-indigo-900">Nzeng-Ayong</span>
          <span className="text-indigo-800 font-semibold">{nzeng_ayong_total}</span>
        </div>
      )}
      
      {/* PK9 */}
      {pk9_total > 0 && (
        <div className="flex items-center justify-between bg-purple-50 rounded px-2 py-1">
          <span className="font-medium text-purple-900">PK9</span>
          <span className="text-purple-800 font-semibold">{pk9_total}</span>
        </div>
      )}
      
      {/* Owendo */}
      {owendo_total > 0 && (
        <div className="flex items-center justify-between bg-cyan-50 rounded px-2 py-1">
          <span className="font-medium text-cyan-900">Owendo</span>
          <span className="text-cyan-800 font-semibold">{owendo_total}</span>
        </div>
      )}
      
      {/* Espace Conseil */}
      {espace_conseil_total > 0 && (
        <div className="flex items-center justify-between bg-teal-50 rounded px-2 py-1">
          <span className="font-medium text-teal-900">Espace Conseil</span>
          <span className="text-teal-800 font-semibold">{espace_conseil_total}</span>
        </div>
      )}
    </div>
  );
};

// Composant pour afficher la répartition par type de société
const SocieteTypeBreakdown: React.FC<{
  vie_total: number;
  vie_actifs: number;
  vie_resilies: number;
  iard_total: number;
  iard_actifs: number;
  iard_resilies: number;
  production_total: number;
  production_actifs: number;
  production_resilies: number;
  isDaily?: boolean;
}> = ({ 
  vie_total, vie_actifs, vie_resilies,
  iard_total, iard_actifs, iard_resilies,
  production_total, production_actifs, production_resilies,
  isDaily = false
}) => {
  const suffix = isDaily ? '_jour' : '';
  
  return (
    <div className="space-y-2 text-sm">
      {/* Vie */}
      {vie_total > 0 && (
        <div className="flex items-center justify-between bg-blue-50 rounded-lg px-3 py-2">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="font-medium text-blue-900">Vie</span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-blue-800 font-medium">{vie_total}</span>
            {vie_actifs > 0 && (
              <span className="text-green-700 text-xs">({vie_actifs} actifs)</span>
            )}
            {vie_resilies > 0 && (
              <span className="text-red-700 text-xs">({vie_resilies} résiliés)</span>
            )}
          </div>
        </div>
      )}
      
      {/* IARD */}
      {iard_total > 0 && (
        <div className="flex items-center justify-between bg-orange-50 rounded-lg px-3 py-2">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span className="font-medium text-orange-900">IARD</span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-orange-800 font-medium">{iard_total}</span>
            {iard_actifs > 0 && (
              <span className="text-green-700 text-xs">({iard_actifs} actifs)</span>
            )}
            {iard_resilies > 0 && (
              <span className="text-red-700 text-xs">({iard_resilies} résiliés)</span>
            )}
          </div>
        </div>
      )}
      
      {/* Production */}
      {production_total > 0 && (
        <div className="flex items-center justify-between bg-green-50 rounded-lg px-3 py-2">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="font-medium text-green-900">Production</span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-green-800 font-medium">{production_total}</span>
            {production_actifs > 0 && (
              <span className="text-green-700 text-xs">({production_actifs} actifs)</span>
            )}
            {production_resilies > 0 && (
              <span className="text-red-700 text-xs">({production_resilies} résiliés)</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface AgentStatsProps {
  stats: AgentStatsType[];
  dailyStats: AgentDailyStatsType[];
  isLoading: boolean;
  isLoadingDailyStats: boolean;
}

// Interface pour grouper les statistiques journalières par date
interface GroupedDailyStats {
  date: string;
  formattedDate: string;
  agents: {
    nom_agent_inventaire: string;
    total_jour: number;
    total_jour_actifs: number;
    total_jour_resilies: number;
    // Statistiques journalières par agence
    okala_total_jour: number;
    site_okala_total_jour: number;
    nzeng_ayong_total_jour: number;
    pk9_total_jour: number;
    owendo_total_jour: number;
    espace_conseil_total_jour: number;
    // Statistiques journalières par type de société
    vie_total_jour: number;
    vie_actifs_jour: number;
    vie_resilies_jour: number;
    iard_total_jour: number;
    iard_actifs_jour: number;
    iard_resilies_jour: number;
    production_total_jour: number;
    production_actifs_jour: number;
    production_resilies_jour: number;
  }[];
  totalJour: number;
}

export const AgentStats: React.FC<AgentStatsProps> = ({ 
  stats, 
  dailyStats, 
  isLoading,
  isLoadingDailyStats 
}) => {
  const [activeTab, setActiveTab] = useState<string>("global");
  
  // Normaliser un nom (minuscules, sans accents, espaces normalisés)
  const normalize = (str: string) =>
    (str || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ');

  // Clé de regroupement: normalisation + tri des tokens pour ignorer l'ordre des mots
  const tokenKey = (str: string) => {
    const n = normalize(str);
    const parts = n.split(' ').filter(Boolean);
    parts.sort();
    return parts.join(' ');
  };

  // Mappage d'alias explicites à fusionner (force la fusion même si les tokens diffèrent)
  const aliasMap = React.useMemo(() => {
    const map = new Map<string, string>();
    map.set(tokenKey('BIBANG Warren'), tokenKey('BIBANG ANGOMO Serge Warhen'));
    map.set(tokenKey('Joël Jésimièl OLOLO'), tokenKey('OLOLO Joel Jesimiel'));
    map.set(tokenKey("MA-N’FOURRE MOUSSAVOU Frédérique janel"), tokenKey("MA-N’FOURRE MOUSSAVOU Frédérique"));
    map.set(tokenKey("MA-N'FOURRE MOUSSAVOU Frédérique janel"), tokenKey("MA-N'FOURRE MOUSSAVOU Frédérique"));
    return map;
  }, [tokenKey]);

  // Fusionner les stats des agents ayant des variantes de nom (doublons)
  const mergedStats = useMemo(() => {
    const map = new Map<string, {
      nom_agent_inventaire: string;
      aliases: Set<string>;
      total: number;
      derniere_activite: string;
      total_actifs: number;
      total_resilies: number;
      okala_total: number;
      site_okala_total: number;
      nzeng_ayong_total: number;
      pk9_total: number;
      owendo_total: number;
      espace_conseil_total: number;
      vie_total: number;
      vie_actifs: number;
      vie_resilies: number;
      iard_total: number;
      iard_actifs: number;
      iard_resilies: number;
      production_total: number;
      production_actifs: number;
      production_resilies: number;
    }>();

    for (const s of stats) {
      const rawKey = tokenKey(s.nom_agent_inventaire);
      const key = aliasMap.get(rawKey) ?? rawKey;
      if (!map.has(key)) {
        map.set(key, {
          nom_agent_inventaire: s.nom_agent_inventaire,
          aliases: new Set([s.nom_agent_inventaire]),
          total: 0,
          derniere_activite: s.derniere_activite,
          total_actifs: 0,
          total_resilies: 0,
          okala_total: 0,
          site_okala_total: 0,
          nzeng_ayong_total: 0,
          pk9_total: 0,
          owendo_total: 0,
          espace_conseil_total: 0,
          vie_total: 0,
          vie_actifs: 0,
          vie_resilies: 0,
          iard_total: 0,
          iard_actifs: 0,
          iard_resilies: 0,
          production_total: 0,
          production_actifs: 0,
          production_resilies: 0,
        });
      }
      const m = map.get(key)!;
      m.aliases.add(s.nom_agent_inventaire);
      m.total += s.total;
      m.total_actifs += s.total_actifs;
      m.total_resilies += s.total_resilies;
      m.okala_total += s.okala_total;
      m.site_okala_total += s.site_okala_total;
      m.nzeng_ayong_total += s.nzeng_ayong_total;
      m.pk9_total += s.pk9_total;
      m.owendo_total += s.owendo_total;
      m.espace_conseil_total += s.espace_conseil_total;
      m.vie_total += s.vie_total;
      m.vie_actifs += s.vie_actifs;
      m.vie_resilies += s.vie_resilies;
      m.iard_total += s.iard_total;
      m.iard_actifs += s.iard_actifs;
      m.iard_resilies += s.iard_resilies;
      m.production_total += s.production_total;
      m.production_actifs += s.production_actifs;
      m.production_resilies += s.production_resilies;
      if (s.derniere_activite && (!m.derniere_activite || new Date(s.derniere_activite).getTime() > new Date(m.derniere_activite).getTime())) {
        m.derniere_activite = s.derniere_activite;
      }
      // Choisir le nom canonique le plus explicite (le plus long)
      const longest = [...m.aliases].reduce((a, b) => (a.length >= b.length ? a : b));
      m.nom_agent_inventaire = longest;
    }

    return [...map.values()].sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      return a.nom_agent_inventaire.localeCompare(b.nom_agent_inventaire);
    });
  }, [stats, tokenKey, aliasMap]);

  // Ne garder que les 4 agents cibles (après fusion des variantes)
  const focusAllowSet = useMemo(() => {
    const raw = [
      'BIBANG ANGOMO Serge Warhen',
      'Ndong Riwanou Nell Davy',
      'TINDI Sylvain',
      'OLOLO Joel Jesimiel'
    ];
    return new Set(raw.map((n) => tokenKey(n)));
  }, [tokenKey]);

  const mergedFocusedStats = useMemo(() => {
    return mergedStats.filter((s) => focusAllowSet.has(tokenKey(s.nom_agent_inventaire)));
  }, [mergedStats, focusAllowSet, tokenKey]);

  // Grouper les statistiques par date
  const groupedDailyStats = useMemo<GroupedDailyStats[]>(() => {
    const grouped: Record<string, GroupedDailyStats> = {};
    
    dailyStats.forEach(stat => {
      if (!grouped[stat.date_jour]) {
        grouped[stat.date_jour] = {
          date: stat.date_jour,
          formattedDate: format(new Date(stat.date_jour), "dd MMMM yyyy", { locale: fr }),
          agents: [],
          totalJour: 0
        };
      }
      
      grouped[stat.date_jour].agents.push({
        nom_agent_inventaire: stat.nom_agent_inventaire,
        total_jour: stat.total_jour,
        total_jour_actifs: stat.total_jour_actifs || 0,
        total_jour_resilies: stat.total_jour_resilies || 0,
        okala_total_jour: stat.okala_total_jour || 0,
        site_okala_total_jour: stat.site_okala_total_jour || 0,
        nzeng_ayong_total_jour: stat.nzeng_ayong_total_jour || 0,
        pk9_total_jour: stat.pk9_total_jour || 0,
        owendo_total_jour: stat.owendo_total_jour || 0,
        espace_conseil_total_jour: stat.espace_conseil_total_jour || 0,
        // Statistiques journalières par type de société
        vie_total_jour: stat.vie_total_jour || 0,
        vie_actifs_jour: stat.vie_actifs_jour || 0,
        vie_resilies_jour: stat.vie_resilies_jour || 0,
        iard_total_jour: stat.iard_total_jour || 0,
        iard_actifs_jour: stat.iard_actifs_jour || 0,
        iard_resilies_jour: stat.iard_resilies_jour || 0,
        production_total_jour: stat.production_total_jour || 0,
        production_actifs_jour: stat.production_actifs_jour || 0,
        production_resilies_jour: stat.production_resilies_jour || 0
      });
      
      grouped[stat.date_jour].totalJour += stat.total_jour;
    });
    
    // Convertir l'objet en tableau et trier par date (du plus récent au plus ancien)
    return Object.values(grouped).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [dailyStats]);

  // Afficher le chargement si l'une des données est en cours de chargement
  const isAnyLoading = isLoading || (activeTab === "daily" && isLoadingDailyStats);
  
  if (isAnyLoading) {
    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl border-2 border-gray-100 p-6 shadow-lg">
        <div className="flex justify-center items-center p-8">
          <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
          <span className="ml-4 text-gray-600 text-lg">Chargement des statistiques...</span>
        </div>
      </div>
    );
  }

  // Vérifier si les données sont disponibles en fonction de l'onglet actif
  const hasGlobalStats = mergedStats.length > 0;
  const hasDailyStats = groupedDailyStats.length > 0;
  const hasNoData = (activeTab === "global" && !hasGlobalStats) || (activeTab === "daily" && !hasDailyStats);

  if (hasNoData) {
    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl border-2 border-gray-100 p-6 shadow-lg">
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
            </svg>
          </div>
          <h3 className="text-lg font-apple-display font-semibold text-gray-900 mt-4">
            Aucune donnée statistique
          </h3>
          <p className="text-sm font-apple-text text-gray-600 max-w-md mx-auto mt-2">
            Les statistiques d'agents s'afficheront ici dès que des données seront disponibles.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl border-2 border-gray-100 overflow-hidden shadow-lg">
      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
        <h3 className="text-lg font-apple-display font-semibold text-gray-900">
          Statistiques d'activité des agents
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Suivi du nombre d'entrées effectuées par chaque agent
        </p>
      </div>

      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="w-full"
      >
        <div className="px-4 py-2 border-b border-gray-200">
          <TabsList className="bg-white/80">
            <TabsTrigger value="global">Vue globale</TabsTrigger>
            <TabsTrigger value="daily">Vue journalière</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="global" className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200 bg-gray-50/50">
                  <TableHead className="font-apple-text font-semibold text-gray-700">Nom de l'agent</TableHead>
                  <TableHead className="font-apple-text font-semibold text-gray-700 text-center">Nombre d'entrées</TableHead>
                  <TableHead className="font-apple-text font-semibold text-green-700 text-center">Contrats Actifs</TableHead>
                  <TableHead className="font-apple-text font-semibold text-red-700 text-center">Contrats Résiliés</TableHead>
                  <TableHead className="font-apple-text font-semibold text-gray-700 text-center">Répartition par agence</TableHead>
                  <TableHead className="font-apple-text font-semibold text-gray-700 text-center">Répartition par société</TableHead>
                  <TableHead className="font-apple-text font-semibold text-gray-700 text-right">Dernière activité</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mergedStats.map((stat) => (
                  <TableRow key={stat.nom_agent_inventaire} className="border-gray-100 hover:bg-blue-50/50 transition-colors duration-150">
                    <TableCell className="font-apple-text font-medium text-gray-900">
                      {stat.nom_agent_inventaire}
                    </TableCell>
                    <TableCell className="font-apple-text text-gray-700 text-center">
                      <span className="inline-flex items-center justify-center min-w-[2rem] px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium">
                        {stat.total}
                      </span>
                    </TableCell>
                    <TableCell className="font-apple-text text-green-700 text-center">
                      <span className="inline-flex items-center justify-center min-w-[2rem] px-2.5 py-0.5 rounded-full bg-green-100 text-green-800 font-medium">
                        {stat.total_actifs}
                      </span>
                    </TableCell>
                    <TableCell className="font-apple-text text-red-700 text-center">
                      <span className="inline-flex items-center justify-center min-w-[2rem] px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 font-medium">
                        {stat.total_resilies}
                      </span>
                    </TableCell>
                    
                    <TableCell className="font-apple-text text-gray-700 text-center">
                      <AgenceBreakdown
                        okala_total={stat.okala_total}
                        site_okala_total={stat.site_okala_total}
                        nzeng_ayong_total={stat.nzeng_ayong_total}
                        pk9_total={stat.pk9_total}
                        owendo_total={stat.owendo_total}
                        espace_conseil_total={stat.espace_conseil_total}
                      />
                    </TableCell>
                    <TableCell className="font-apple-text text-gray-700 text-center">
                      <SocieteTypeBreakdown
                        vie_total={stat.vie_total}
                        vie_actifs={stat.vie_actifs}
                        vie_resilies={stat.vie_resilies}
                        iard_total={stat.iard_total}
                        iard_actifs={stat.iard_actifs}
                        iard_resilies={stat.iard_resilies}
                        production_total={stat.production_total}
                        production_actifs={stat.production_actifs}
                        production_resilies={stat.production_resilies}
                      />
                    </TableCell>
                    <TableCell className="font-apple-text text-gray-700 text-right">
                      {format(new Date(stat.derniere_activite), "dd MMMM yyyy 'à' HH:mm", { locale: fr })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="daily" className="p-0">
          <div className="p-4">
            <Accordion type="single" collapsible className="w-full">
              {groupedDailyStats.map((dayGroup) => (
                <AccordionItem 
                  key={dayGroup.date} 
                  value={dayGroup.date}
                  className="border border-gray-200 rounded-lg mb-3 overflow-hidden"
                >
                  <AccordionTrigger className="px-4 py-3 bg-gray-50 hover:bg-gray-100 hover:no-underline">
                    <div className="flex justify-between items-center w-full pr-4">
                      <div className="font-apple-display font-medium text-gray-900">
                        {dayGroup.formattedDate}
                      </div>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                        {dayGroup.totalJour} entrée{dayGroup.totalJour > 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-gray-200 bg-gray-50/30">
                            <TableHead className="font-apple-text font-semibold text-gray-700">Nom de l'agent</TableHead>
                            <TableHead className="font-apple-text font-semibold text-gray-700 text-center">Nombre d'entrées</TableHead>
                            <TableHead className="font-apple-text font-semibold text-green-700 text-center">Actifs</TableHead>
                            <TableHead className="font-apple-text font-semibold text-red-700 text-center">Résiliés</TableHead>
                            <TableHead className="font-apple-text font-semibold text-gray-700 text-center">Répartition par société</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {dayGroup.agents
                            .sort((a, b) => b.total_jour - a.total_jour) // Trier par nombre d'entrées décroissant
                            .map((agent) => (
                            <TableRow key={`${dayGroup.date}-${agent.nom_agent_inventaire}`} className="border-gray-100 hover:bg-blue-50/30 transition-colors duration-150">
                              <TableCell className="font-apple-text text-gray-900">
                                {agent.nom_agent_inventaire}
                              </TableCell>
                              <TableCell className="font-apple-text text-gray-700 text-center">
                                <span className="inline-flex items-center justify-center min-w-[2rem] px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium">
                                  {agent.total_jour}
                                </span>
                              </TableCell>
                              <TableCell className="font-apple-text text-green-700 text-center">
                                <span className="inline-flex items-center justify-center min-w-[2rem] px-2.5 py-0.5 rounded-full bg-green-100 text-green-800 font-medium">
                                  {agent.total_jour_actifs}
                                </span>
                              </TableCell>
                              <TableCell className="font-apple-text text-red-700 text-center">
                                <span className="inline-flex items-center justify-center min-w-[2rem] px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 font-medium">
                                  {agent.total_jour_resilies}
                                </span>
                              </TableCell>
                              
                              <TableCell className="font-apple-text text-gray-700 text-center">
                                <SocieteTypeBreakdown
                                  vie_total={agent.vie_total_jour}
                                  vie_actifs={agent.vie_actifs_jour}
                                  vie_resilies={agent.vie_resilies_jour}
                                  iard_total={agent.iard_total_jour}
                                  iard_actifs={agent.iard_actifs_jour}
                                  iard_resilies={agent.iard_resilies_jour}
                                  production_total={agent.production_total_jour}
                                  production_actifs={agent.production_actifs_jour}
                                  production_resilies={agent.production_resilies_jour}
                                  isDaily={true}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};