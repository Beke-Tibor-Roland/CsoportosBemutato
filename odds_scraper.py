#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Labdarúgás Odds Scraper
Gyűjt fogadási szorzó (odds) adatokat különböző forrásokból
a Stratégia Szimulátor oldalhoz
"""

import requests
import json
import csv
from datetime import datetime, timedelta
from bs4 import BeautifulSoup
import time
import random

class OddsScraper:
    """Odds adat gyűjtő osztály több forrásból"""
    
    def __init__(self):
        self.data = []
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    
    def scrape_odds_api(self, api_key=None):
        """
        The Odds API használata (Ingyenes tier: 500 request/hó)
        Regisztráció: https://the-odds-api.com/
        """
        if not api_key:
            print("⚠️ API kulcs szükséges. Regisztrálj: https://the-odds-api.com/")
            print("💡 Használd: scraper.scrape_odds_api('YOUR_API_KEY')")
            return []
        
        print("📡 The Odds API lekérdezés...")
        
        # Elérhető sportok: soccer_epl, soccer_spain_la_liga, soccer_germany_bundesliga, stb.
        sports = ['soccer_epl', 'soccer_spain_la_liga', 'soccer_germany_bundesliga', 
                  'soccer_italy_serie_a', 'soccer_france_ligue_one']
        
        all_matches = []
        
        for sport in sports:
            try:
                url = f'https://api.the-odds-api.com/v4/sports/{sport}/odds/'
                params = {
                    'apiKey': api_key,
                    'regions': 'eu',  # Európai odds
                    'markets': 'h2h',  # Head to head (1X2)
                    'oddsFormat': 'decimal'
                }
                
                response = requests.get(url, params=params, timeout=10)
                
                if response.status_code == 200:
                    matches = response.json()
                    print(f"✅ {sport}: {len(matches)} mérkőzés")
                    
                    for match in matches:
                        home_team = match['home_team']
                        away_team = match['away_team']
                        commence_time = match['commence_time']
                        
                        # Odds kinyerése (első bookmaker)
                        if match['bookmakers']:
                            bookmaker = match['bookmakers'][0]
                            outcomes = bookmaker['markets'][0]['outcomes']
                            
                            odds_home = next((o['price'] for o in outcomes if o['name'] == home_team), None)
                            odds_draw = next((o['price'] for o in outcomes if o['name'] == 'Draw'), None)
                            odds_away = next((o['price'] for o in outcomes if o['name'] == away_team), None)
                            
                            all_matches.append({
                                'date': commence_time,
                                'league': sport.replace('soccer_', '').upper(),
                                'home_team': home_team,
                                'away_team': away_team,
                                'odds_home': odds_home,
                                'odds_draw': odds_draw,
                                'odds_away': odds_away,
                                'bookmaker': bookmaker['title']
                            })
                    
                    time.sleep(1)  # Rate limiting
                else:
                    print(f"❌ {sport}: Hiba {response.status_code}")
                    
            except Exception as e:
                print(f"❌ {sport} hiba: {e}")
        
        self.data.extend(all_matches)
        return all_matches
    
    def scrape_football_data(self):
        """
        Football-Data.co.uk - Ingyenes történelmi adatok
        Nem szükséges API kulcs!
        """
        print("📊 Football-Data.co.uk scraping...")
        
        base_url = "https://www.football-data.co.uk/mmz4281"
        
        # Legfrissebb szezon
        current_year = datetime.now().year
        season = f"{current_year-1}{str(current_year)[2:]}"
        
        # Különböző ligák
        leagues = {
            'E0': 'Premier League',
            'SP1': 'La Liga',
            'D1': 'Bundesliga',
            'I1': 'Serie A',
            'F1': 'Ligue 1'
        }
        
        all_matches = []
        
        for code, league_name in leagues.items():
            try:
                url = f"{base_url}/{season}/{code}.csv"
                print(f"🔍 Letöltés: {league_name}...")
                
                response = requests.get(url, headers=self.headers, timeout=10)
                
                if response.status_code == 200:
                    # CSV feldolgozás
                    lines = response.text.strip().split('\n')
                    reader = csv.DictReader(lines)
                    
                    count = 0
                    for row in reader:
                        try:
                            # Csak ha van odds adat
                            if 'B365H' in row and row['B365H']:
                                match_data = {
                                    'date': row.get('Date', ''),
                                    'league': league_name,
                                    'home_team': row.get('HomeTeam', ''),
                                    'away_team': row.get('AwayTeam', ''),
                                    'odds_home': float(row.get('B365H', 0)),
                                    'odds_draw': float(row.get('B365D', 0)),
                                    'odds_away': float(row.get('B365A', 0)),
                                    'home_goals': int(row.get('FTHG', 0)),
                                    'away_goals': int(row.get('FTAG', 0)),
                                    'result': row.get('FTR', ''),
                                    'bookmaker': 'Bet365'
                                }
                                all_matches.append(match_data)
                                count += 1
                        except (ValueError, KeyError) as e:
                            continue
                    
                    print(f"✅ {league_name}: {count} mérkőzés")
                    time.sleep(0.5)  # Udvarias delay
                    
                else:
                    print(f"❌ {league_name}: Nem érhető el (HTTP {response.status_code})")
                    
            except Exception as e:
                print(f"❌ {league_name} hiba: {e}")
        
        self.data.extend(all_matches)
        return all_matches
    
    def generate_sample_data(self, num_matches=100):
        """
        Minta adatok generálása teszteléshez
        Használd ezt, ha nincs API kulcsod vagy netes hozzáférésed
        """
        print(f"🎲 {num_matches} minta mérkőzés generálása...")
        
        teams = [
            'Manchester City', 'Liverpool', 'Chelsea', 'Arsenal', 'Tottenham',
            'Barcelona', 'Real Madrid', 'Atletico Madrid', 'Sevilla',
            'Bayern Munich', 'Dortmund', 'RB Leipzig',
            'Juventus', 'AC Milan', 'Inter Milan',
            'PSG', 'Monaco', 'Lyon'
        ]
        
        leagues = ['Premier League', 'La Liga', 'Bundesliga', 'Serie A', 'Ligue 1']
        
        matches = []
        start_date = datetime.now() - timedelta(days=365)
        
        for i in range(num_matches):
            # Random csapatok
            home, away = random.sample(teams, 2)
            league = random.choice(leagues)
            
            # Reális odds generálás
            # Hazai előny figyelembevételével
            base_odds_home = random.uniform(1.5, 3.5)
            odds_draw = random.uniform(2.8, 4.0)
            
            # Away odds inverze a valószínűségeknek
            total_prob = (1/base_odds_home) + (1/odds_draw)
            odds_away = 1 / (1 - total_prob)
            
            # Eredmény szimuláció az odds alapján
            rand = random.random()
            if rand < 1/base_odds_home:
                result = 'H'
                home_goals = random.randint(1, 4)
                away_goals = random.randint(0, home_goals-1)
            elif rand < (1/base_odds_home + 1/odds_draw):
                result = 'D'
                goals = random.randint(0, 3)
                home_goals = away_goals = goals
            else:
                result = 'A'
                away_goals = random.randint(1, 4)
                home_goals = random.randint(0, away_goals-1)
            
            match_date = start_date + timedelta(days=i*3)
            
            matches.append({
                'date': match_date.strftime('%d/%m/%Y'),
                'league': league,
                'home_team': home,
                'away_team': away,
                'odds_home': round(base_odds_home, 2),
                'odds_draw': round(odds_draw, 2),
                'odds_away': round(odds_away, 2),
                'home_goals': home_goals,
                'away_goals': away_goals,
                'result': result,
                'bookmaker': 'Simulated'
            })
        
        print(f"✅ {len(matches)} minta mérkőzés kész")
        self.data.extend(matches)
        return matches
    
    def save_to_csv(self, filename='data/odds_data.csv'):
        """Adatok mentése CSV fájlba"""
        if not self.data:
            print("❌ Nincs adat a mentéshez!")
            return
        
        print(f"💾 Mentés: {filename}")
        
        try:
            # Mappa létrehozása ha nem létezik
            import os
            os.makedirs(os.path.dirname(filename), exist_ok=True)
            
            with open(filename, 'w', newline='', encoding='utf-8') as f:
                fieldnames = ['date', 'league', 'home_team', 'away_team', 
                            'odds_home', 'odds_draw', 'odds_away',
                            'home_goals', 'away_goals', 'result', 'bookmaker']
                
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(self.data)
            
            print(f"✅ {len(self.data)} mérkőzés elmentve!")
            
        except Exception as e:
            print(f"❌ Mentési hiba: {e}")
    
    def save_to_json(self, filename='data/odds_data.json'):
        """Adatok mentése JSON fájlba (frontend használatra)"""
        if not self.data:
            print("❌ Nincs adat a mentéshez!")
            return
        
        print(f"💾 JSON mentés: {filename}")
        
        try:
            import os
            os.makedirs(os.path.dirname(filename), exist_ok=True)
            
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(self.data, f, indent=2, ensure_ascii=False)
            
            print(f"✅ {len(self.data)} mérkőzés JSON-ba mentve!")
            
        except Exception as e:
            print(f"❌ JSON mentési hiba: {e}")
    
    def get_summary(self):
        """Statisztikák az összegyűjtött adatokról"""
        if not self.data:
            print("❌ Nincs adat!")
            return
        
        print("\n" + "="*50)
        print("📊 ADATOK ÖSSZEFOGLALÁSA")
        print("="*50)
        print(f"Összes mérkőzés: {len(self.data)}")
        
        leagues = {}
        for match in self.data:
            league = match.get('league', 'Unknown')
            leagues[league] = leagues.get(league, 0) + 1
        
        print("\n🏆 Bajnokságonként:")
        for league, count in sorted(leagues.items(), key=lambda x: x[1], reverse=True):
            print(f"  {league}: {count} mérkőzés")
        
        # Átlag odds
        if self.data:
            avg_home = sum(m.get('odds_home', 0) for m in self.data if m.get('odds_home')) / len(self.data)
            avg_draw = sum(m.get('odds_draw', 0) for m in self.data if m.get('odds_draw')) / len(self.data)
            avg_away = sum(m.get('odds_away', 0) for m in self.data if m.get('odds_away')) / len(self.data)
            
            print(f"\n💰 Átlag Odds:")
            print(f"  Hazai: {avg_home:.2f}")
            print(f"  Döntetlen: {avg_draw:.2f}")
            print(f"  Vendég: {avg_away:.2f}")
        
        print("="*50 + "\n")


def main():
    """Fő program"""
    print("⚽ LABDARÚGÁS ODDS SCRAPER")
    print("="*50)
    
    scraper = OddsScraper()
    
    print("\nVálassz módszert:")
    print("1. The Odds API (API kulcs szükséges)")
    print("2. Football-Data.co.uk (ingyenes, történelmi)")
    print("3. Minta adatok generálása (tesztelés)")
    print("4. Mind a három!")
    
    choice = input("\nVálasztás (1-4): ").strip()
    
    if choice == '1':
        api_key = input("Add meg az API kulcsod: ").strip()
        scraper.scrape_odds_api(api_key)
    
    elif choice == '2':
        scraper.scrape_football_data()
    
    elif choice == '3':
        num = input("Hány mérkőzést generáljak? (alapért: 100): ").strip()
        num = int(num) if num.isdigit() else 100
        scraper.generate_sample_data(num)
    
    elif choice == '4':
        print("\n🚀 Teljes adatgyűjtés indítása...\n")
        
        # 1. Football-Data (ingyenes)
        scraper.scrape_football_data()
        
        # 2. Minta adatok kiegészítésként
        scraper.generate_sample_data(50)
        
        # 3. The Odds API (ha van kulcs)
        use_api = input("\nVan The Odds API kulcsod? (i/n): ").strip().lower()
        if use_api == 'i':
            api_key = input("API kulcs: ").strip()
            scraper.scrape_odds_api(api_key)
    
    else:
        print("❌ Érvénytelen választás!")
        return
    
    # Eredmények
    scraper.get_summary()
    
    # Mentés
    if scraper.data:
        scraper.save_to_csv()
        scraper.save_to_json()
        print("\n✅ Kész! Használd az adatokat a Stratégia Szimulátor oldalon!")
    else:
        print("\n❌ Nem sikerült adatot gyűjteni!")


if __name__ == "__main__":
    main()
