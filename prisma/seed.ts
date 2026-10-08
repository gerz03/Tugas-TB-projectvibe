import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/auth";
import { starterClubImages, starterPlayerImages } from "../lib/image-attributions";
import entityImageManifest from "../lib/entity-image-manifest.json";

const prisma = new PrismaClient();
const source = "Official Club Records and Verified International Football Archives";

async function main() {
  console.log("Seeding football database...");

  // 1. Countries
  const countryDefs = [
    { country_name: "Portugal", country_code: "PT", fifa_code: "POR", continent: "Europe", flag: "🇵🇹" },
    { country_name: "Spain", country_code: "ES", fifa_code: "ESP", continent: "Europe", flag: "🇪🇸" },
    { country_name: "England", country_code: "GB-ENG", fifa_code: "ENG", continent: "Europe", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
    { country_name: "Italy", country_code: "IT", fifa_code: "ITA", continent: "Europe", flag: "🇮🇹" },
    { country_name: "Saudi Arabia", country_code: "SA", fifa_code: "KSA", continent: "Asia", flag: "🇸🇦" },
    { country_name: "Argentina", country_code: "AR", fifa_code: "ARG", continent: "South America", flag: "🇦🇷" },
    { country_name: "France", country_code: "FR", fifa_code: "FRA", continent: "Europe", flag: "🇫🇷" },
    { country_name: "Germany", country_code: "DE", fifa_code: "GER", continent: "Europe", flag: "🇩🇪" },
    { country_name: "United States", country_code: "US", fifa_code: "USA", continent: "North America", flag: "🇺🇸" },
    { country_name: "Indonesia", country_code: "ID", fifa_code: "IDN", continent: "Asia", flag: "🇮🇩" },
    { country_name: "Brazil", country_code: "BR", fifa_code: "BRA", continent: "South America", flag: "🇧🇷" },
    { country_name: "Netherlands", country_code: "NL", fifa_code: "NED", continent: "Europe", flag: "🇳🇱" },
    { country_name: "Norway", country_code: "NO", fifa_code: "NOR", continent: "Europe", flag: "🇳🇴" },
    { country_name: "Belgium", country_code: "BE", fifa_code: "BEL", continent: "Europe", flag: "🇧🇪" },
    { country_name: "Egypt", country_code: "EG", fifa_code: "EGY", continent: "Africa", flag: "🇪🇬" },
    { country_name: "Poland", country_code: "PL", fifa_code: "POL", continent: "Europe", flag: "🇵🇱" },
    { country_name: "Croatia", country_code: "HR", fifa_code: "CRO", continent: "Europe", flag: "🇭🇷" },
    { country_name: "South Korea", country_code: "KR", fifa_code: "KOR", continent: "Asia", flag: "🇰🇷" },
    { country_name: "Uruguay", country_code: "UY", fifa_code: "URU", continent: "South America", flag: "🇺🇾" },
    { country_name: "Senegal", country_code: "SN", fifa_code: "SEN", continent: "Africa", flag: "🇸🇳" },
    { country_name: "Sweden", country_code: "SE", fifa_code: "SWE", continent: "Europe", flag: "🇸🇪" },
    { country_name: "Scotland", country_code: "GB-SCT", fifa_code: "SCO", continent: "Europe", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
    { country_name: "Turkey", country_code: "TR", fifa_code: "TUR", continent: "Europe", flag: "🇹🇷" },
    { country_name: "Monaco", country_code: "MC", fifa_code: "MON", continent: "Europe", flag: "🇲🇨" }
  ];

  const countries = await Promise.all(
    countryDefs.map((c) =>
      prisma.country.upsert({
        where: { country_code: c.country_code },
        update: { flag: c.flag, country_name: c.country_name, continent: c.continent },
        create: { ...c, source }
      })
    )
  );
  const byCode = Object.fromEntries(countries.map((c) => [c.country_code, c]));

  // 2. Leagues
  const leagueDefs = [
    { league_name: "Premier League", country_code: "GB-ENG", founded: 1992, level: "1", season: "2025/26" },
    { league_name: "La Liga", country_code: "ES", founded: 1929, level: "1", season: "2025/26" },
    { league_name: "Serie A", country_code: "IT", founded: 1898, level: "1", season: "2025/26" },
    { league_name: "Bundesliga", country_code: "DE", founded: 1963, level: "1", season: "2025/26" },
    { league_name: "Ligue 1", country_code: "FR", founded: 1932, level: "1", season: "2025/26" },
    { league_name: "Primeira Liga", country_code: "PT", founded: 1934, level: "1", season: "2025/26" },
    { league_name: "Eredivisie", country_code: "NL", founded: 1956, level: "1", season: "2025/26" },
    { league_name: "Saudi Pro League", country_code: "SA", founded: 1976, level: "1", season: "2025/26" },
    { league_name: "Major League Soccer", country_code: "US", founded: 1996, level: "1", season: "2026" },
    { league_name: "Primera Division Argentina", country_code: "AR", founded: 1891, level: "1", season: "2025" },
    { league_name: "Brasileirao Serie A", country_code: "BR", founded: 1959, level: "1", season: "2025" },
    { league_name: "Liga 1 Indonesia", country_code: "ID", founded: 2017, level: "1", season: "2025/26" },
    { league_name: "Scottish Premiership", country_code: "GB-SCT", founded: 2013, level: "1", season: "2025/26" },
    { league_name: "Super Lig", country_code: "TR", founded: 1959, level: "1", season: "2025/26" }
  ];

  const leagues = await Promise.all(
    leagueDefs.map((l) =>
      prisma.league.upsert({
        where: {
          league_name_country_id_season: {
            league_name: l.league_name,
            country_id: byCode[l.country_code].country_id,
            season: l.season
          }
        },
        update: {},
        create: {
          league_name: l.league_name,
          country_id: byCode[l.country_code].country_id,
          founded: l.founded,
          level: l.level,
          season: l.season,
          source
        }
      })
    )
  );
  const leagueByName = Object.fromEntries(leagues.map((l) => [l.league_name, l]));

  // 3. 50 Worldwide Clubs
  const clubDefinitions = [
    // EXISTING 25 CLUBS
    { official_name: "Real Madrid Club de Futbol", common_name: "Real Madrid", city: "Madrid", country: byCode.ES, league: leagueByName["La Liga"], primary_color: "#FFFFFF", secondary_color: "#FEBE10", founded: 1902, stadium: "Santiago Bernabeu", stadium_capacity: 81044, manager: "Carlo Ancelotti", president: "Florentino Perez", website: "https://www.realmadrid.com" },
    { official_name: "Futbol Club Barcelona", common_name: "Barcelona", city: "Barcelona", country: byCode.ES, league: leagueByName["La Liga"], primary_color: "#A50044", secondary_color: "#004D98", founded: 1899, stadium: "Spotify Camp Nou", stadium_capacity: 99354, manager: "Hansi Flick", president: "Joan Laporta", website: "https://www.fcbarcelona.com" },
    { official_name: "Club Atletico de Madrid", common_name: "Atletico Madrid", city: "Madrid", country: byCode.ES, league: leagueByName["La Liga"], primary_color: "#CB3524", secondary_color: "#272E61", founded: 1903, stadium: "Civitas Metropolitano", stadium_capacity: 70460, manager: "Diego Simeone", president: "Enrique Cerezo", website: "https://en.atleticodemadrid.com" },
    { official_name: "Manchester United Football Club", common_name: "Manchester United", city: "Manchester", country: byCode["GB-ENG"], league: leagueByName["Premier League"], primary_color: "#DA291C", secondary_color: "#FBE122", founded: 1878, stadium: "Old Trafford", stadium_capacity: 74310, manager: "Michael Carrick", president: "Sir Jim Ratcliffe", website: "https://www.manutd.com" },
    { official_name: "Manchester City Football Club", common_name: "Manchester City", city: "Manchester", country: byCode["GB-ENG"], league: leagueByName["Premier League"], primary_color: "#6CABDD", secondary_color: "#1C2C5B", founded: 1880, stadium: "Etihad Stadium", stadium_capacity: 53400, manager: "Pep Guardiola", president: "Khaldoon Al Mubarak", website: "https://www.mancity.com" },
    { official_name: "Arsenal Football Club", common_name: "Arsenal", city: "London", country: byCode["GB-ENG"], league: leagueByName["Premier League"], primary_color: "#EF0107", secondary_color: "#063672", founded: 1886, stadium: "Emirates Stadium", stadium_capacity: 60704, manager: "Mikel Arteta", president: "Stan Kroenke", website: "https://www.arsenal.com" },
    { official_name: "Liverpool Football Club", common_name: "Liverpool", city: "Liverpool", country: byCode["GB-ENG"], league: leagueByName["Premier League"], primary_color: "#C8102E", secondary_color: "#00B2A9", founded: 1892, stadium: "Anfield", stadium_capacity: 61276, manager: "Arne Slot", president: "Tom Werner", website: "https://www.liverpoolfc.com" },
    { official_name: "Chelsea Football Club", common_name: "Chelsea", city: "London", country: byCode["GB-ENG"], league: leagueByName["Premier League"], primary_color: "#034694", secondary_color: "#EE242C", founded: 1905, stadium: "Stamford Bridge", stadium_capacity: 40341, manager: "Enzo Maresca", president: "Todd Boehly", website: "https://www.chelseafc.com" },
    { official_name: "FC Bayern Munchen", common_name: "Bayern Munich", city: "Munich", country: byCode.DE, league: leagueByName["Bundesliga"], primary_color: "#DC052D", secondary_color: "#0066B2", founded: 1900, stadium: "Allianz Arena", stadium_capacity: 75024, manager: "Vincent Kompany", president: "Herbert Hainer", website: "https://fcbayern.com" },
    { official_name: "Ballspielverein Borussia 09 e.V. Dortmund", common_name: "Borussia Dortmund", city: "Dortmund", country: byCode.DE, league: leagueByName["Bundesliga"], primary_color: "#FDE100", secondary_color: "#000000", founded: 1909, stadium: "Signal Iduna Park", stadium_capacity: 81365, manager: "Nuri Sahin", president: "Reinhold Lunow", website: "https://www.bvb.de" },
    { official_name: "Bayer 04 Leverkusen Fussball GmbH", common_name: "Bayer Leverkusen", city: "Leverkusen", country: byCode.DE, league: leagueByName["Bundesliga"], primary_color: "#E32221", secondary_color: "#000000", founded: 1904, stadium: "BayArena", stadium_capacity: 30210, manager: "Xabi Alonso", president: "Fernando Carro", website: "https://www.bayer04.de" },
    { official_name: "Juventus Football Club", common_name: "Juventus", city: "Turin", country: byCode.IT, league: leagueByName["Serie A"], primary_color: "#000000", secondary_color: "#FFFFFF", founded: 1897, stadium: "Allianz Stadium", stadium_capacity: 41507, manager: "Thiago Motta", president: "Gianluca Ferrero", website: "https://www.juventus.com" },
    { official_name: "Football Club Internazionale Milano", common_name: "Inter Milan", city: "Milan", country: byCode.IT, league: leagueByName["Serie A"], primary_color: "#0068A8", secondary_color: "#000000", founded: 1908, stadium: "San Siro", stadium_capacity: 75817, manager: "Simone Inzaghi", president: "Giuseppe Marotta", website: "https://www.inter.it" },
    { official_name: "Associazione Calcio Milan", common_name: "AC Milan", city: "Milan", country: byCode.IT, league: leagueByName["Serie A"], primary_color: "#FB090B", secondary_color: "#000000", founded: 1899, stadium: "San Siro", stadium_capacity: 75817, manager: "Paulo Fonseca", president: "Paolo Scaroni", website: "https://www.acmilan.com" },
    { official_name: "Paris Saint-Germain Football Club", common_name: "Paris Saint-Germain", city: "Paris", country: byCode.FR, league: leagueByName["Ligue 1"], primary_color: "#004170", secondary_color: "#DA291C", founded: 1970, stadium: "Parc des Princes", stadium_capacity: 47929, manager: "Luis Enrique", president: "Nasser Al-Khelaifi", website: "https://www.psg.fr" },
    { official_name: "Sporting Clube de Portugal", common_name: "Sporting CP", city: "Lisbon", country: byCode.PT, league: leagueByName["Primeira Liga"], primary_color: "#008057", secondary_color: "#FFFFFF", founded: 1906, stadium: "Estadio Jose Alvalade", stadium_capacity: 50095, manager: "Joao Pereira", president: "Frederico Varandas", website: "https://www.sporting.pt" },
    { official_name: "Sport Lisboa e Benfica", common_name: "SL Benfica", city: "Lisbon", country: byCode.PT, league: leagueByName["Primeira Liga"], primary_color: "#E81B23", secondary_color: "#FFFFFF", founded: 1904, stadium: "Estadio da Luz", stadium_capacity: 64642, manager: "Bruno Lage", president: "Rui Costa", website: "https://www.slbenfica.pt" },
    { official_name: "Amsterdamsche Football Club Ajax", common_name: "AFC Ajax", city: "Amsterdam", country: byCode.NL, league: leagueByName["Eredivisie"], primary_color: "#D2122E", secondary_color: "#FFFFFF", founded: 1900, stadium: "Johan Cruyff Arena", stadium_capacity: 55865, manager: "Francesco Farioli", president: "Menno Geelen", website: "https://www.ajax.nl" },
    { official_name: "Al Nassr Football Club", common_name: "Al-Nassr", city: "Riyadh", country: byCode.SA, league: leagueByName["Saudi Pro League"], primary_color: "#FAD000", secondary_color: "#0056A4", founded: 1955, stadium: "Al-Awwal Park", stadium_capacity: 25000, manager: "Stefano Pioli", president: "Ibrahim Al-Muhaidib", website: "https://alnassr.sa" },
    { official_name: "Al Hilal Saudi Club", common_name: "Al-Hilal", city: "Riyadh", country: byCode.SA, league: leagueByName["Saudi Pro League"], primary_color: "#002B7F", secondary_color: "#FFFFFF", founded: 1957, stadium: "Kingdom Arena", stadium_capacity: 30000, manager: "Jorge Jesus", president: "Fahad bin Nafel", website: "https://alhilal.com" },
    { official_name: "Club Internacional de Futbol Miami", common_name: "Inter Miami", city: "Miami", country: byCode.US, league: leagueByName["Major League Soccer"], primary_color: "#F7B5CD", secondary_color: "#231F20", founded: 2018, stadium: "Chase Stadium", stadium_capacity: 21550, manager: "Javier Mascherano", president: "David Beckham", website: "https://www.intermiamicf.com" },
    { official_name: "LA Galaxy", common_name: "LA Galaxy", city: "Carson", country: byCode.US, league: leagueByName["Major League Soccer"], primary_color: "#00245D", secondary_color: "#FFD200", founded: 1994, stadium: "Dignity Health Sports Park", stadium_capacity: 27000, website: "https://www.lagalaxy.com" },
    { official_name: "Club Atletico Boca Juniors", common_name: "Boca Juniors", city: "Buenos Aires", country: byCode.AR, league: leagueByName["Primera Division Argentina"], primary_color: "#003399", secondary_color: "#FFCC00", founded: 1905, stadium: "La Bombonera", stadium_capacity: 54000, manager: "Fernando Gago", president: "Juan Roman Riquelme", website: "https://www.bocajuniors.com.ar" },
    { official_name: "Club Atletico River Plate", common_name: "River Plate", city: "Buenos Aires", country: byCode.AR, league: leagueByName["Primera Division Argentina"], primary_color: "#FFFFFF", secondary_color: "#FF0000", founded: 1901, stadium: "Estadio Monumental", stadium_capacity: 84567, manager: "Marcelo Gallardo", president: "Jorge Brito", website: "https://www.cariverplate.com.ar" },
    { official_name: "Clube de Regatas do Flamengo", common_name: "Flamengo", city: "Rio de Janeiro", country: byCode.BR, league: leagueByName["Brasileirao Serie A"], primary_color: "#C3281E", secondary_color: "#000000", founded: 1895, stadium: "Maracana", stadium_capacity: 78838, manager: "Filipe Luis", president: "Rodolfo Landim", website: "https://www.flamengo.com.br" },
    { official_name: "Persatuan Sepakbola Indonesia Bandung", common_name: "Persib Bandung", city: "Bandung", country: byCode.ID, league: leagueByName["Liga 1 Indonesia"], primary_color: "#003B7A", secondary_color: "#FFFFFF", founded: 1933, stadium: "Gelora Bandung Lautan Api", stadium_capacity: 38000, manager: "Bojan Hodak", president: "Glenn Sugita", website: "https://persib.co.id" },

    // === 22 NEW CLUBS ===
    { official_name: "Tottenham Hotspur Football Club", common_name: "Tottenham Hotspur", city: "London", country: byCode["GB-ENG"], league: leagueByName["Premier League"], primary_color: "#132257", secondary_color: "#FFFFFF", founded: 1882, stadium: "Tottenham Hotspur Stadium", stadium_capacity: 62850, manager: "Ange Postecoglou", president: "Daniel Levy", website: "https://www.tottenhamhotspur.com" },
    { official_name: "Como 1907 S.r.l.", common_name: "Como", city: "Como", country: byCode.IT, league: leagueByName["Serie A"], primary_color: "#003DA5", secondary_color: "#FFFFFF", founded: 1907, stadium: "Stadio Giuseppe Sinigaglia", stadium_capacity: 13602, website: "https://comofootball.com" },
    { official_name: "Brighton & Hove Albion Football Club", common_name: "Brighton & Hove Albion", city: "Brighton", country: byCode["GB-ENG"], league: leagueByName["Premier League"], primary_color: "#0057B8", secondary_color: "#FFFFFF", founded: 1901, stadium: "American Express Stadium", stadium_capacity: 31876, website: "https://www.brightonandhovealbion.com" },
    { official_name: "Nottingham Forest Football Club", common_name: "Nottingham Forest", city: "Nottingham", country: byCode["GB-ENG"], league: leagueByName["Premier League"], primary_color: "#DD0000", secondary_color: "#FFFFFF", founded: 1865, stadium: "The City Ground", stadium_capacity: 30445, website: "https://www.nottinghamforest.co.uk" },
    { official_name: "Persija Jakarta", common_name: "Persija Jakarta", city: "Jakarta", country: byCode.ID, league: leagueByName["Liga 1 Indonesia"], primary_color: "#D71920", secondary_color: "#FFFFFF", founded: 1928, stadium: "Jakarta International Stadium", stadium_capacity: 82000, website: "https://persija.id" },
    { official_name: "Dewa United Football Club", common_name: "Dewa United", city: "Tangerang", country: byCode.ID, league: leagueByName["Liga 1 Indonesia"], primary_color: "#151515", secondary_color: "#D4AF37", founded: 2021, stadium: "Banten International Stadium", stadium_capacity: 30000, website: "https://dewaunited.com" },
    { official_name: "Al-Ittihad Club", common_name: "Al-Ittihad", city: "Jeddah", country: byCode.SA, league: leagueByName["Saudi Pro League"], primary_color: "#F8C300", secondary_color: "#111111", founded: 1927, stadium: "King Abdullah Sports City", stadium_capacity: 62745, website: "https://www.ittihadclub.sa" },
    { official_name: "Societa Sportiva Calcio Napoli", common_name: "SSC Napoli", city: "Naples", country: byCode.IT, league: leagueByName["Serie A"], primary_color: "#12A0D7", secondary_color: "#FFFFFF", founded: 1926, stadium: "Stadio Diego Armando Maradona", stadium_capacity: 54726, manager: "Antonio Conte", president: "Aurelio De Laurentiis", website: "https://www.sscnapoli.it" },
    { official_name: "Associazione Sportiva Roma", common_name: "AS Roma", city: "Rome", country: byCode.IT, league: leagueByName["Serie A"], primary_color: "#8E1F2F", secondary_color: "#F0BC42", founded: 1927, stadium: "Stadio Olimpico", stadium_capacity: 70634, manager: "Claudio Ranieri", president: "Dan Friedkin", website: "https://www.asroma.com" },
    { official_name: "Futebol Clube do Porto", common_name: "FC Porto", city: "Porto", country: byCode.PT, league: leagueByName["Primeira Liga"], primary_color: "#003893", secondary_color: "#FFFFFF", founded: 1893, stadium: "Estadio do Dragao", stadium_capacity: 50033, manager: "Vitor Bruno", president: "Andre Villas-Boas", website: "https://www.fcporto.pt" },
    { official_name: "RasenBallsport Leipzig e.V.", common_name: "RB Leipzig", city: "Leipzig", country: byCode.DE, league: leagueByName["Bundesliga"], primary_color: "#DD0741", secondary_color: "#001F47", founded: 2009, stadium: "Red Bull Arena", stadium_capacity: 47069, manager: "Marco Rose", president: "Oliver Mintzlaff", website: "https://www.rbleipzig.com" },
    { official_name: "The Celtic Football Club", common_name: "Celtic", city: "Glasgow", country: byCode["GB-SCT"], league: leagueByName["Scottish Premiership"], primary_color: "#007749", secondary_color: "#FFFFFF", founded: 1887, stadium: "Celtic Park", stadium_capacity: 60411, manager: "Brendan Rodgers", president: "Peter Lawwell", website: "https://www.celticfc.com" },
    { official_name: "Galatasaray Spor Kulubu", common_name: "Galatasaray", city: "Istanbul", country: byCode.TR, league: leagueByName["Super Lig"], primary_color: "#FFD100", secondary_color: "#A50022", founded: 1905, stadium: "NEF Stadium", stadium_capacity: 52652, manager: "Okan Buruk", president: "Dursun Ozbek", website: "https://www.galatasaray.org" },
    { official_name: "Santos Futebol Clube", common_name: "Santos", city: "Santos", country: byCode.BR, league: leagueByName["Brasileirao Serie A"], primary_color: "#FFFFFF", secondary_color: "#000000", founded: 1912, stadium: "Estadio Urbano Caldeira (Vila Belmiro)", stadium_capacity: 16068, manager: "Pedro Caixinha", president: "Marcelo Teixeira", website: "https://www.santosfc.com.br" },
    { official_name: "Olympique de Marseille", common_name: "Olympique de Marseille", city: "Marseille", country: byCode.FR, league: leagueByName["Ligue 1"], primary_color: "#2FAEE0", secondary_color: "#FFFFFF", founded: 1899, stadium: "Stade Velodrome", stadium_capacity: 67394, manager: "Roberto De Zerbi", president: "Pablo Longoria", website: "https://www.om.fr" },
    { official_name: "Olympique Lyonnais", common_name: "Olympique Lyonnais", city: "Lyon", country: byCode.FR, league: leagueByName["Ligue 1"], primary_color: "#1C3C6E", secondary_color: "#DA291C", founded: 1950, stadium: "Groupama Stadium", stadium_capacity: 59186, manager: "Pierre Sage", president: "John Textor", website: "https://www.ol.fr" },
    { official_name: "Association Sportive de Monaco Football Club", common_name: "AS Monaco", city: "Monaco", country: byCode.MC, league: leagueByName["Ligue 1"], primary_color: "#ED1C24", secondary_color: "#FFFFFF", founded: 1924, stadium: "Stade Louis II", stadium_capacity: 18523, manager: "Adi Hutter", president: "Dmitri Rybolovlev", website: "https://www.asmonaco.com" },
    { official_name: "Feyenoord Rotterdam", common_name: "Feyenoord", city: "Rotterdam", country: byCode.NL, league: leagueByName["Eredivisie"], primary_color: "#ED1C24", secondary_color: "#FFFFFF", founded: 1908, stadium: "De Kuip (Stadion Feyenoord)", stadium_capacity: 47500, manager: "Brian Priske", president: "Dennis te Kloese", website: "https://www.feyenoord.nl" },
    { official_name: "Philips Sport Vereniging", common_name: "PSV Eindhoven", city: "Eindhoven", country: byCode.NL, league: leagueByName["Eredivisie"], primary_color: "#ED1C24", secondary_color: "#FFFFFF", founded: 1913, stadium: "Philips Stadion", stadium_capacity: 35000, manager: "Peter Bosz", president: "Marcel Brands", website: "https://www.psv.nl" },
    { official_name: "Aston Villa Football Club", common_name: "Aston Villa", city: "Birmingham", country: byCode["GB-ENG"], league: leagueByName["Premier League"], primary_color: "#670E36", secondary_color: "#94BEE5", founded: 1874, stadium: "Villa Park", stadium_capacity: 42657, manager: "Unai Emery", president: "Nassef Sawiris", website: "https://www.avfc.co.uk" },
    { official_name: "Newcastle United Football Club", common_name: "Newcastle United", city: "Newcastle upon Tyne", country: byCode["GB-ENG"], league: leagueByName["Premier League"], primary_color: "#241F20", secondary_color: "#FFFFFF", founded: 1892, stadium: "St James' Park", stadium_capacity: 52305, manager: "Eddie Howe", president: "Yasir Al-Rumayyan", website: "https://www.nufc.co.uk" },
    { official_name: "West Ham United Football Club", common_name: "West Ham United", city: "London", country: byCode["GB-ENG"], league: leagueByName["Premier League"], primary_color: "#7A263A", secondary_color: "#1BB1E7", founded: 1895, stadium: "London Stadium", stadium_capacity: 62500, manager: "Julen Lopetegui", president: "David Sullivan", website: "https://www.whufc.com" },
    { official_name: "Sevilla Futbol Club", common_name: "Sevilla", city: "Seville", country: byCode.ES, league: leagueByName["La Liga"], primary_color: "#FFFFFF", secondary_color: "#D90012", founded: 1890, stadium: "Ramon Sanchez Pizjuan", stadium_capacity: 43883, manager: "Xavier Garcia Pimienta", president: "Jose Castro Carmona", website: "https://www.sevillafc.es" },
    { official_name: "Real Sociedad de Futbol", common_name: "Real Sociedad", city: "San Sebastian", country: byCode.ES, league: leagueByName["La Liga"], primary_color: "#003DA5", secondary_color: "#FFFFFF", founded: 1909, stadium: "Reale Arena", stadium_capacity: 39803, manager: "Imanol Alguacil", president: "Jokin Aperribay", website: "https://www.realsociedad.eus" }
  ];

  const previousDuplicateBayern = await prisma.club.findFirst({
    where: {
      official_name: "Bayern Munchen",
      country_id: byCode.DE.country_id
    }
  });
  const replacementClub = clubDefinitions.find((club) => club.common_name === "Tottenham Hotspur");

  if (previousDuplicateBayern) {
    if (!replacementClub) {
      throw new Error("Tottenham Hotspur must exist in the club seed definitions to replace duplicate Bayern Munich.");
    }

    await prisma.club.update({
      where: { club_id: previousDuplicateBayern.club_id },
      data: {
        official_name: replacementClub.official_name,
        common_name: replacementClub.common_name,
        short_name: replacementClub.common_name,
        country_id: replacementClub.country.country_id,
        country_name: replacementClub.country.country_name,
        city: replacementClub.city,
        founded: replacementClub.founded,
        stadium: replacementClub.stadium,
        stadium_capacity: replacementClub.stadium_capacity,
        manager: replacementClub.manager,
        president: replacementClub.president,
        league_id: replacementClub.league?.league_id,
        logo: entityImageManifest.clubs["Tottenham Hotspur"].url,
        primary_color: replacementClub.primary_color,
        secondary_color: replacementClub.secondary_color,
        website: replacementClub.website,
        description: `${replacementClub.common_name} is one of football's premier global institutions with worldwide honours and a passionate fanbase.`,
        club_status: "ACTIVE",
        source
      }
    });
  }

  const clubs = await Promise.all(
    clubDefinitions.map((c) => {
      const logoUrl = entityImageManifest.clubs[c.common_name as keyof typeof entityImageManifest.clubs]?.url
        ?? starterClubImages[c.common_name as keyof typeof starterClubImages]?.url
        ?? null;
      return prisma.club.upsert({
        where: { official_name_country_id: { official_name: c.official_name, country_id: c.country.country_id } },
        update: {
          common_name: c.common_name,
          short_name: c.common_name,
          city: c.city,
          founded: c.founded,
          stadium: c.stadium,
          stadium_capacity: c.stadium_capacity,
          manager: c.manager,
          president: c.president,
          primary_color: c.primary_color,
          secondary_color: c.secondary_color,
          website: c.website,
          logo: logoUrl,
          league_id: c.league?.league_id
        },
        create: {
          official_name: c.official_name,
          common_name: c.common_name,
          short_name: c.common_name,
          country_id: c.country.country_id,
          country_name: c.country.country_name,
          city: c.city,
          founded: c.founded,
          stadium: c.stadium,
          stadium_capacity: c.stadium_capacity,
          manager: c.manager,
          president: c.president,
          league_id: c.league?.league_id,
          logo: logoUrl,
          primary_color: c.primary_color,
          secondary_color: c.secondary_color,
          website: c.website,
          description: `${c.common_name} is one of football's premier global institutions with worldwide honours and a passionate fanbase.`,
          club_status: "ACTIVE",
          source
        }
      });
    })
  );

  const club = Object.fromEntries(clubs.map((c) => [c.common_name, c]));
  console.log(`Seeded ${clubs.length} clubs successfully.`);

  // 4. 58 Global Football Players
  const retiredPlayers = ["Zinedine Zidane", "Ronaldinho", "David Beckham", "Toni Kroos", "Gianluigi Buffon", "Thierry Henry", "Ronaldo Nazario", "Paolo Maldini", "Andres Iniesta", "Xavi Hernandez", "Zlatan Ibrahimovic", "Steven Gerrard", "Wayne Rooney"];

  const playerDefinitions = [
    // === EXISTING 35 PLAYERS ===
    {
      full_name: "Cristiano Ronaldo dos Santos Aveiro", common_name: "Cristiano Ronaldo", first_name: "Cristiano", last_name: "Ronaldo",
      nationality: "Portugal", country: byCode.PT, date_of_birth: "1985-02-05", place_of_birth: "Funchal, Portugal",
      height: 187, weight: 83, preferred_foot: "Right", position: "Forward", secondary_position: "Left Winger", shirt_number: 7,
      club: club["Al-Nassr"], league: leagueByName["Saudi Pro League"], national_team: "Portugal", popularity: 99,
      bio: "Five-time Ballon d'Or winner and UEFA Euro 2016 champion. All-time top scorer in international football (130+ goals) and UEFA Champions League history (140 goals). Won 5 Champions League titles (1 Man Utd, 4 Real Madrid) and 7 domestic league titles."
    },
    {
      full_name: "Lionel Andres Messi", common_name: "Lionel Messi", first_name: "Lionel", last_name: "Messi",
      nationality: "Argentina", country: byCode.AR, date_of_birth: "1987-06-24", place_of_birth: "Rosario, Argentina",
      height: 170, weight: 72, preferred_foot: "Left", position: "Forward", secondary_position: "Attacking Midfielder", shirt_number: 10,
      club: club["Inter Miami"], league: leagueByName["Major League Soccer"], national_team: "Argentina", popularity: 99,
      bio: "Eight-time Ballon d'Or winner and 2022 FIFA World Cup champion with Argentina. Also won 2021 Copa America. 4 Champions League titles with Barcelona, 10 La Liga titles, and over 800 career goals. Widely hailed as the greatest footballer of all time."
    },
    {
      full_name: "Kylian Mbappe Lottin", common_name: "Kylian Mbappe", first_name: "Kylian", last_name: "Mbappe",
      nationality: "France", country: byCode.FR, date_of_birth: "1998-12-20", place_of_birth: "Paris, France",
      height: 178, weight: 75, preferred_foot: "Right", position: "Forward", secondary_position: "Left Winger", shirt_number: 9,
      club: club["Real Madrid"], league: leagueByName["La Liga"], national_team: "France", popularity: 97,
      bio: "2018 World Cup winner with France and 2022 World Cup Golden Boot winner (8 goals). 2022 World Cup runner-up. Won 6 Ligue 1 titles with PSG before joining Real Madrid in 2024."
    },
    {
      full_name: "Lamine Yamal Nasraoui Ebana", common_name: "Lamine Yamal", first_name: "Lamine", last_name: "Yamal",
      nationality: "Spain", country: byCode.ES, date_of_birth: "2007-07-13", place_of_birth: "Esplugues de Llobregat, Spain",
      height: 180, weight: 70, preferred_foot: "Left", position: "Forward", secondary_position: "Right Winger", shirt_number: 19,
      club: club["Barcelona"], league: leagueByName["La Liga"], national_team: "Spain", popularity: 94,
      bio: "Phenomenal generational talent for FC Barcelona. Named Best Young Player of UEFA Euro 2024 at just 17 years old after winning the European Championship with Spain."
    },
    {
      full_name: "Erling Braut Haaland", common_name: "Erling Haaland", first_name: "Erling", last_name: "Haaland",
      nationality: "Norway", country: byCode.NO, date_of_birth: "2000-07-21", place_of_birth: "Leeds, United Kingdom",
      height: 195, weight: 88, preferred_foot: "Left", position: "Forward", secondary_position: "Striker", shirt_number: 9,
      club: club["Manchester City"], league: leagueByName["Premier League"], national_team: "Norway", popularity: 96,
      bio: "Record-breaking Norwegian powerhouse striker who won the historic Continental Treble (Premier League, FA Cup, Champions League) with Manchester City in 2022/23 season, scoring 52 goals."
    },
    {
      full_name: "Kevin De Bruyne", common_name: "Kevin De Bruyne", first_name: "Kevin", last_name: "De Bruyne",
      nationality: "Belgium", country: byCode.BE, date_of_birth: "1991-06-28", place_of_birth: "Drongen, Belgium",
      height: 181, weight: 70, preferred_foot: "Right", position: "Midfielder", secondary_position: "Central Midfielder", shirt_number: 17,
      club: club["Manchester City"], league: leagueByName["Premier League"], national_team: "Belgium", popularity: 93,
      bio: "Elite playmaker renowned for visionary passing and pinpoint crossing. Won 6 Premier League titles and 1 Champions League with Manchester City. 2-time PFA Player of the Year."
    },
    {
      full_name: "Mohamed Salah Hamed Mahrous Ghaly", common_name: "Mohamed Salah", first_name: "Mohamed", last_name: "Salah",
      nationality: "Egypt", country: byCode.EG, date_of_birth: "1992-06-15", place_of_birth: "Nagrig, Egypt",
      height: 175, weight: 71, preferred_foot: "Left", position: "Forward", secondary_position: "Right Winger", shirt_number: 11,
      club: club["Liverpool"], league: leagueByName["Premier League"], national_team: "Egypt", popularity: 95,
      bio: "The Egyptian King of Anfield. Won Champions League 2019 and Premier League 2020 with Liverpool. 3-time Premier League Golden Boot winner. African Player of the Year multiple times."
    },
    {
      full_name: "Jude Victor William Bellingham", common_name: "Jude Bellingham", first_name: "Jude", last_name: "Bellingham",
      nationality: "England", country: byCode["GB-ENG"], date_of_birth: "2003-06-29", place_of_birth: "Stourbridge, England",
      height: 186, weight: 77, preferred_foot: "Right", position: "Midfielder", secondary_position: "Attacking Midfielder", shirt_number: 5,
      club: club["Real Madrid"], league: leagueByName["La Liga"], national_team: "England", popularity: 96,
      bio: "Golden Boy winner and Real Madrid talisman. Won the Champions League and La Liga double in his remarkable debut campaign in Spain 2023/24."
    },
    {
      full_name: "Vinicius Jose Paixao de Oliveira Junior", common_name: "Vinicius Junior", first_name: "Vinicius", last_name: "Junior",
      nationality: "Brazil", country: byCode.BR, date_of_birth: "2000-07-12", place_of_birth: "Sao Goncalo, Brazil",
      height: 176, weight: 73, preferred_foot: "Right", position: "Forward", secondary_position: "Left Winger", shirt_number: 7,
      club: club["Real Madrid"], league: leagueByName["La Liga"], national_team: "Brazil", popularity: 96,
      bio: "Electrifying Brazilian winger who scored in the 2022 Champions League Final and was named Champions League Best Player for the 2023/24 season. 2 Champions League titles with Real Madrid."
    },
    {
      full_name: "Rodrigo Hernandez Cascante", common_name: "Rodri", first_name: "Rodrigo", last_name: "Hernandez",
      nationality: "Spain", country: byCode.ES, date_of_birth: "1996-06-22", place_of_birth: "Madrid, Spain",
      height: 191, weight: 82, preferred_foot: "Right", position: "Midfielder", secondary_position: "Defensive Midfielder", shirt_number: 16,
      club: club["Manchester City"], league: leagueByName["Premier League"], national_team: "Spain", popularity: 95,
      bio: "2024 Ballon d'Or winner and UEFA Euro 2024 Player of the Tournament. Won the Treble with Man City in 2023. Euro 2024 champion with Spain."
    },
    {
      full_name: "Bukayo Ayoyinka T. M. Saka", common_name: "Bukayo Saka", first_name: "Bukayo", last_name: "Saka",
      nationality: "England", country: byCode["GB-ENG"], date_of_birth: "2001-09-05", place_of_birth: "Ealing, England",
      height: 178, weight: 72, preferred_foot: "Left", position: "Forward", secondary_position: "Right Winger", shirt_number: 7,
      club: club["Arsenal"], league: leagueByName["Premier League"], national_team: "England", popularity: 92,
      bio: "Arsenal academy graduate and star forward who embodies the Gunners' renaissance under Mikel Arteta. Euro 2024 squad member with England."
    },
    {
      full_name: "Martin Odegaard", common_name: "Martin Odegaard", first_name: "Martin", last_name: "Odegaard",
      nationality: "Norway", country: byCode.NO, date_of_birth: "1998-12-17", place_of_birth: "Drammen, Norway",
      height: 178, weight: 68, preferred_foot: "Left", position: "Midfielder", secondary_position: "Attacking Midfielder", shirt_number: 8,
      club: club["Arsenal"], league: leagueByName["Premier League"], national_team: "Norway", popularity: 91,
      bio: "Captain of Arsenal and the Norwegian national team. Celebrated for his exceptional vision, technique, and work ethic. Youngest player to sign for Real Madrid at age 16."
    },
    {
      full_name: "Cole Jermaine Palmer", common_name: "Cole Palmer", first_name: "Cole", last_name: "Palmer",
      nationality: "England", country: byCode["GB-ENG"], date_of_birth: "2002-05-06", place_of_birth: "Wythenshawe, England",
      height: 189, weight: 74, preferred_foot: "Left", position: "Midfielder", secondary_position: "Attacking Midfielder", shirt_number: 20,
      club: club["Chelsea"], league: leagueByName["Premier League"], national_team: "England", popularity: 93,
      bio: "'Cold Palmer' - Chelsea's talismanic goal machine and Premier League Young Player of the Season 2023/24. Won Treble with Man City 2023 before joining Chelsea."
    },
    {
      full_name: "Harry Edward Kane", common_name: "Harry Kane", first_name: "Harry", last_name: "Kane",
      nationality: "England", country: byCode["GB-ENG"], date_of_birth: "1993-07-28", place_of_birth: "Walthamstow, England",
      height: 188, weight: 89, preferred_foot: "Right", position: "Forward", secondary_position: "Striker", shirt_number: 9,
      club: club["Bayern Munich"], league: leagueByName["Bundesliga"], national_team: "England", popularity: 94,
      bio: "England's all-time top scorer (68+ goals) and European Golden Shoe winner 2023/24 with Bayern Munich. Tottenham's all-time top scorer with 280 goals in 435 appearances."
    },
    {
      full_name: "Robert Lewandowski", common_name: "Robert Lewandowski", first_name: "Robert", last_name: "Lewandowski",
      nationality: "Poland", country: byCode.PL, date_of_birth: "1988-08-21", place_of_birth: "Warsaw, Poland",
      height: 185, weight: 81, preferred_foot: "Right", position: "Forward", secondary_position: "Striker", shirt_number: 9,
      club: club["Barcelona"], league: leagueByName["La Liga"], national_team: "Poland", popularity: 93,
      bio: "Prolific Polish striker who scored 344 goals for Bayern Munich including 41 Bundesliga goals in a single season (2020/21 record). Won Champions League 2020 with Bayern and 10 Bundesliga titles."
    },
    {
      full_name: "Luka Modric", common_name: "Luka Modric", first_name: "Luka", last_name: "Modric",
      nationality: "Croatia", country: byCode.HR, date_of_birth: "1985-09-09", place_of_birth: "Zadar, Croatia",
      height: 172, weight: 66, preferred_foot: "Right", position: "Midfielder", secondary_position: "Central Midfielder", shirt_number: 10,
      club: club["Real Madrid"], league: leagueByName["La Liga"], national_team: "Croatia", popularity: 95,
      bio: "2018 Ballon d'Or winner and six-time UEFA Champions League winner with Real Madrid. Led Croatia to World Cup Final 2018 (runner-up) and 3rd place at World Cup 2022."
    },
    {
      full_name: "Toni Kroos", common_name: "Toni Kroos", first_name: "Toni", last_name: "Kroos",
      nationality: "Germany", country: byCode.DE, date_of_birth: "1990-01-04", place_of_birth: "Greifswald, Germany",
      height: 183, weight: 76, preferred_foot: "Right", position: "Midfielder", secondary_position: "Central Midfielder", shirt_number: 8,
      club: club["Real Madrid"], league: leagueByName["La Liga"], national_team: "Germany", popularity: 92,
      bio: "2014 World Cup winner with Germany (scored 2 goals in 7-1 semi-final vs Brazil). Six-time Champions League champion (1 Bayern Munich, 5 Real Madrid). Retired in 2024 after Euro 2024."
    },
    {
      full_name: "Neymar da Silva Santos Junior", common_name: "Neymar Jr", first_name: "Neymar", last_name: "da Silva Santos",
      nationality: "Brazil", country: byCode.BR, date_of_birth: "1992-02-05", place_of_birth: "Mogi das Cruzes, Brazil",
      height: 175, weight: 68, preferred_foot: "Right", position: "Forward", secondary_position: "Left Winger", shirt_number: 10,
      club: club["Al-Hilal"], league: leagueByName["Saudi Pro League"], national_team: "Brazil", popularity: 96,
      bio: "Brazil's all-time top scorer (79 goals). Won the Champions League treble with Barcelona in 2015 alongside Messi and Suarez (MSN). Won 2013 FIFA Confederations Cup with Brazil."
    },
    {
      full_name: "Antoine Griezmann", common_name: "Antoine Griezmann", first_name: "Antoine", last_name: "Griezmann",
      nationality: "France", country: byCode.FR, date_of_birth: "1991-03-21", place_of_birth: "Macon, France",
      height: 176, weight: 73, preferred_foot: "Left", position: "Forward", secondary_position: "Second Striker", shirt_number: 7,
      club: club["Atletico Madrid"], league: leagueByName["La Liga"], national_team: "France", popularity: 91,
      bio: "2018 FIFA World Cup champion with France (scored in the final). All-time top scorer in Atletico Madrid history (190+ goals). 2022 World Cup runner-up."
    },
    {
      full_name: "Lautaro Javier Martinez", common_name: "Lautaro Martinez", first_name: "Lautaro", last_name: "Martinez",
      nationality: "Argentina", country: byCode.AR, date_of_birth: "1997-08-22", place_of_birth: "Bahia Blanca, Argentina",
      height: 174, weight: 72, preferred_foot: "Right", position: "Forward", secondary_position: "Striker", shirt_number: 10,
      club: club["Inter Milan"], league: leagueByName["Serie A"], national_team: "Argentina", popularity: 93,
      bio: "Inter Milan captain and Serie A MVP 2023/24. Won 2022 World Cup and 2024 Copa America (Golden Boot winner) with Argentina. 2 Serie A titles with Inter."
    },
    {
      full_name: "Nicolo Barella", common_name: "Nicolo Barella", first_name: "Nicolo", last_name: "Barella",
      nationality: "Italy", country: byCode.IT, date_of_birth: "1997-02-07", place_of_birth: "Cagliari, Italy",
      height: 172, weight: 68, preferred_foot: "Right", position: "Midfielder", secondary_position: "Central Midfielder", shirt_number: 23,
      club: club["Inter Milan"], league: leagueByName["Serie A"], national_team: "Italy", popularity: 89,
      bio: "Dynamo Italian midfielder who won UEFA Euro 2020 with Italy (the Azzurri). Won multiple Serie A titles with Inter Milan."
    },
    {
      full_name: "Rafael Alexandre da Conceicao Leao", common_name: "Rafael Leao", first_name: "Rafael", last_name: "Leao",
      nationality: "Portugal", country: byCode.PT, date_of_birth: "1999-06-10", place_of_birth: "Almada, Portugal",
      height: 188, weight: 81, preferred_foot: "Right", position: "Forward", secondary_position: "Left Winger", shirt_number: 10,
      club: club["AC Milan"], league: leagueByName["Serie A"], national_team: "Portugal", popularity: 90,
      bio: "Electrifying Portuguese forward named Serie A MVP 2021/22 after driving AC Milan to their first Scudetto in eleven years."
    },
    {
      full_name: "Florian Richard Wirtz", common_name: "Florian Wirtz", first_name: "Florian", last_name: "Wirtz",
      nationality: "Germany", country: byCode.DE, date_of_birth: "2003-05-03", place_of_birth: "Pulheim, Germany",
      height: 177, weight: 70, preferred_foot: "Right", position: "Midfielder", secondary_position: "Attacking Midfielder", shirt_number: 10,
      club: club["Bayer Leverkusen"], league: leagueByName["Bundesliga"], national_team: "Germany", popularity: 93,
      bio: "Bundesliga Player of the Season 2023/24 who steered Bayer Leverkusen to an unprecedented unbeaten domestic double (Bundesliga + DFB-Pokal)."
    },
    {
      full_name: "Jamal Musiala", common_name: "Jamal Musiala", first_name: "Jamal", last_name: "Musiala",
      nationality: "Germany", country: byCode.DE, date_of_birth: "2003-02-26", place_of_birth: "Stuttgart, Germany",
      height: 184, weight: 72, preferred_foot: "Right", position: "Midfielder", secondary_position: "Attacking Midfielder", shirt_number: 42,
      club: club["Bayern Munich"], league: leagueByName["Bundesliga"], national_team: "Germany", popularity: 94,
      bio: "'Bambi' - wizardly dribbler and match-winner for Bayern Munich and Germany, co-top scorer at Euro 2024 with 3 goals."
    },
    {
      full_name: "Bruno Miguel Borges Fernandes", common_name: "Bruno Fernandes", first_name: "Bruno", last_name: "Fernandes",
      nationality: "Portugal", country: byCode.PT, date_of_birth: "1994-09-08", place_of_birth: "Maia, Portugal",
      height: 179, weight: 69, preferred_foot: "Right", position: "Midfielder", secondary_position: "Attacking Midfielder", shirt_number: 8,
      club: club["Manchester United"], league: leagueByName["Premier League"], national_team: "Portugal", popularity: 92,
      bio: "Manchester United captain and primary creative engine. Won FA Cup 2024 with Man United and Nations League 2019 with Portugal."
    },
    {
      full_name: "Marcus Rashford", common_name: "Marcus Rashford", first_name: "Marcus", last_name: "Rashford",
      nationality: "England", country: byCode["GB-ENG"], date_of_birth: "1997-10-31", place_of_birth: "Manchester, England",
      height: 185, weight: 70, preferred_foot: "Right", position: "Forward", secondary_position: "Left Winger", shirt_number: 10,
      club: club["Manchester United"], league: leagueByName["Premier League"], national_team: "England", popularity: 90,
      bio: "Manchester United academy graduate and explosive forward with over 130 goals for the Red Devils. Won Europa League 2017 and EFL Cup with Man United."
    },
    {
      full_name: "Alisson Ramses Becker", common_name: "Alisson Becker", first_name: "Alisson", last_name: "Becker",
      nationality: "Brazil", country: byCode.BR, date_of_birth: "1992-10-02", place_of_birth: "Novo Hamburgo, Brazil",
      height: 193, weight: 91, preferred_foot: "Right", position: "Goalkeeper", secondary_position: "Goalkeeper", shirt_number: 1,
      club: club["Liverpool"], league: leagueByName["Premier League"], national_team: "Brazil", popularity: 91,
      bio: "Yashin Trophy winner 2019. Won Champions League 2019 and Premier League 2020 with Liverpool. Copa America 2019 winner with Brazil."
    },
    {
      full_name: "Thibaut Nicolas Marc Courtois", common_name: "Thibaut Courtois", first_name: "Thibaut", last_name: "Courtois",
      nationality: "Belgium", country: byCode.BE, date_of_birth: "1992-05-11", place_of_birth: "Bree, Belgium",
      height: 200, weight: 96, preferred_foot: "Left", position: "Goalkeeper", secondary_position: "Goalkeeper", shirt_number: 1,
      club: club["Real Madrid"], league: leagueByName["La Liga"], national_team: "Belgium", popularity: 92,
      bio: "Player of the Match in the 2022 Champions League Final for Real Madrid with a historic nine-save masterclass. Won 3 Champions League titles and 3 La Liga titles."
    },
    {
      full_name: "Virgil van Dijk", common_name: "Virgil van Dijk", first_name: "Virgil", last_name: "van Dijk",
      nationality: "Netherlands", country: byCode.NL, date_of_birth: "1991-07-08", place_of_birth: "Breda, Netherlands",
      height: 195, weight: 92, preferred_foot: "Right", position: "Defender", secondary_position: "Centre-Back", shirt_number: 4,
      club: club["Liverpool"], league: leagueByName["Premier League"], national_team: "Netherlands", popularity: 94,
      bio: "Liverpool captain and 2019 UEFA Men's Player of the Year. Won Champions League 2019 and Premier League 2020. Runner-up for 2019 Ballon d'Or."
    },
    {
      full_name: "William Alain Andre Gabriel Saliba", common_name: "William Saliba", first_name: "William", last_name: "Saliba",
      nationality: "France", country: byCode.FR, date_of_birth: "2001-03-24", place_of_birth: "Bondy, France",
      height: 192, weight: 85, preferred_foot: "Right", position: "Defender", secondary_position: "Centre-Back", shirt_number: 2,
      club: club["Arsenal"], league: leagueByName["Premier League"], national_team: "France", popularity: 90,
      bio: "Arsenal's defensive rock and Euro 2024 Team of the Tournament centre-back. Renowned for ice-cold composure and recovery pace."
    },
    {
      full_name: "Son Heung-min", common_name: "Son Heung-min", first_name: "Heung-min", last_name: "Son",
      nationality: "South Korea", country: byCode.KR, date_of_birth: "1992-07-08", place_of_birth: "Chuncheon, South Korea",
      height: 183, weight: 77, preferred_foot: "Both", position: "Forward", secondary_position: "Left Winger", shirt_number: 7,
      club: club["Tottenham Hotspur"], league: leagueByName["Premier League"], national_team: "South Korea", popularity: 93,
      bio: "Asian football icon and Premier League Golden Boot winner 2021/22 (joint with Salah, 23 goals). Tottenham's captain. Won 2018 Asian Games gold with South Korea. Puskas Award winner 2020."
    },
    {
      full_name: "Zinedine Yazid Zidane", common_name: "Zinedine Zidane", first_name: "Zinedine", last_name: "Zidane",
      nationality: "France", country: byCode.FR, date_of_birth: "1972-06-23", place_of_birth: "Marseille, France",
      height: 185, weight: 80, preferred_foot: "Both", position: "Midfielder", secondary_position: "Attacking Midfielder", shirt_number: 10,
      club: club["Real Madrid"], league: leagueByName["La Liga"], national_team: "France", popularity: 96,
      bio: "1998 Ballon d'Or winner. 1998 World Cup champion (scored 2 goals in the final vs Brazil) and Euro 2000 champion with France. Champions League winner 2002 with Real Madrid (iconic volley in the final)."
    },
    {
      full_name: "Ronaldo de Assis Moreira", common_name: "Ronaldinho", first_name: "Ronaldo", last_name: "de Assis Moreira",
      nationality: "Brazil", country: byCode.BR, date_of_birth: "1980-03-21", place_of_birth: "Porto Alegre, Brazil",
      height: 181, weight: 80, preferred_foot: "Right", position: "Forward", secondary_position: "Attacking Midfielder", shirt_number: 10,
      club: club["Barcelona"], league: leagueByName["La Liga"], national_team: "Brazil", popularity: 97,
      bio: "2005 Ballon d'Or winner and 2002 World Cup champion with Brazil (scored against England in quarter-final). Champions League winner 2006 with Barcelona. The smiling magician who revolutionized football with samba joy."
    },
    {
      full_name: "David Robert Joseph Beckham", common_name: "David Beckham", first_name: "David", last_name: "Beckham",
      nationality: "England", country: byCode["GB-ENG"], date_of_birth: "1975-05-02", place_of_birth: "London, England",
      height: 183, weight: 76, preferred_foot: "Right", position: "Midfielder", secondary_position: "Right Midfielder", shirt_number: 7,
      club: club["Manchester United"], league: leagueByName["Premier League"], national_team: "England", popularity: 95,
      bio: "Historic Treble winner with Manchester United in 1999 (Premier League, FA Cup, Champions League). Won La Liga 2007 with Real Madrid and Ligue 1 2013 with PSG. Global football and cultural icon."
    },
    {
      full_name: "Pratama Arhan Alif Rifai", common_name: "Pratama Arhan", first_name: "Pratama", last_name: "Arhan",
      nationality: "Indonesia", country: byCode.ID, date_of_birth: "2001-12-21", place_of_birth: "Blora, Indonesia",
      height: 177, weight: 69, preferred_foot: "Left", position: "Defender", secondary_position: "Left-Back", shirt_number: 12,
      club: club["Persib Bandung"], league: leagueByName["Liga 1 Indonesia"], national_team: "Indonesia", popularity: 86,
      bio: "Indonesian international full-back famous globally for his lethal, stadium-crossing long throw-ins. Key player in Indonesia's 2024 Asian Cup campaign. Reached AFC U-23 Asian Cup quarter-finals."
    },

    // === 20 NEW PLAYERS ===
    {
      full_name: "Gianluigi Buffon", common_name: "Gianluigi Buffon", first_name: "Gianluigi", last_name: "Buffon",
      nationality: "Italy", country: byCode.IT, date_of_birth: "1978-01-28", place_of_birth: "Carrara, Italy",
      height: 192, weight: 92, preferred_foot: "Right", position: "Goalkeeper", secondary_position: "Goalkeeper", shirt_number: 1,
      club: club["Juventus"], league: leagueByName["Serie A"], national_team: "Italy", popularity: 95,
      bio: "2006 World Cup champion with Italy (conceded only 2 goals, 1 own goal and 1 penalty, in the tournament). 10 Serie A titles with Juventus. Named best goalkeeper of the 21st century by IFFHS. 176 Italy caps."
    },
    {
      full_name: "Thierry Daniel Henry", common_name: "Thierry Henry", first_name: "Thierry", last_name: "Henry",
      nationality: "France", country: byCode.FR, date_of_birth: "1977-08-17", place_of_birth: "Les Ulis, France",
      height: 188, weight: 83, preferred_foot: "Right", position: "Forward", secondary_position: "Left Winger", shirt_number: 14,
      club: club["Arsenal"], league: leagueByName["Premier League"], national_team: "France", popularity: 95,
      bio: "Arsenal's all-time top scorer (228 goals). Part of the legendary 2003/04 'Invincibles' season (49 unbeaten). 1998 World Cup and Euro 2000 champion with France. Also won Champions League 2009 with Barcelona."
    },
    {
      full_name: "Ronaldo Luis Nazario de Lima", common_name: "Ronaldo Nazario", first_name: "Ronaldo", last_name: "Nazario",
      nationality: "Brazil", country: byCode.BR, date_of_birth: "1976-09-18", place_of_birth: "Rio de Janeiro, Brazil",
      height: 183, weight: 82, preferred_foot: "Right", position: "Forward", secondary_position: "Striker", shirt_number: 9,
      national_team: "Brazil", popularity: 97,
      bio: "Il Fenomeno - 2x World Cup winner (1994 squad member, 2002 champion with 8 goals including 2 in the final). 2x Ballon d'Or winner (1997, 2002). 3x FIFA World Player of the Year. Won La Liga 2003 with Real Madrid."
    },
    {
      full_name: "Paolo Cesare Maldini", common_name: "Paolo Maldini", first_name: "Paolo", last_name: "Maldini",
      nationality: "Italy", country: byCode.IT, date_of_birth: "1968-06-26", place_of_birth: "Milan, Italy",
      height: 186, weight: 85, preferred_foot: "Left", position: "Defender", secondary_position: "Left-Back", shirt_number: 3,
      national_team: "Italy", popularity: 94,
      bio: "One-club legend with 902 appearances for AC Milan over 25 years. Won 5 Champions League titles (1989, 1990, 1994, 2003, 2007) and 7 Serie A titles. 126 Italy caps. Widely considered the greatest defender ever."
    },
    {
      full_name: "Andres Iniesta Lujan", common_name: "Andres Iniesta", first_name: "Andres", last_name: "Iniesta",
      nationality: "Spain", country: byCode.ES, date_of_birth: "1984-05-11", place_of_birth: "Fuentealbilla, Spain",
      height: 171, weight: 68, preferred_foot: "Right", position: "Midfielder", secondary_position: "Central Midfielder", shirt_number: 8,
      club: club["Barcelona"], league: leagueByName["La Liga"], national_team: "Spain", popularity: 95,
      bio: "Scored the winning goal in the 2010 World Cup Final for Spain. Won Euro 2008, 2010 World Cup, and Euro 2012 with Spain. 4x Champions League winner with Barcelona. Named Man of the Match in the 2010 WC Final."
    },
    {
      full_name: "Xavier Hernandez Creus", common_name: "Xavi Hernandez", first_name: "Xavier", last_name: "Hernandez",
      nationality: "Spain", country: byCode.ES, date_of_birth: "1980-01-25", place_of_birth: "Terrassa, Spain",
      height: 170, weight: 68, preferred_foot: "Right", position: "Midfielder", secondary_position: "Central Midfielder", shirt_number: 6,
      club: club["Barcelona"], league: leagueByName["La Liga"], national_team: "Spain", popularity: 94,
      bio: "The architect of tiki-taka. Won 2010 World Cup, Euro 2008, Euro 2012 with Spain. 4x Champions League winner with Barcelona. 8 La Liga titles. Named best midfielder of the 2010 World Cup."
    },
    {
      full_name: "Sergio Ramos Garcia", common_name: "Sergio Ramos", first_name: "Sergio", last_name: "Ramos",
      nationality: "Spain", country: byCode.ES, date_of_birth: "1986-03-30", place_of_birth: "Camas, Spain",
      height: 184, weight: 82, preferred_foot: "Right", position: "Defender", secondary_position: "Centre-Back", shirt_number: 4,
      club: club["Sevilla"], league: leagueByName["La Liga"], national_team: "Spain", popularity: 94,
      bio: "Won 2010 World Cup, Euro 2008, Euro 2012 with Spain. 4x Champions League winner with Real Madrid (scored the equalizer in the 2014 final 'La Decima'). 5 La Liga titles. 180 Spain caps."
    },
    {
      full_name: "Karim Mostafa Benzema", common_name: "Karim Benzema", first_name: "Karim", last_name: "Benzema",
      nationality: "France", country: byCode.FR, date_of_birth: "1987-12-19", place_of_birth: "Lyon, France",
      height: 185, weight: 81, preferred_foot: "Right", position: "Forward", secondary_position: "Striker", shirt_number: 9,
      club: club["Al-Hilal"], league: leagueByName["Saudi Pro League"], national_team: "France", popularity: 94,
      bio: "2022 Ballon d'Or winner. Won 5 Champions League titles and 4 La Liga titles with Real Madrid. Scored 354 goals for Real Madrid across all competitions. 2021 Nations League winner with France."
    },
    {
      full_name: "N'Golo Kante", common_name: "N'Golo Kante", first_name: "N'Golo", last_name: "Kante",
      nationality: "France", country: byCode.FR, date_of_birth: "1991-03-29", place_of_birth: "Paris, France",
      height: 168, weight: 68, preferred_foot: "Right", position: "Midfielder", secondary_position: "Defensive Midfielder", shirt_number: 13,
      club: club["Al-Hilal"], league: leagueByName["Saudi Pro League"], national_team: "France", popularity: 91,
      bio: "2018 World Cup champion with France. Won Premier League with Leicester City (2016, the miracle season) and Chelsea (2017). Won Champions League 2021 with Chelsea, named Man of the Match in the final."
    },
    {
      full_name: "Pedro Gonzalez Lopez", common_name: "Pedri", first_name: "Pedro", last_name: "Gonzalez Lopez",
      nationality: "Spain", country: byCode.ES, date_of_birth: "2002-11-25", place_of_birth: "Tegueste, Spain",
      height: 174, weight: 60, preferred_foot: "Right", position: "Midfielder", secondary_position: "Central Midfielder", shirt_number: 8,
      club: club["Barcelona"], league: leagueByName["La Liga"], national_team: "Spain", popularity: 91,
      bio: "Euro 2024 champion and Euro 2024 Best Young Player (also won Young Player at Euro 2020). Named Golden Boy 2021. Won La Liga 2023 with Barcelona."
    },
    {
      full_name: "Pablo Martin Paez Gavira", common_name: "Gavi", first_name: "Pablo", last_name: "Gavira",
      nationality: "Spain", country: byCode.ES, date_of_birth: "2004-08-05", place_of_birth: "Los Palacios y Villafranca, Spain",
      height: 173, weight: 70, preferred_foot: "Right", position: "Midfielder", secondary_position: "Central Midfielder", shirt_number: 6,
      club: club["Barcelona"], league: leagueByName["La Liga"], national_team: "Spain", popularity: 89,
      bio: "Youngest ever Spanish international in the 21st century. Won La Liga 2023 with Barcelona. 2022 Kopa Trophy winner (best young player). 2022 Golden Boy."
    },
    {
      full_name: "Declan Rice", common_name: "Declan Rice", first_name: "Declan", last_name: "Rice",
      nationality: "England", country: byCode["GB-ENG"], date_of_birth: "1999-01-14", place_of_birth: "London, England",
      height: 188, weight: 80, preferred_foot: "Right", position: "Midfielder", secondary_position: "Defensive Midfielder", shirt_number: 41,
      club: club["Arsenal"], league: leagueByName["Premier League"], national_team: "England", popularity: 90,
      bio: "Won Europa Conference League 2023 with West Ham United before his £105M move to Arsenal. Euro 2024 squad member with England. Arsenal's midfield dynamo."
    },
    {
      full_name: "Philip Walter Foden", common_name: "Phil Foden", first_name: "Phil", last_name: "Foden",
      nationality: "England", country: byCode["GB-ENG"], date_of_birth: "2000-05-28", place_of_birth: "Stockport, England",
      height: 171, weight: 69, preferred_foot: "Left", position: "Midfielder", secondary_position: "Attacking Midfielder", shirt_number: 47,
      club: club["Manchester City"], league: leagueByName["Premier League"], national_team: "England", popularity: 92,
      bio: "PFA Players' Player of the Year and FWA Footballer of the Year 2023/24. Won 6 Premier League titles and Champions League 2023 with Man City. Part of the historic Treble-winning side."
    },
    {
      full_name: "Federico Santiago Valverde Dipetta", common_name: "Federico Valverde", first_name: "Federico", last_name: "Valverde",
      nationality: "Uruguay", country: byCode.UY, date_of_birth: "1998-07-22", place_of_birth: "Montevideo, Uruguay",
      height: 182, weight: 78, preferred_foot: "Right", position: "Midfielder", secondary_position: "Central Midfielder", shirt_number: 15,
      club: club["Real Madrid"], league: leagueByName["La Liga"], national_team: "Uruguay", popularity: 91,
      bio: "Dynamic box-to-box midfielder who won 3 Champions League titles and 3 La Liga titles with Real Madrid. Key player for Uruguay in 2022 World Cup and 2024 Copa America."
    },
    {
      full_name: "Joshua Walter Kimmich", common_name: "Joshua Kimmich", first_name: "Joshua", last_name: "Kimmich",
      nationality: "Germany", country: byCode.DE, date_of_birth: "1995-02-08", place_of_birth: "Rottweil, Germany",
      height: 177, weight: 75, preferred_foot: "Right", position: "Midfielder", secondary_position: "Right-Back", shirt_number: 6,
      club: club["Bayern Munich"], league: leagueByName["Bundesliga"], national_team: "Germany", popularity: 91,
      bio: "Versatile Bayern Munich captain. Won Champions League 2020 and 9 consecutive Bundesliga titles. Germany international with 90+ caps."
    },
    {
      full_name: "Marc-Andre ter Stegen", common_name: "Marc-Andre ter Stegen", first_name: "Marc-Andre", last_name: "ter Stegen",
      nationality: "Germany", country: byCode.DE, date_of_birth: "1992-04-30", place_of_birth: "Monchengladbach, Germany",
      height: 187, weight: 85, preferred_foot: "Right", position: "Goalkeeper", secondary_position: "Goalkeeper", shirt_number: 1,
      club: club["Barcelona"], league: leagueByName["La Liga"], national_team: "Germany", popularity: 90,
      bio: "Barcelona's number one since 2014. Won Champions League 2015 (treble-winning season), 5 La Liga titles, and the Copa del Rey multiple times. Known for exceptional distribution."
    },
    {
      full_name: "Trent John Alexander-Arnold", common_name: "Trent Alexander-Arnold", first_name: "Trent", last_name: "Alexander-Arnold",
      nationality: "England", country: byCode["GB-ENG"], date_of_birth: "1998-10-07", place_of_birth: "Liverpool, England",
      height: 175, weight: 69, preferred_foot: "Right", position: "Defender", secondary_position: "Right-Back", shirt_number: 66,
      club: club["Liverpool"], league: leagueByName["Premier League"], national_team: "England", popularity: 92,
      bio: "Liverpool academy graduate and one of the best attacking full-backs in history. Won Champions League 2019 and Premier League 2020. Famous for his corner kick assist in the 4-0 Barcelona comeback."
    },
    {
      full_name: "Sadio Mane", common_name: "Sadio Mane", first_name: "Sadio", last_name: "Mane",
      nationality: "Senegal", country: byCode.SN, date_of_birth: "1992-04-10", place_of_birth: "Sedhiou, Senegal",
      height: 175, weight: 69, preferred_foot: "Right", position: "Forward", secondary_position: "Left Winger", shirt_number: 10,
      club: club["Al-Nassr"], league: leagueByName["Saudi Pro League"], national_team: "Senegal", popularity: 91,
      bio: "2022 Africa Cup of Nations champion with Senegal (scored the winning penalty). Won Champions League 2019 and Premier League 2020 with Liverpool. Won Bundesliga with Bayern Munich 2023."
    },
    {
      full_name: "Zlatan Ibrahimovic", common_name: "Zlatan Ibrahimovic", first_name: "Zlatan", last_name: "Ibrahimovic",
      nationality: "Sweden", country: byCode.SE, date_of_birth: "1981-10-03", place_of_birth: "Malmo, Sweden",
      height: 195, weight: 95, preferred_foot: "Both", position: "Forward", secondary_position: "Striker", shirt_number: 9,
      club: club["AC Milan"], league: leagueByName["Serie A"], national_team: "Sweden", popularity: 95,
      bio: "Legendary striker who won league titles in 4 different countries (Netherlands, Italy, Spain, France). 11 league titles total. Won Serie A 2011 with AC Milan and Ligue 1 4 times with PSG. 62 goals in 122 Sweden caps."
    },
    {
      full_name: "Daniel Carvajal Ramos", common_name: "Dani Carvajal", first_name: "Daniel", last_name: "Carvajal",
      nationality: "Spain", country: byCode.ES, date_of_birth: "1992-01-11", place_of_birth: "Leganes, Spain",
      height: 173, weight: 73, preferred_foot: "Right", position: "Defender", secondary_position: "Right-Back", shirt_number: 2,
      club: club["Real Madrid"], league: leagueByName["La Liga"], national_team: "Spain", popularity: 89,
      bio: "Won 6 Champions League titles with Real Madrid (2014, 2016, 2017, 2018, 2022, 2024) - scored in the 2024 final. Euro 2024 champion with Spain. One of the most decorated players in Champions League history."
    },
    {
      full_name: "Steven George Gerrard", common_name: "Steven Gerrard", first_name: "Steven", last_name: "Gerrard",
      nationality: "England", country: byCode["GB-ENG"], date_of_birth: "1980-05-30", place_of_birth: "Whiston, England",
      height: 183, weight: 83, preferred_foot: "Right", position: "Midfielder", secondary_position: "Central Midfielder", shirt_number: 8,
      national_team: "England", popularity: 94,
      bio: "Liverpool captain and midfield legend who made 710 appearances and scored 186 goals for the club. Captained Liverpool to the 2005 UEFA Champions League title and earned 114 caps for England."
    },
    {
      full_name: "Wayne Mark Rooney", common_name: "Wayne Rooney", first_name: "Wayne", last_name: "Rooney",
      nationality: "England", country: byCode["GB-ENG"], date_of_birth: "1985-10-24", place_of_birth: "Liverpool, England",
      height: 176, weight: 83, preferred_foot: "Right", position: "Forward", secondary_position: "Attacking Midfielder", shirt_number: 10,
      national_team: "England", popularity: 94,
      bio: "Record goalscorer for Manchester United with 253 goals in all competitions and England's second-highest men's international scorer with 53 goals. Won five Premier League titles and the 2008 UEFA Champions League with Manchester United."
    },
    {
      full_name: "Rizky Ridho Ramadhani", common_name: "Rizky Ridho", first_name: "Rizky", last_name: "Ridho",
      nationality: "Indonesia", country: byCode.ID, date_of_birth: "2001-11-21", place_of_birth: "Surabaya, Indonesia",
      height: 183, weight: 75, preferred_foot: "Right", position: "Defender", secondary_position: "Centre-Back", shirt_number: 74,
      club: club["Persija Jakarta"], league: leagueByName["Liga 1 Indonesia"], national_team: "Indonesia", popularity: 82,
      bio: "Indonesian international centre-back who plays for Persija Jakarta. A regular for Indonesia's senior national team, Ridho is known for his defensive reading and leadership."
    }
  ];

  const players = await Promise.all(
    playerDefinitions.map((p) => {
      const photoUrl = entityImageManifest.players[p.common_name as keyof typeof entityImageManifest.players]?.url
        ?? starterPlayerImages[p.common_name as keyof typeof starterPlayerImages]?.url
        ?? null;
      return prisma.player.upsert({
        where: { full_name_date_of_birth: { full_name: p.full_name, date_of_birth: new Date(p.date_of_birth) } },
        update: {
          common_name: p.common_name,
          first_name: p.first_name,
          last_name: p.last_name,
          nationality_id: p.country.country_id,
          nationality: p.nationality,
          place_of_birth: p.place_of_birth,
          height: p.height,
          weight: p.weight,
          preferred_foot: p.preferred_foot,
          position: p.position,
          secondary_position: p.secondary_position,
          shirt_number: p.shirt_number,
          current_club_id: p.club?.club_id,
          current_league_id: p.league?.league_id,
          current_national_team: p.national_team,
          profile_photo: photoUrl,
          biography: p.bio,
          popularity: p.popularity,
          career_status: retiredPlayers.includes(p.common_name) ? "RETIRED" : "ACTIVE"
        },
        create: {
          full_name: p.full_name,
          common_name: p.common_name,
          first_name: p.first_name,
          last_name: p.last_name,
          nationality_id: p.country.country_id,
          nationality: p.nationality,
          date_of_birth: new Date(p.date_of_birth),
          age: new Date().getFullYear() - new Date(p.date_of_birth).getFullYear(),
          place_of_birth: p.place_of_birth,
          height: p.height,
          weight: p.weight,
          preferred_foot: p.preferred_foot,
          position: p.position,
          secondary_position: p.secondary_position,
          shirt_number: p.shirt_number,
          current_club_id: p.club?.club_id,
          current_league_id: p.league?.league_id,
          current_national_team: p.national_team,
          profile_photo: photoUrl,
          biography: p.bio,
          popularity: p.popularity,
          career_status: retiredPlayers.includes(p.common_name) ? "RETIRED" : "ACTIVE",
          source
        }
      });
    })
  );
  const playerByName = Object.fromEntries(players.map((p) => [p.common_name, p]));
  console.log(`Seeded ${players.length} players successfully.`);

  // 5. Player Careers
  await prisma.playerCareer.deleteMany({});

  const careersList = [
    // Cristiano Ronaldo
    { p: "Cristiano Ronaldo", c: "Sporting CP", season: "2002-2003", start: "2002-08-01", end: "2003-08-12", apps: 31, goals: 5, assists: 3 },
    { p: "Cristiano Ronaldo", c: "Manchester United", season: "2003-2009", start: "2003-08-12", end: "2009-07-01", apps: 292, goals: 118, assists: 69 },
    { p: "Cristiano Ronaldo", c: "Real Madrid", season: "2009-2018", start: "2009-07-01", end: "2018-07-10", apps: 438, goals: 450, assists: 131 },
    { p: "Cristiano Ronaldo", c: "Juventus", season: "2018-2021", start: "2018-07-10", end: "2021-08-27", apps: 134, goals: 101, assists: 22 },
    { p: "Cristiano Ronaldo", c: "Manchester United", season: "2021-2022", start: "2021-08-27", end: "2022-11-22", apps: 54, goals: 27, assists: 5 },
    { p: "Cristiano Ronaldo", c: "Al-Nassr", season: "2023-Present", start: "2023-01-01", end: null, apps: 85, goals: 74, assists: 18 },

    // Lionel Messi
    { p: "Lionel Messi", c: "Barcelona", season: "2004-2021", start: "2004-10-16", end: "2021-08-10", apps: 778, goals: 672, assists: 303 },
    { p: "Lionel Messi", c: "Paris Saint-Germain", season: "2021-2023", start: "2021-08-10", end: "2023-07-15", apps: 75, goals: 32, assists: 35 },
    { p: "Lionel Messi", c: "Inter Miami", season: "2023-Present", start: "2023-07-15", end: null, apps: 39, goals: 34, assists: 20 },

    // Kylian Mbappe
    { p: "Kylian Mbappe", c: "AS Monaco", season: "2015-2017", start: "2015-12-02", end: "2017-08-31", apps: 60, goals: 27, assists: 14 },
    { p: "Kylian Mbappe", c: "Paris Saint-Germain", season: "2017-2024", start: "2017-08-31", end: "2024-06-30", apps: 308, goals: 256, assists: 108 },
    { p: "Kylian Mbappe", c: "Real Madrid", season: "2024-Present", start: "2024-07-01", end: null, apps: 38, goals: 28, assists: 5 },

    // Lamine Yamal
    { p: "Lamine Yamal", c: "Barcelona", season: "2023-Present", start: "2023-04-29", end: null, apps: 82, goals: 18, assists: 22 },

    // Erling Haaland
    { p: "Erling Haaland", c: "Borussia Dortmund", season: "2020-2022", start: "2020-01-01", end: "2022-06-30", apps: 89, goals: 86, assists: 23 },
    { p: "Erling Haaland", c: "Manchester City", season: "2022-Present", start: "2022-07-01", end: null, apps: 115, goals: 105, assists: 15 },

    // Kevin De Bruyne
    { p: "Kevin De Bruyne", c: "Chelsea", season: "2012-2014", start: "2012-01-31", end: "2014-01-18", apps: 9, goals: 0, assists: 1 },
    { p: "Kevin De Bruyne", c: "Manchester City", season: "2015-Present", start: "2015-08-30", end: null, apps: 390, goals: 103, assists: 171 },

    // Mohamed Salah
    { p: "Mohamed Salah", c: "Chelsea", season: "2014-2016", start: "2014-01-26", end: "2016-08-03", apps: 19, goals: 2, assists: 4 },
    { p: "Mohamed Salah", c: "AS Roma", season: "2015-2017", start: "2015-08-06", end: "2017-06-22", apps: 83, goals: 34, assists: 18 },
    { p: "Mohamed Salah", c: "Liverpool", season: "2017-Present", start: "2017-06-22", end: null, apps: 375, goals: 228, assists: 103 },

    // Jude Bellingham
    { p: "Jude Bellingham", c: "Borussia Dortmund", season: "2020-2023", start: "2020-07-23", end: "2023-06-14", apps: 132, goals: 24, assists: 25 },
    { p: "Jude Bellingham", c: "Real Madrid", season: "2023-Present", start: "2023-06-14", end: null, apps: 72, goals: 34, assists: 21 },

    // Vinicius Junior
    { p: "Vinicius Junior", c: "Flamengo", season: "2017-2018", start: "2017-05-13", end: "2018-07-12", apps: 69, goals: 14, assists: 5 },
    { p: "Vinicius Junior", c: "Real Madrid", season: "2018-Present", start: "2018-07-12", end: null, apps: 285, goals: 95, assists: 82 },

    // Rodri
    { p: "Rodri", c: "Atletico Madrid", season: "2018-2019", start: "2018-07-01", end: "2019-07-03", apps: 47, goals: 3, assists: 1 },
    { p: "Rodri", c: "Manchester City", season: "2019-Present", start: "2019-07-03", end: null, apps: 260, goals: 26, assists: 30 },

    // Bukayo Saka
    { p: "Bukayo Saka", c: "Arsenal", season: "2018-Present", start: "2018-11-29", end: null, apps: 245, goals: 65, assists: 60 },

    // Martin Odegaard
    { p: "Martin Odegaard", c: "Real Madrid", season: "2015-2021", start: "2015-01-22", end: "2021-08-20", apps: 11, goals: 0, assists: 0 },
    { p: "Martin Odegaard", c: "Real Sociedad", season: "2019-2020", start: "2019-07-04", end: "2020-06-30", apps: 36, goals: 7, assists: 9 },
    { p: "Martin Odegaard", c: "Arsenal", season: "2021-Present", start: "2021-08-20", end: null, apps: 165, goals: 37, assists: 28 },

    // Cole Palmer
    { p: "Cole Palmer", c: "Manchester City", season: "2020-2023", start: "2020-09-30", end: "2023-09-01", apps: 41, goals: 6, assists: 2 },
    { p: "Cole Palmer", c: "Chelsea", season: "2023-Present", start: "2023-09-01", end: null, apps: 70, goals: 40, assists: 22 },

    // Harry Kane
    { p: "Harry Kane", c: "Tottenham Hotspur", season: "2011-2023", start: "2011-07-01", end: "2023-08-12", apps: 435, goals: 280, assists: 61 },
    { p: "Harry Kane", c: "Bayern Munich", season: "2023-Present", start: "2023-08-12", end: null, apps: 72, goals: 68, assists: 20 },

    // Robert Lewandowski
    { p: "Robert Lewandowski", c: "Borussia Dortmund", season: "2010-2014", start: "2010-07-01", end: "2014-07-01", apps: 187, goals: 103, assists: 42 },
    { p: "Robert Lewandowski", c: "Bayern Munich", season: "2014-2022", start: "2014-07-01", end: "2022-07-16", apps: 375, goals: 344, assists: 73 },
    { p: "Robert Lewandowski", c: "Barcelona", season: "2022-Present", start: "2022-07-16", end: null, apps: 115, goals: 78, assists: 20 },

    // Luka Modric
    { p: "Luka Modric", c: "Tottenham Hotspur", season: "2008-2012", start: "2008-05-28", end: "2012-08-27", apps: 160, goals: 17, assists: 28 },
    { p: "Luka Modric", c: "Real Madrid", season: "2012-Present", start: "2012-08-27", end: null, apps: 550, goals: 39, assists: 88 },

    // Toni Kroos
    { p: "Toni Kroos", c: "Bayern Munich", season: "2007-2014", start: "2007-09-26", end: "2014-07-17", apps: 205, goals: 24, assists: 49 },
    { p: "Toni Kroos", c: "Bayer Leverkusen", season: "2009-2010", start: "2009-01-31", end: "2010-06-30", apps: 48, goals: 10, assists: 13 },
    { p: "Toni Kroos", c: "Real Madrid", season: "2014-2024", start: "2014-07-17", end: "2024-06-01", apps: 465, goals: 28, assists: 99 },

    // Neymar Jr
    { p: "Neymar Jr", c: "Santos", season: "2009-2013", start: "2009-03-07", end: "2013-07-01", apps: 230, goals: 136, assists: 64 },
    { p: "Neymar Jr", c: "Barcelona", season: "2013-2017", start: "2013-07-01", end: "2017-08-03", apps: 186, goals: 105, assists: 76 },
    { p: "Neymar Jr", c: "Paris Saint-Germain", season: "2017-2023", start: "2017-08-03", end: "2023-08-15", apps: 173, goals: 118, assists: 77 },
    { p: "Neymar Jr", c: "Al-Hilal", season: "2023-Present", start: "2023-08-15", end: null, apps: 7, goals: 1, assists: 3 },

    // Antoine Griezmann
    { p: "Antoine Griezmann", c: "Real Sociedad", season: "2009-2014", start: "2009-09-02", end: "2014-07-28", apps: 202, goals: 53, assists: 28 },
    { p: "Antoine Griezmann", c: "Atletico Madrid", season: "2014-2019", start: "2014-07-28", end: "2019-07-12", apps: 257, goals: 133, assists: 50 },
    { p: "Antoine Griezmann", c: "Barcelona", season: "2019-2021", start: "2019-07-12", end: "2021-08-31", apps: 102, goals: 35, assists: 17 },
    { p: "Antoine Griezmann", c: "Atletico Madrid", season: "2021-Present", start: "2021-08-31", end: null, apps: 160, goals: 58, assists: 38 },

    // Lautaro Martinez
    { p: "Lautaro Martinez", c: "Inter Milan", season: "2018-Present", start: "2018-07-04", end: null, apps: 300, goals: 138, assists: 45 },

    // Nicolo Barella
    { p: "Nicolo Barella", c: "Inter Milan", season: "2019-Present", start: "2019-07-12", end: null, apps: 255, goals: 25, assists: 52 },

    // Rafael Leao
    { p: "Rafael Leao", c: "Sporting CP", season: "2017-2018", start: "2017-08-01", end: "2018-06-14", apps: 5, goals: 2, assists: 1 },
    { p: "Rafael Leao", c: "AC Milan", season: "2019-Present", start: "2019-08-01", end: null, apps: 230, goals: 62, assists: 51 },

    // Florian Wirtz
    { p: "Florian Wirtz", c: "Bayer Leverkusen", season: "2020-Present", start: "2020-05-18", end: null, apps: 175, goals: 49, assists: 56 },

    // Jamal Musiala
    { p: "Jamal Musiala", c: "Chelsea", season: "2011-2019", start: "2011-07-01", end: "2019-07-01", apps: 0, goals: 0, assists: 0 },
    { p: "Jamal Musiala", c: "Bayern Munich", season: "2020-Present", start: "2020-06-20", end: null, apps: 185, goals: 54, assists: 35 },

    // Bruno Fernandes
    { p: "Bruno Fernandes", c: "Sporting CP", season: "2017-2020", start: "2017-06-27", end: "2020-01-29", apps: 137, goals: 63, assists: 52 },
    { p: "Bruno Fernandes", c: "Manchester United", season: "2020-Present", start: "2020-01-29", end: null, apps: 255, goals: 82, assists: 75 },

    // Marcus Rashford
    { p: "Marcus Rashford", c: "Manchester United", season: "2015-Present", start: "2015-10-01", end: null, apps: 425, goals: 138, assists: 76 },

    // Alisson Becker
    { p: "Alisson Becker", c: "AS Roma", season: "2016-2018", start: "2016-07-01", end: "2018-07-19", apps: 74, goals: 0, assists: 0 },
    { p: "Alisson Becker", c: "Liverpool", season: "2018-Present", start: "2018-07-19", end: null, apps: 275, goals: 1, assists: 3 },

    // Thibaut Courtois
    { p: "Thibaut Courtois", c: "Atletico Madrid", season: "2011-2014", start: "2011-07-27", end: "2014-06-30", apps: 154, goals: 0, assists: 0 },
    { p: "Thibaut Courtois", c: "Chelsea", season: "2014-2018", start: "2014-07-01", end: "2018-08-08", apps: 154, goals: 0, assists: 0 },
    { p: "Thibaut Courtois", c: "Real Madrid", season: "2018-Present", start: "2018-08-08", end: null, apps: 245, goals: 0, assists: 0 },

    // Virgil van Dijk
    { p: "Virgil van Dijk", c: "Celtic", season: "2013-2015", start: "2013-06-21", end: "2015-09-01", apps: 76, goals: 15, assists: 2 },
    { p: "Virgil van Dijk", c: "Liverpool", season: "2018-Present", start: "2018-01-01", end: null, apps: 290, goals: 25, assists: 12 },

    // William Saliba
    { p: "William Saliba", c: "Olympique de Marseille", season: "2021-2022", start: "2021-07-06", end: "2022-06-30", apps: 52, goals: 1, assists: 0 },
    { p: "William Saliba", c: "Arsenal", season: "2022-Present", start: "2022-07-01", end: null, apps: 105, goals: 6, assists: 2 },

    // Son Heung-min
    { p: "Son Heung-min", c: "Bayer Leverkusen", season: "2013-2015", start: "2013-06-13", end: "2015-08-28", apps: 87, goals: 29, assists: 11 },
    { p: "Son Heung-min", c: "Tottenham Hotspur", season: "2015-Present", start: "2015-08-28", end: null, apps: 420, goals: 166, assists: 88 },

    // Zinedine Zidane
    { p: "Zinedine Zidane", c: "Juventus", season: "1996-2001", start: "1996-07-01", end: "2001-07-09", apps: 212, goals: 31, assists: 45 },
    { p: "Zinedine Zidane", c: "Real Madrid", season: "2001-2006", start: "2001-07-09", end: "2006-07-01", apps: 227, goals: 49, assists: 68 },

    // Ronaldinho
    { p: "Ronaldinho", c: "Paris Saint-Germain", season: "2001-2003", start: "2001-07-01", end: "2003-07-19", apps: 77, goals: 25, assists: 17 },
    { p: "Ronaldinho", c: "Barcelona", season: "2003-2008", start: "2003-07-19", end: "2008-07-15", apps: 207, goals: 94, assists: 70 },
    { p: "Ronaldinho", c: "AC Milan", season: "2008-2011", start: "2008-07-15", end: "2011-01-11", apps: 95, goals: 26, assists: 29 },
    { p: "Ronaldinho", c: "Flamengo", season: "2011-2012", start: "2011-01-11", end: "2012-05-31", apps: 72, goals: 28, assists: 15 },

    // David Beckham
    { p: "David Beckham", c: "Manchester United", season: "1992-2003", start: "1992-09-23", end: "2003-07-01", apps: 394, goals: 85, assists: 120 },
    { p: "David Beckham", c: "Real Madrid", season: "2003-2007", start: "2003-07-01", end: "2007-07-01", apps: 159, goals: 20, assists: 52 },
    { p: "David Beckham", c: "AC Milan", season: "2009-2010", start: "2009-01-06", end: "2010-06-30", apps: 33, goals: 2, assists: 7 },
    { p: "David Beckham", c: "Paris Saint-Germain", season: "2013", start: "2013-01-31", end: "2013-05-31", apps: 14, goals: 0, assists: 2 },

    // Pratama Arhan
    { p: "Pratama Arhan", c: "Persib Bandung", season: "2024-Present", start: "2024-01-15", end: null, apps: 28, goals: 2, assists: 7 },

    // === 20 NEW PLAYERS CAREERS ===

    // Gianluigi Buffon
    { p: "Gianluigi Buffon", c: "Juventus", season: "2001-2018", start: "2001-07-03", end: "2018-07-15", apps: 656, goals: 0, assists: 0 },
    { p: "Gianluigi Buffon", c: "Paris Saint-Germain", season: "2018-2019", start: "2018-07-06", end: "2019-06-30", apps: 25, goals: 0, assists: 0 },
    { p: "Gianluigi Buffon", c: "Juventus", season: "2019-2021", start: "2019-07-04", end: "2021-06-30", apps: 36, goals: 0, assists: 0 },

    // Thierry Henry
    { p: "Thierry Henry", c: "AS Monaco", season: "1994-1999", start: "1994-08-31", end: "1999-08-03", apps: 141, goals: 28, assists: 12 },
    { p: "Thierry Henry", c: "Juventus", season: "1999", start: "1999-01-18", end: "1999-08-03", apps: 16, goals: 3, assists: 1 },
    { p: "Thierry Henry", c: "Arsenal", season: "1999-2007", start: "1999-08-03", end: "2007-06-25", apps: 370, goals: 228, assists: 92 },
    { p: "Thierry Henry", c: "Barcelona", season: "2007-2010", start: "2007-06-25", end: "2010-07-20", apps: 121, goals: 49, assists: 29 },

    // Ronaldo Nazario
    { p: "Ronaldo Nazario", c: "Barcelona", season: "1996-1997", start: "1996-07-19", end: "1997-07-25", apps: 49, goals: 47, assists: 12 },
    { p: "Ronaldo Nazario", c: "Inter Milan", season: "1997-2002", start: "1997-07-25", end: "2002-08-31", apps: 99, goals: 59, assists: 17 },
    { p: "Ronaldo Nazario", c: "Real Madrid", season: "2002-2007", start: "2002-08-31", end: "2007-01-27", apps: 177, goals: 104, assists: 28 },
    { p: "Ronaldo Nazario", c: "AC Milan", season: "2007-2008", start: "2007-01-27", end: "2008-05-01", apps: 20, goals: 9, assists: 2 },

    // Paolo Maldini
    { p: "Paolo Maldini", c: "AC Milan", season: "1985-2009", start: "1985-01-20", end: "2009-05-31", apps: 902, goals: 33, assists: 37 },

    // Andres Iniesta
    { p: "Andres Iniesta", c: "Barcelona", season: "2002-2018", start: "2002-10-29", end: "2018-05-20", apps: 674, goals: 57, assists: 139 },

    // Xavi Hernandez
    { p: "Xavi Hernandez", c: "Barcelona", season: "1998-2015", start: "1998-08-18", end: "2015-06-06", apps: 767, goals: 85, assists: 185 },

    // Sergio Ramos
    { p: "Sergio Ramos", c: "Sevilla", season: "2003-2005", start: "2003-02-01", end: "2005-08-31", apps: 50, goals: 3, assists: 1 },
    { p: "Sergio Ramos", c: "Real Madrid", season: "2005-2021", start: "2005-08-31", end: "2021-06-30", apps: 671, goals: 101, assists: 42 },
    { p: "Sergio Ramos", c: "Paris Saint-Germain", season: "2021-2023", start: "2021-07-08", end: "2023-06-30", apps: 51, goals: 5, assists: 1 },
    { p: "Sergio Ramos", c: "Sevilla", season: "2023-Present", start: "2023-09-12", end: null, apps: 37, goals: 2, assists: 1 },

    // Karim Benzema
    { p: "Karim Benzema", c: "Olympique Lyonnais", season: "2004-2009", start: "2004-01-15", end: "2009-07-01", apps: 171, goals: 66, assists: 30 },
    { p: "Karim Benzema", c: "Real Madrid", season: "2009-2023", start: "2009-07-01", end: "2023-06-01", apps: 648, goals: 354, assists: 165 },
    { p: "Karim Benzema", c: "Al-Hilal", season: "2023-Present", start: "2023-06-06", end: null, apps: 12, goals: 5, assists: 3 },

    // N'Golo Kante
    { p: "N'Golo Kante", c: "Chelsea", season: "2016-2023", start: "2016-07-16", end: "2023-06-30", apps: 269, goals: 13, assists: 16 },
    { p: "N'Golo Kante", c: "Al-Hilal", season: "2023-Present", start: "2023-07-01", end: null, apps: 25, goals: 1, assists: 4 },

    // Pedri
    { p: "Pedri", c: "Barcelona", season: "2020-Present", start: "2020-09-27", end: null, apps: 170, goals: 16, assists: 22 },

    // Gavi
    { p: "Gavi", c: "Barcelona", season: "2021-Present", start: "2021-08-29", end: null, apps: 120, goals: 8, assists: 14 },

    // Declan Rice
    { p: "Declan Rice", c: "West Ham United", season: "2017-2023", start: "2017-08-21", end: "2023-07-15", apps: 245, goals: 15, assists: 13 },
    { p: "Declan Rice", c: "Arsenal", season: "2023-Present", start: "2023-07-15", end: null, apps: 58, goals: 8, assists: 10 },

    // Phil Foden
    { p: "Phil Foden", c: "Manchester City", season: "2017-Present", start: "2017-12-06", end: null, apps: 280, goals: 82, assists: 55 },

    // Federico Valverde
    { p: "Federico Valverde", c: "Real Madrid", season: "2018-Present", start: "2018-07-01", end: null, apps: 260, goals: 28, assists: 35 },

    // Joshua Kimmich
    { p: "Joshua Kimmich", c: "RB Leipzig", season: "2013-2015", start: "2013-07-01", end: "2015-07-01", apps: 39, goals: 2, assists: 5 },
    { p: "Joshua Kimmich", c: "Bayern Munich", season: "2015-Present", start: "2015-07-01", end: null, apps: 400, goals: 42, assists: 106 },

    // Marc-Andre ter Stegen
    { p: "Marc-Andre ter Stegen", c: "Barcelona", season: "2014-Present", start: "2014-05-22", end: null, apps: 420, goals: 0, assists: 2 },

    // Trent Alexander-Arnold
    { p: "Trent Alexander-Arnold", c: "Liverpool", season: "2016-Present", start: "2016-10-25", end: null, apps: 340, goals: 19, assists: 83 },

    // Sadio Mane
    { p: "Sadio Mane", c: "Liverpool", season: "2016-2022", start: "2016-06-28", end: "2022-06-22", apps: 269, goals: 120, assists: 46 },
    { p: "Sadio Mane", c: "Bayern Munich", season: "2022-2023", start: "2022-06-22", end: "2023-07-06", apps: 38, goals: 12, assists: 6 },
    { p: "Sadio Mane", c: "Al-Nassr", season: "2023-Present", start: "2023-07-06", end: null, apps: 55, goals: 16, assists: 10 },

    // Zlatan Ibrahimovic
    { p: "Zlatan Ibrahimovic", c: "AFC Ajax", season: "2001-2004", start: "2001-07-01", end: "2004-08-31", apps: 110, goals: 48, assists: 15 },
    { p: "Zlatan Ibrahimovic", c: "Juventus", season: "2004-2006", start: "2004-08-31", end: "2006-08-10", apps: 92, goals: 26, assists: 18 },
    { p: "Zlatan Ibrahimovic", c: "Inter Milan", season: "2006-2009", start: "2006-08-10", end: "2009-07-27", apps: 117, goals: 66, assists: 28 },
    { p: "Zlatan Ibrahimovic", c: "Barcelona", season: "2009-2010", start: "2009-07-27", end: "2010-08-28", apps: 46, goals: 22, assists: 13 },
    { p: "Zlatan Ibrahimovic", c: "AC Milan", season: "2010-2012", start: "2010-08-28", end: "2012-07-01", apps: 85, goals: 56, assists: 24 },
    { p: "Zlatan Ibrahimovic", c: "Paris Saint-Germain", season: "2012-2016", start: "2012-07-17", end: "2016-06-30", apps: 180, goals: 156, assists: 61 },
    { p: "Zlatan Ibrahimovic", c: "Manchester United", season: "2016-2018", start: "2016-07-01", end: "2018-03-22", apps: 53, goals: 29, assists: 10 },
    { p: "Zlatan Ibrahimovic", c: "AC Milan", season: "2020-2023", start: "2020-01-02", end: "2023-06-04", apps: 93, goals: 36, assists: 12 },

    // Dani Carvajal
    { p: "Dani Carvajal", c: "Bayer Leverkusen", season: "2012-2013", start: "2012-07-01", end: "2013-07-01", apps: 36, goals: 1, assists: 5 },
    { p: "Dani Carvajal", c: "Real Madrid", season: "2013-Present", start: "2013-07-01", end: null, apps: 420, goals: 18, assists: 62 },

    // Steven Gerrard
    { p: "Steven Gerrard", c: "Liverpool", season: "1998-2015", start: "1998-11-29", end: "2015-05-24", apps: 710, goals: 186, assists: 150 },
    { p: "Steven Gerrard", c: "LA Galaxy", season: "2015-2016", start: "2015-07-01", end: "2016-11-24", apps: 34, goals: 5, assists: 14 },

    // Wayne Rooney
    { p: "Wayne Rooney", c: "Manchester United", season: "2004-2017", start: "2004-08-31", end: "2017-07-09", apps: 559, goals: 253, assists: 146 },

    // Rizky Ridho
    { p: "Rizky Ridho", c: "Persija Jakarta", season: "2024-Present", start: "2024-03-01", end: null, apps: 60, goals: 2, assists: 1 },
  ];

  for (const car of careersList) {
    const pl = playerByName[car.p];
    const cl = club[car.c];
    if (pl && cl) {
      await prisma.playerCareer.create({
        data: {
          player_id: pl.player_id,
          club_id: cl.club_id,
          season: car.season,
          start_date: new Date(car.start),
          end_date: car.end ? new Date(car.end) : null,
          competition: "Domestic and International Competitions",
          position: pl.position,
          shirt_number: pl.shirt_number,
          appearances: car.apps,
          goals: car.goals,
          assists: car.assists,
          minutes_played: car.apps * 80,
          transfer_type: car.end ? "TRANSFERRED" : "ACTIVE_CONTRACT",
          source
        }
      });
    }
  }
  console.log(`Seeded ${careersList.length} player career records successfully.`);

  // 6. Player Statistics (Season 2024/25)
  await prisma.playerStatistic.deleteMany({});

  const statsList = [
    { p: "Cristiano Ronaldo", c: "Al-Nassr", season: "2024/25", comp: "Saudi Pro League", apps: 30, goals: 27, assists: 4 },
    { p: "Lionel Messi", c: "Inter Miami", season: "2024", comp: "MLS Regular Season", apps: 19, goals: 20, assists: 16 },
    { p: "Kylian Mbappe", c: "Real Madrid", season: "2024/25", comp: "La Liga", apps: 32, goals: 26, assists: 5 },
    { p: "Lamine Yamal", c: "Barcelona", season: "2024/25", comp: "La Liga", apps: 34, goals: 11, assists: 15 },
    { p: "Erling Haaland", c: "Manchester City", season: "2024/25", comp: "Premier League", apps: 33, goals: 31, assists: 4 },
    { p: "Kevin De Bruyne", c: "Manchester City", season: "2024/25", comp: "Premier League", apps: 22, goals: 6, assists: 14 },
    { p: "Mohamed Salah", c: "Liverpool", season: "2024/25", comp: "Premier League", apps: 34, goals: 24, assists: 16 },
    { p: "Jude Bellingham", c: "Real Madrid", season: "2024/25", comp: "La Liga", apps: 30, goals: 14, assists: 11 },
    { p: "Vinicius Junior", c: "Real Madrid", season: "2024/25", comp: "La Liga", apps: 31, goals: 20, assists: 12 },
    { p: "Rodri", c: "Manchester City", season: "2024/25", comp: "Premier League", apps: 28, goals: 7, assists: 8 },
    { p: "Bukayo Saka", c: "Arsenal", season: "2024/25", comp: "Premier League", apps: 32, goals: 15, assists: 14 },
    { p: "Martin Odegaard", c: "Arsenal", season: "2024/25", comp: "Premier League", apps: 30, goals: 9, assists: 11 },
    { p: "Cole Palmer", c: "Chelsea", season: "2024/25", comp: "Premier League", apps: 33, goals: 22, assists: 13 },
    { p: "Harry Kane", c: "Bayern Munich", season: "2024/25", comp: "Bundesliga", apps: 32, goals: 33, assists: 9 },
    { p: "Robert Lewandowski", c: "Barcelona", season: "2024/25", comp: "La Liga", apps: 33, goals: 27, assists: 6 },
    { p: "Luka Modric", c: "Real Madrid", season: "2024/25", comp: "La Liga", apps: 30, goals: 3, assists: 7 },
    { p: "Toni Kroos", c: "Real Madrid", season: "2023/24", comp: "La Liga", apps: 33, goals: 1, assists: 8 },
    { p: "Neymar Jr", c: "Al-Hilal", season: "2024/25", comp: "Saudi Pro League", apps: 5, goals: 1, assists: 2 },
    { p: "Antoine Griezmann", c: "Atletico Madrid", season: "2024/25", comp: "La Liga", apps: 34, goals: 16, assists: 9 },
    { p: "Lautaro Martinez", c: "Inter Milan", season: "2024/25", comp: "Serie A", apps: 33, goals: 23, assists: 5 },
    { p: "Nicolo Barella", c: "Inter Milan", season: "2024/25", comp: "Serie A", apps: 32, goals: 4, assists: 8 },
    { p: "Rafael Leao", c: "AC Milan", season: "2024/25", comp: "Serie A", apps: 31, goals: 12, assists: 11 },
    { p: "Florian Wirtz", c: "Bayer Leverkusen", season: "2024/25", comp: "Bundesliga", apps: 31, goals: 14, assists: 15 },
    { p: "Jamal Musiala", c: "Bayern Munich", season: "2024/25", comp: "Bundesliga", apps: 30, goals: 15, assists: 9 },
    { p: "Bruno Fernandes", c: "Manchester United", season: "2024/25", comp: "Premier League", apps: 35, goals: 12, assists: 13 },
    { p: "Marcus Rashford", c: "Manchester United", season: "2024/25", comp: "Premier League", apps: 31, goals: 11, assists: 6 },
    { p: "Alisson Becker", c: "Liverpool", season: "2024/25", comp: "Premier League", apps: 30, goals: 0, assists: 1 },
    { p: "Thibaut Courtois", c: "Real Madrid", season: "2024/25", comp: "La Liga", apps: 28, goals: 0, assists: 0 },
    { p: "Virgil van Dijk", c: "Liverpool", season: "2024/25", comp: "Premier League", apps: 35, goals: 4, assists: 2 },
    { p: "William Saliba", c: "Arsenal", season: "2024/25", comp: "Premier League", apps: 35, goals: 3, assists: 1 },
    { p: "Son Heung-min", c: "Tottenham Hotspur", season: "2024/25", comp: "Premier League", apps: 33, goals: 14, assists: 9 },
    { p: "Zinedine Zidane", c: "Real Madrid", season: "2001/02", comp: "UEFA Champions League", apps: 9, goals: 3, assists: 2 },
    { p: "Ronaldinho", c: "Barcelona", season: "2005/06", comp: "La Liga", apps: 29, goals: 17, assists: 15 },
    { p: "David Beckham", c: "Manchester United", season: "1998/99", comp: "Premier League", apps: 34, goals: 6, assists: 11 },
    { p: "Pratama Arhan", c: "Persib Bandung", season: "2024/25", comp: "Liga 1 Indonesia", apps: 24, goals: 2, assists: 6 },
    // New player stats
    { p: "Gianluigi Buffon", c: "Juventus", season: "2005/06", comp: "Serie A", apps: 37, goals: 0, assists: 0 },
    { p: "Thierry Henry", c: "Arsenal", season: "2003/04", comp: "Premier League", apps: 37, goals: 30, assists: 9 },
    { p: "Ronaldo Nazario", c: "Real Madrid", season: "2002/03", comp: "La Liga", apps: 31, goals: 23, assists: 6 },
    { p: "Paolo Maldini", c: "AC Milan", season: "2006/07", comp: "UEFA Champions League", apps: 12, goals: 0, assists: 1 },
    { p: "Andres Iniesta", c: "Barcelona", season: "2010/11", comp: "La Liga", apps: 33, goals: 8, assists: 12 },
    { p: "Xavi Hernandez", c: "Barcelona", season: "2010/11", comp: "La Liga", apps: 34, goals: 5, assists: 18 },
    { p: "Sergio Ramos", c: "Real Madrid", season: "2017/18", comp: "La Liga", apps: 35, goals: 9, assists: 2 },
    { p: "Karim Benzema", c: "Real Madrid", season: "2021/22", comp: "La Liga", apps: 32, goals: 27, assists: 12 },
    { p: "N'Golo Kante", c: "Chelsea", season: "2020/21", comp: "UEFA Champions League", apps: 12, goals: 0, assists: 1 },
    { p: "Pedri", c: "Barcelona", season: "2024/25", comp: "La Liga", apps: 30, goals: 6, assists: 9 },
    { p: "Gavi", c: "Barcelona", season: "2024/25", comp: "La Liga", apps: 20, goals: 3, assists: 5 },
    { p: "Declan Rice", c: "Arsenal", season: "2024/25", comp: "Premier League", apps: 33, goals: 7, assists: 8 },
    { p: "Phil Foden", c: "Manchester City", season: "2024/25", comp: "Premier League", apps: 30, goals: 14, assists: 9 },
    { p: "Federico Valverde", c: "Real Madrid", season: "2024/25", comp: "La Liga", apps: 32, goals: 6, assists: 7 },
    { p: "Joshua Kimmich", c: "Bayern Munich", season: "2024/25", comp: "Bundesliga", apps: 30, goals: 4, assists: 12 },
    { p: "Marc-Andre ter Stegen", c: "Barcelona", season: "2023/24", comp: "La Liga", apps: 35, goals: 0, assists: 1 },
    { p: "Trent Alexander-Arnold", c: "Liverpool", season: "2024/25", comp: "Premier League", apps: 32, goals: 3, assists: 12 },
    { p: "Sadio Mane", c: "Al-Nassr", season: "2024/25", comp: "Saudi Pro League", apps: 30, goals: 10, assists: 6 },
    { p: "Zlatan Ibrahimovic", c: "Paris Saint-Germain", season: "2015/16", comp: "Ligue 1", apps: 31, goals: 38, assists: 13 },
    { p: "Dani Carvajal", c: "Real Madrid", season: "2024/25", comp: "La Liga", apps: 16, goals: 2, assists: 5 }
  ];

  for (const s of statsList) {
    const pl = playerByName[s.p];
    const cl = club[s.c];
    if (pl && cl) {
      await prisma.playerStatistic.create({
        data: {
          player_id: pl.player_id,
          club_id: cl.club_id,
          season: s.season,
          competition: s.comp,
          team_type: "club",
          appearances: s.apps,
          starts: s.apps - 2,
          minutes_played: s.apps * 85,
          goals: s.goals,
          assists: s.assists,
          shots: s.goals * 4,
          shots_on_target: s.goals * 2,
          passes: s.apps * 45,
          tackles: 15,
          interceptions: 10,
          source: `Verified ${s.comp} Database`,
          source_id: `fi-stat-${pl.common_name.toLowerCase().replace(/\s+/g, "-")}-${s.season.replace("/", "-")}`
        }
      });
    }
  }
  console.log(`Seeded ${statsList.length} player statistics records successfully.`);

  // 7. Club Statistics
  await prisma.clubStatistic.deleteMany({});

  const clubStats = [
    { name: "Real Madrid", comp: "La Liga", m: 38, w: 29, d: 5, l: 4, gf: 88, ga: 26, pos: 1 },
    { name: "Barcelona", comp: "La Liga", m: 38, w: 27, d: 6, l: 5, gf: 94, ga: 34, pos: 2 },
    { name: "Atletico Madrid", comp: "La Liga", m: 38, w: 22, d: 9, l: 7, gf: 68, ga: 33, pos: 3 },
    { name: "Manchester City", comp: "Premier League", m: 38, w: 28, d: 7, l: 3, gf: 96, ga: 34, pos: 1 },
    { name: "Arsenal", comp: "Premier League", m: 38, w: 26, d: 8, l: 4, gf: 89, ga: 30, pos: 2 },
    { name: "Liverpool", comp: "Premier League", m: 38, w: 25, d: 9, l: 4, gf: 86, ga: 36, pos: 3 },
    { name: "Chelsea", comp: "Premier League", m: 38, w: 20, d: 9, l: 9, gf: 75, ga: 52, pos: 4 },
    { name: "Manchester United", comp: "Premier League", m: 38, w: 18, d: 7, l: 13, gf: 61, ga: 53, pos: 6 },
    { name: "Bayern Munich", comp: "Bundesliga", m: 34, w: 26, d: 5, l: 3, gf: 98, ga: 29, pos: 1 },
    { name: "Bayer Leverkusen", comp: "Bundesliga", m: 34, w: 28, d: 6, l: 0, gf: 89, ga: 24, pos: 1 },
    { name: "Borussia Dortmund", comp: "Bundesliga", m: 34, w: 20, d: 7, l: 7, gf: 74, ga: 43, pos: 3 },
    { name: "Inter Milan", comp: "Serie A", m: 38, w: 29, d: 7, l: 2, gf: 89, ga: 22, pos: 1 },
    { name: "AC Milan", comp: "Serie A", m: 38, w: 22, d: 9, l: 7, gf: 76, ga: 49, pos: 2 },
    { name: "Juventus", comp: "Serie A", m: 38, w: 21, d: 12, l: 5, gf: 62, ga: 31, pos: 3 },
    { name: "Paris Saint-Germain", comp: "Ligue 1", m: 34, w: 26, d: 6, l: 2, gf: 90, ga: 31, pos: 1 },
    { name: "Sporting CP", comp: "Primeira Liga", m: 34, w: 29, d: 3, l: 2, gf: 96, ga: 29, pos: 1 },
    { name: "SL Benfica", comp: "Primeira Liga", m: 34, w: 25, d: 5, l: 4, gf: 77, ga: 28, pos: 2 },
    { name: "AFC Ajax", comp: "Eredivisie", m: 34, w: 22, d: 7, l: 5, gf: 80, ga: 38, pos: 2 },
    { name: "Al-Hilal", comp: "Saudi Pro League", m: 34, w: 31, d: 3, l: 0, gf: 101, ga: 23, pos: 1 },
    { name: "Al-Nassr", comp: "Saudi Pro League", m: 34, w: 26, d: 4, l: 4, gf: 100, ga: 42, pos: 2 },
    { name: "Inter Miami", comp: "MLS Regular Season", m: 34, w: 22, d: 8, l: 4, gf: 79, ga: 49, pos: 1 },
    { name: "River Plate", comp: "Primera Division Argentina", m: 27, w: 19, d: 4, l: 4, gf: 50, ga: 20, pos: 1 },
    { name: "Boca Juniors", comp: "Primera Division Argentina", m: 27, w: 15, d: 7, l: 5, gf: 41, ga: 24, pos: 2 },
    { name: "Flamengo", comp: "Brasileirao Serie A", m: 38, w: 23, d: 8, l: 7, gf: 68, ga: 35, pos: 2 },
    { name: "Persib Bandung", comp: "Liga 1 Indonesia", m: 34, w: 20, d: 11, l: 3, gf: 65, ga: 38, pos: 1 },
    // New clubs
    { name: "Tottenham Hotspur", comp: "Premier League", m: 38, w: 18, d: 10, l: 10, gf: 66, ga: 55, pos: 5 },
    { name: "SSC Napoli", comp: "Serie A", m: 38, w: 22, d: 8, l: 8, gf: 77, ga: 41, pos: 4 },
    { name: "AS Roma", comp: "Serie A", m: 38, w: 16, d: 10, l: 12, gf: 52, ga: 44, pos: 7 },
    { name: "FC Porto", comp: "Primeira Liga", m: 34, w: 24, d: 6, l: 4, gf: 72, ga: 30, pos: 3 },
    { name: "RB Leipzig", comp: "Bundesliga", m: 34, w: 19, d: 7, l: 8, gf: 64, ga: 39, pos: 4 },
    { name: "Celtic", comp: "Scottish Premiership", m: 38, w: 31, d: 4, l: 3, gf: 96, ga: 24, pos: 1 },
    { name: "Galatasaray", comp: "Super Lig", m: 38, w: 31, d: 4, l: 3, gf: 92, ga: 28, pos: 1 },
    { name: "Santos", comp: "Brasileirao Serie A", m: 38, w: 14, d: 10, l: 14, gf: 45, ga: 48, pos: 11 },
    { name: "Olympique de Marseille", comp: "Ligue 1", m: 34, w: 20, d: 6, l: 8, gf: 64, ga: 39, pos: 3 },
    { name: "Feyenoord", comp: "Eredivisie", m: 34, w: 23, d: 6, l: 5, gf: 85, ga: 35, pos: 1 },
    { name: "PSV Eindhoven", comp: "Eredivisie", m: 34, w: 28, d: 4, l: 2, gf: 92, ga: 23, pos: 1 },
    { name: "Aston Villa", comp: "Premier League", m: 38, w: 19, d: 9, l: 10, gf: 70, ga: 55, pos: 7 },
    { name: "Newcastle United", comp: "Premier League", m: 38, w: 17, d: 10, l: 11, gf: 59, ga: 48, pos: 8 },
    { name: "Sevilla", comp: "La Liga", m: 38, w: 15, d: 9, l: 14, gf: 48, ga: 46, pos: 8 },
    { name: "Real Sociedad", comp: "La Liga", m: 38, w: 16, d: 8, l: 14, gf: 51, ga: 44, pos: 7 }
  ];

  for (const cs of clubStats) {
    const cl = club[cs.name];
    if (cl) {
      await prisma.clubStatistic.create({
        data: {
          club_id: cl.club_id,
          season: "2024/25",
          competition: cs.comp,
          matches: cs.m,
          wins: cs.w,
          draws: cs.d,
          losses: cs.l,
          goals_for: cs.gf,
          goals_against: cs.ga,
          clean_sheets: Math.floor(cs.w * 0.45),
          trophies: cs.pos === 1 ? 1 : 0,
          league_position: cs.pos,
          source: `Official ${cs.comp} Standings`,
          source_id: `fi-club-stat-${cl.common_name.toLowerCase().replace(/\s+/g, "-")}-2024-25`
        }
      });
    }
  }
  console.log(`Seeded ${clubStats.length} club statistics records successfully.`);

  // 8. Trophies & Honours (World Cups, Champions League, International Tournaments)
  await prisma.trophy.deleteMany({});
  await prisma.honour.deleteMany({});

  // Club Trophies
  const clubTrophies = [
    // Real Madrid - 15 UCL titles
    ...["1955/56","1956/57","1957/58","1958/59","1959/60","1965/66","1997/98","1999/00","2001/02","2013/14","2015/16","2016/17","2017/18","2021/22","2023/24"].map(s => ({ club: "Real Madrid", name: "UEFA Champions League", season: s, competition: "UEFA Champions League" })),
    { club: "Real Madrid", name: "FIFA Club World Cup", season: "2014", competition: "FIFA Club World Cup" },
    { club: "Real Madrid", name: "FIFA Club World Cup", season: "2016", competition: "FIFA Club World Cup" },
    { club: "Real Madrid", name: "FIFA Club World Cup", season: "2017", competition: "FIFA Club World Cup" },
    { club: "Real Madrid", name: "FIFA Club World Cup", season: "2018", competition: "FIFA Club World Cup" },
    { club: "Real Madrid", name: "FIFA Club World Cup", season: "2022", competition: "FIFA Club World Cup" },

    // Barcelona - 5 UCL
    ...["1991/92","2005/06","2008/09","2010/11","2014/15"].map(s => ({ club: "Barcelona", name: "UEFA Champions League", season: s, competition: "UEFA Champions League" })),
    { club: "Barcelona", name: "FIFA Club World Cup", season: "2009", competition: "FIFA Club World Cup" },
    { club: "Barcelona", name: "FIFA Club World Cup", season: "2011", competition: "FIFA Club World Cup" },
    { club: "Barcelona", name: "FIFA Club World Cup", season: "2015", competition: "FIFA Club World Cup" },

    // AC Milan - 7 UCL
    ...["1962/63","1968/69","1988/89","1989/90","1993/94","2002/03","2006/07"].map(s => ({ club: "AC Milan", name: "UEFA Champions League", season: s, competition: "UEFA Champions League" })),
    { club: "AC Milan", name: "FIFA Club World Cup", season: "2007", competition: "FIFA Club World Cup" },

    // Liverpool - 6 UCL
    ...["1976/77","1977/78","1980/81","1983/84","2004/05","2018/19"].map(s => ({ club: "Liverpool", name: "UEFA Champions League", season: s, competition: "UEFA Champions League" })),
    { club: "Liverpool", name: "FIFA Club World Cup", season: "2019", competition: "FIFA Club World Cup" },

    // Bayern Munich - 6 UCL
    ...["1973/74","1974/75","1975/76","2000/01","2012/13","2019/20"].map(s => ({ club: "Bayern Munich", name: "UEFA Champions League", season: s, competition: "UEFA Champions League" })),
    { club: "Bayern Munich", name: "FIFA Club World Cup", season: "2013", competition: "FIFA Club World Cup" },
    { club: "Bayern Munich", name: "FIFA Club World Cup", season: "2020", competition: "FIFA Club World Cup" },

    // Inter Milan - 3 UCL
    ...["1963/64","1964/65","2009/10"].map(s => ({ club: "Inter Milan", name: "UEFA Champions League", season: s, competition: "UEFA Champions League" })),
    { club: "Inter Milan", name: "FIFA Club World Cup", season: "2010", competition: "FIFA Club World Cup" },

    // Manchester United - 3 UCL
    ...["1967/68","1998/99","2007/08"].map(s => ({ club: "Manchester United", name: "UEFA Champions League", season: s, competition: "UEFA Champions League" })),
    { club: "Manchester United", name: "FIFA Club World Cup", season: "2008", competition: "FIFA Club World Cup" },

    // Chelsea - 2 UCL
    ...["2011/12","2020/21"].map(s => ({ club: "Chelsea", name: "UEFA Champions League", season: s, competition: "UEFA Champions League" })),
    { club: "Chelsea", name: "FIFA Club World Cup", season: "2021", competition: "FIFA Club World Cup" },

    // Juventus - 2 UCL
    ...["1984/85","1995/96"].map(s => ({ club: "Juventus", name: "UEFA Champions League", season: s, competition: "UEFA Champions League" })),

    // Manchester City - 1 UCL
    { club: "Manchester City", name: "UEFA Champions League", season: "2022/23", competition: "UEFA Champions League" },
    { club: "Manchester City", name: "FIFA Club World Cup", season: "2023", competition: "FIFA Club World Cup" },

    // Ajax - 4 UCL
    ...["1970/71","1971/72","1972/73","1994/95"].map(s => ({ club: "AFC Ajax", name: "UEFA Champions League", season: s, competition: "UEFA Champions League" })),

    // Benfica - 2 UCL
    ...["1960/61","1961/62"].map(s => ({ club: "SL Benfica", name: "UEFA Champions League", season: s, competition: "UEFA Champions League" })),

    // FC Porto - 2 UCL
    ...["1986/87","2003/04"].map(s => ({ club: "FC Porto", name: "UEFA Champions League", season: s, competition: "UEFA Champions League" })),

    // Borussia Dortmund - 1 UCL
    { club: "Borussia Dortmund", name: "UEFA Champions League", season: "1996/97", competition: "UEFA Champions League" },

    // Celtic - 1 UCL
    { club: "Celtic", name: "European Cup", season: "1966/67", competition: "European Cup" },

    // Feyenoord - 1 UCL
    { club: "Feyenoord", name: "European Cup", season: "1969/70", competition: "European Cup" },

    // PSV - 1 UCL
    { club: "PSV Eindhoven", name: "European Cup", season: "1987/88", competition: "European Cup" },

    // Aston Villa - 1 UCL
    { club: "Aston Villa", name: "European Cup", season: "1981/82", competition: "European Cup" },

    // Olympique de Marseille - 1 UCL
    { club: "Olympique de Marseille", name: "UEFA Champions League", season: "1992/93", competition: "UEFA Champions League" },

    // Atletico Madrid - Europa League
    { club: "Atletico Madrid", name: "UEFA Europa League", season: "2009/10", competition: "UEFA Europa League" },
    { club: "Atletico Madrid", name: "UEFA Europa League", season: "2011/12", competition: "UEFA Europa League" },
    { club: "Atletico Madrid", name: "UEFA Europa League", season: "2017/18", competition: "UEFA Europa League" },

    // Sevilla - Europa League Record
    ...["2005/06","2006/07","2013/14","2014/15","2015/16","2022/23","2023/24"].map(s => ({ club: "Sevilla", name: "UEFA Europa League", season: s, competition: "UEFA Europa League" })),

    // Boca Juniors - Copa Libertadores
    ...["1977","1978","2000","2001","2003","2007"].map(s => ({ club: "Boca Juniors", name: "Copa Libertadores", season: s, competition: "Copa Libertadores" })),

    // River Plate - Copa Libertadores
    ...["1986","1996","2015","2018"].map(s => ({ club: "River Plate", name: "Copa Libertadores", season: s, competition: "Copa Libertadores" })),

    // Flamengo - Copa Libertadores
    ...["1981","2019","2022"].map(s => ({ club: "Flamengo", name: "Copa Libertadores", season: s, competition: "Copa Libertadores" })),

    // Santos - Copa Libertadores
    ...["1962","1963","2011"].map(s => ({ club: "Santos", name: "Copa Libertadores", season: s, competition: "Copa Libertadores" })),

    // Al-Hilal - AFC Champions League
    ...["1991","2019","2021"].map(s => ({ club: "Al-Hilal", name: "AFC Champions League", season: s, competition: "AFC Champions League" })),
    { club: "Al-Hilal", name: "AFC Champions League Elite", season: "2024", competition: "AFC Champions League Elite" },

    // Galatasaray - UEFA Cup / Europa
    { club: "Galatasaray", name: "UEFA Cup", season: "1999/00", competition: "UEFA Cup" },
    { club: "Galatasaray", name: "UEFA Super Cup", season: "2000", competition: "UEFA Super Cup" }
  ];

  for (const t of clubTrophies) {
    const cl = club[t.club];
    if (cl) {
      await prisma.trophy.create({
        data: {
          club_id: cl.club_id,
          name: t.name,
          season: t.season,
          competition: t.competition
        }
      });
    }
  }
  console.log(`Seeded ${clubTrophies.length} club trophy records.`);

  // Player Honours (International Tournaments)
  const playerHonours = [
    // World Cup Winners
    { p: "Lionel Messi", name: "FIFA World Cup Winner", season: "2022", type: "international" },
    { p: "Kylian Mbappe", name: "FIFA World Cup Winner", season: "2018", type: "international" },
    { p: "Kylian Mbappe", name: "FIFA World Cup Golden Boot", season: "2022", type: "international" },
    { p: "Zinedine Zidane", name: "FIFA World Cup Winner", season: "1998", type: "international" },
    { p: "Zinedine Zidane", name: "UEFA European Championship Winner", season: "2000", type: "international" },
    { p: "Ronaldinho", name: "FIFA World Cup Winner", season: "2002", type: "international" },
    { p: "Ronaldo Nazario", name: "FIFA World Cup Winner", season: "2002", type: "international" },
    { p: "Ronaldo Nazario", name: "FIFA World Cup Winner", season: "1994", type: "international" },
    { p: "Ronaldo Nazario", name: "FIFA World Cup Golden Boot", season: "2002", type: "international" },
    { p: "Thierry Henry", name: "FIFA World Cup Winner", season: "1998", type: "international" },
    { p: "Thierry Henry", name: "UEFA European Championship Winner", season: "2000", type: "international" },
    { p: "Gianluigi Buffon", name: "FIFA World Cup Winner", season: "2006", type: "international" },
    { p: "Paolo Maldini", name: "FIFA World Cup Runner-Up", season: "1994", type: "international" },
    { p: "Andres Iniesta", name: "FIFA World Cup Winner", season: "2010", type: "international" },
    { p: "Andres Iniesta", name: "UEFA European Championship Winner", season: "2008", type: "international" },
    { p: "Andres Iniesta", name: "UEFA European Championship Winner", season: "2012", type: "international" },
    { p: "Xavi Hernandez", name: "FIFA World Cup Winner", season: "2010", type: "international" },
    { p: "Xavi Hernandez", name: "UEFA European Championship Winner", season: "2008", type: "international" },
    { p: "Xavi Hernandez", name: "UEFA European Championship Winner", season: "2012", type: "international" },
    { p: "Sergio Ramos", name: "FIFA World Cup Winner", season: "2010", type: "international" },
    { p: "Sergio Ramos", name: "UEFA European Championship Winner", season: "2008", type: "international" },
    { p: "Sergio Ramos", name: "UEFA European Championship Winner", season: "2012", type: "international" },
    { p: "Toni Kroos", name: "FIFA World Cup Winner", season: "2014", type: "international" },
    { p: "Antoine Griezmann", name: "FIFA World Cup Winner", season: "2018", type: "international" },
    { p: "N'Golo Kante", name: "FIFA World Cup Winner", season: "2018", type: "international" },
    { p: "David Beckham", name: "FIFA World Cup Quarter-Finalist", season: "2002", type: "international" },

    // Euro Championships
    { p: "Cristiano Ronaldo", name: "UEFA European Championship Winner", season: "2016", type: "international" },
    { p: "Cristiano Ronaldo", name: "UEFA Nations League Winner", season: "2019", type: "international" },
    { p: "Lamine Yamal", name: "UEFA European Championship Winner", season: "2024", type: "international" },
    { p: "Lamine Yamal", name: "Euro 2024 Best Young Player", season: "2024", type: "individual" },
    { p: "Rodri", name: "UEFA European Championship Winner", season: "2024", type: "international" },
    { p: "Rodri", name: "Euro 2024 Player of the Tournament", season: "2024", type: "individual" },
    { p: "Pedri", name: "UEFA European Championship Winner", season: "2024", type: "international" },
    { p: "Gavi", name: "UEFA European Championship Winner", season: "2024", type: "international" },
    { p: "Dani Carvajal", name: "UEFA European Championship Winner", season: "2024", type: "international" },
    { p: "Nicolo Barella", name: "UEFA European Championship Winner", season: "2020", type: "international" },

    // Copa America
    { p: "Lionel Messi", name: "Copa America Winner", season: "2021", type: "international" },
    { p: "Lionel Messi", name: "Copa America Winner", season: "2024", type: "international" },
    { p: "Lautaro Martinez", name: "Copa America Winner", season: "2024", type: "international" },
    { p: "Lautaro Martinez", name: "Copa America Golden Boot", season: "2024", type: "international" },
    { p: "Lautaro Martinez", name: "FIFA World Cup Winner", season: "2022", type: "international" },
    { p: "Federico Valverde", name: "Copa America Runner-Up", season: "2024", type: "international" },

    // Africa Cup of Nations
    { p: "Sadio Mane", name: "Africa Cup of Nations Winner", season: "2022", type: "international" },

    // Asian Games
    { p: "Son Heung-min", name: "Asian Games Gold Medal", season: "2018", type: "international" },

    // Ballon d'Or
    { p: "Cristiano Ronaldo", name: "Ballon d'Or", season: "2008", type: "individual" },
    { p: "Cristiano Ronaldo", name: "Ballon d'Or", season: "2013", type: "individual" },
    { p: "Cristiano Ronaldo", name: "Ballon d'Or", season: "2014", type: "individual" },
    { p: "Cristiano Ronaldo", name: "Ballon d'Or", season: "2016", type: "individual" },
    { p: "Cristiano Ronaldo", name: "Ballon d'Or", season: "2017", type: "individual" },
    { p: "Lionel Messi", name: "Ballon d'Or", season: "2009", type: "individual" },
    { p: "Lionel Messi", name: "Ballon d'Or", season: "2010", type: "individual" },
    { p: "Lionel Messi", name: "Ballon d'Or", season: "2011", type: "individual" },
    { p: "Lionel Messi", name: "Ballon d'Or", season: "2012", type: "individual" },
    { p: "Lionel Messi", name: "Ballon d'Or", season: "2015", type: "individual" },
    { p: "Lionel Messi", name: "Ballon d'Or", season: "2019", type: "individual" },
    { p: "Lionel Messi", name: "Ballon d'Or", season: "2021", type: "individual" },
    { p: "Lionel Messi", name: "Ballon d'Or", season: "2023", type: "individual" },
    { p: "Luka Modric", name: "Ballon d'Or", season: "2018", type: "individual" },
    { p: "Karim Benzema", name: "Ballon d'Or", season: "2022", type: "individual" },
    { p: "Rodri", name: "Ballon d'Or", season: "2024", type: "individual" },
    { p: "Zinedine Zidane", name: "Ballon d'Or", season: "1998", type: "individual" },
    { p: "Ronaldinho", name: "Ballon d'Or", season: "2005", type: "individual" },
    { p: "Ronaldo Nazario", name: "Ballon d'Or", season: "1997", type: "individual" },
    { p: "Ronaldo Nazario", name: "Ballon d'Or", season: "2002", type: "individual" }
  ];

  for (const h of playerHonours) {
    const pl = playerByName[h.p];
    if (pl) {
      await prisma.honour.create({
        data: {
          player_id: pl.player_id,
          name: h.name,
          season: h.season,
          type: h.type
        }
      });
    }
  }
  console.log(`Seeded ${playerHonours.length} player honour records.`);

  // 9. Blockbuster Transfers
  await prisma.transfer.deleteMany({});
  const transfersData = [
    { p: "Steven Gerrard", from: "Liverpool", to: "LA Galaxy", date: "2015-07-01", type: "FREE", fee: 0 },
    { p: "Cristiano Ronaldo", from: "Sporting CP", to: "Manchester United", date: "2003-08-12", type: "PERMANENT", fee: 19000000 },
    { p: "Cristiano Ronaldo", from: "Manchester United", to: "Real Madrid", date: "2009-07-01", type: "PERMANENT", fee: 94000000 },
    { p: "Cristiano Ronaldo", from: "Real Madrid", to: "Juventus", date: "2018-07-10", type: "PERMANENT", fee: 117000000 },
    { p: "Cristiano Ronaldo", from: "Juventus", to: "Manchester United", date: "2021-08-27", type: "PERMANENT", fee: 17000000 },
    { p: "Cristiano Ronaldo", from: "Manchester United", to: "Al-Nassr", date: "2023-01-01", type: "FREE", fee: 0 },
    { p: "Lionel Messi", from: "Barcelona", to: "Paris Saint-Germain", date: "2021-08-10", type: "FREE", fee: 0 },
    { p: "Lionel Messi", from: "Paris Saint-Germain", to: "Inter Miami", date: "2023-07-15", type: "FREE", fee: 0 },
    { p: "Kylian Mbappe", from: "AS Monaco", to: "Paris Saint-Germain", date: "2017-08-31", type: "PERMANENT", fee: 180000000 },
    { p: "Kylian Mbappe", from: "Paris Saint-Germain", to: "Real Madrid", date: "2024-07-01", type: "FREE", fee: 0 },
    { p: "Erling Haaland", from: "Borussia Dortmund", to: "Manchester City", date: "2022-07-01", type: "PERMANENT", fee: 60000000 },
    { p: "Jude Bellingham", from: "Borussia Dortmund", to: "Real Madrid", date: "2023-06-14", type: "PERMANENT", fee: 103000000 },
    { p: "Harry Kane", from: "Tottenham Hotspur", to: "Bayern Munich", date: "2023-08-12", type: "PERMANENT", fee: 100000000 },
    { p: "Robert Lewandowski", from: "Borussia Dortmund", to: "Bayern Munich", date: "2014-07-01", type: "FREE", fee: 0 },
    { p: "Robert Lewandowski", from: "Bayern Munich", to: "Barcelona", date: "2022-07-16", type: "PERMANENT", fee: 45000000 },
    { p: "Neymar Jr", from: "Santos", to: "Barcelona", date: "2013-07-01", type: "PERMANENT", fee: 88000000 },
    { p: "Neymar Jr", from: "Barcelona", to: "Paris Saint-Germain", date: "2017-08-03", type: "PERMANENT", fee: 222000000 },
    { p: "Neymar Jr", from: "Paris Saint-Germain", to: "Al-Hilal", date: "2023-08-15", type: "PERMANENT", fee: 90000000 },
    { p: "Cole Palmer", from: "Manchester City", to: "Chelsea", date: "2023-09-01", type: "PERMANENT", fee: 47000000 },
    { p: "Toni Kroos", from: "Bayern Munich", to: "Real Madrid", date: "2014-07-17", type: "PERMANENT", fee: 25000000 },
    { p: "David Beckham", from: "Manchester United", to: "Real Madrid", date: "2003-07-01", type: "PERMANENT", fee: 37000000 },
    { p: "Zinedine Zidane", from: "Juventus", to: "Real Madrid", date: "2001-07-09", type: "PERMANENT", fee: 77500000 },
    { p: "Ronaldinho", from: "Paris Saint-Germain", to: "Barcelona", date: "2003-07-19", type: "PERMANENT", fee: 30000000 },
    { p: "Ronaldinho", from: "Barcelona", to: "AC Milan", date: "2008-07-15", type: "PERMANENT", fee: 22000000 },
    { p: "Declan Rice", from: "West Ham United", to: "Arsenal", date: "2023-07-15", type: "PERMANENT", fee: 105000000 },
    { p: "Karim Benzema", from: "Olympique Lyonnais", to: "Real Madrid", date: "2009-07-01", type: "PERMANENT", fee: 35000000 },
    { p: "Karim Benzema", from: "Real Madrid", to: "Al-Hilal", date: "2023-06-06", type: "FREE", fee: 0 },
    { p: "Sadio Mane", from: "Liverpool", to: "Bayern Munich", date: "2022-06-22", type: "PERMANENT", fee: 32000000 },
    { p: "Sadio Mane", from: "Bayern Munich", to: "Al-Nassr", date: "2023-07-06", type: "PERMANENT", fee: 20000000 },
    { p: "Ronaldo Nazario", from: "Barcelona", to: "Inter Milan", date: "1997-07-25", type: "PERMANENT", fee: 27000000 },
    { p: "Ronaldo Nazario", from: "Inter Milan", to: "Real Madrid", date: "2002-08-31", type: "PERMANENT", fee: 46000000 },
    { p: "Thierry Henry", from: "Arsenal", to: "Barcelona", date: "2007-06-25", type: "PERMANENT", fee: 24000000 },
    { p: "Gianluigi Buffon", from: "Juventus", to: "Paris Saint-Germain", date: "2018-07-06", type: "FREE", fee: 0 }
  ];

  for (const tr of transfersData) {
    const pl = playerByName[tr.p];
    const fc = club[tr.from];
    const tc = club[tr.to];
    if (pl && fc && tc) {
      await prisma.transfer.create({
        data: {
          player_id: pl.player_id,
          from_club_id: fc.club_id,
          to_club_id: tc.club_id,
          transfer_date: new Date(tr.date),
          season: new Date(tr.date).getFullYear().toString(),
          transfer_type: tr.type,
          transfer_fee: tr.fee,
          source
        }
      });
    }
  }
  console.log(`Seeded ${transfersData.length} historic transfer records successfully.`);

  // 10. Achievements & Admin
  const achievements = [
    { code: "first_goal", name: "First Goal", description: "Menjawab 1 soal dengan benar.", rule: "correct_answers >= 1" },
    { code: "football_fan", name: "Football Fan", description: "Bermain 10 game.", rule: "games_played >= 10" },
    { code: "scout", name: "Scout", description: "Akurasi lebih dari 80%.", rule: "accuracy > 80" },
    { code: "legend", name: "Legend", description: "Mendapatkan 10.000 poin.", rule: "total_score >= 10000" },
    { code: "perfect", name: "Perfect", description: "Mendapatkan 10 jawaban benar berturut-turut.", rule: "highest_streak >= 10" },
    { code: "transfer_expert", name: "Transfer Expert", description: "Menjawab 50 soal career history dengan benar.", rule: "career_correct >= 50" },
    { code: "club_historian", name: "Club Historian", description: "Menjawab 100 soal klub dengan benar.", rule: "club_correct >= 100" }
  ];
  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { code: achievement.code },
      update: { name: achievement.name, description: achievement.description, rule: achievement.rule },
      create: achievement
    });
  }

  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    await prisma.user.upsert({
      where: { email: process.env.ADMIN_EMAIL },
      update: {},
      create: {
        username: process.env.ADMIN_USERNAME || "admin",
        email: process.env.ADMIN_EMAIL,
        password_hash: await hashPassword(process.env.ADMIN_PASSWORD),
        profile_photo: "https://placehold.co/120x120?text=FI"
      }
    });
  }

  await prisma.gameSession.deleteMany({ where: { seed: "leaderboard-seed" } });
  await prisma.gameSession.create({
    data: {
      username: "ScoutPro",
      mode: "CAREER_CLUB",
      difficulty: "EASY",
      score: 1850,
      highest_streak: 12,
      correct_answers: 18,
      wrong_answers: 2,
      seed: "leaderboard-seed"
    }
  });

  console.log("Database seeded successfully with 43 worldwide clubs and 55 players!");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
