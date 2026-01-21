#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ÉLŐ Mérkőzések és Odds Letöltő
Lekérdezi az aktuális élő és közelgő mérkőzéseket az odds-okkal
Margin elemzéshez
"""

import requests
import json
import os
from datetime import datetime, timedelta

def fetch_live_matches(api_key):
    """
    Lekérdezi az élő és közelgő mérkőzéseket az API-ról
    """
    
    print("🔴 ÉLŐ MÉRKŐZÉSEK LETÖLTÉSE")
    print("="*70)
    
    if not api_key:
        print("❌ Hiba: API kulcs kötelező!")
        print("📝 Regisztrálj: https://the-odds-api.com/")
        return False
    
    # Ligák
    sports = {
        'soccer_epl': 'Premier League',
        'soccer_spain_la_liga': 'La Liga',
        'soccer_germany_bundesliga': 'Bundesliga',
        'soccer_italy_serie_a': 'Serie A',
        'soccer_france_ligue_one': 'Ligue 1',
        'soccer_uefa_champs_league': 'Champions League',
        'soccer_uefa_europa_league': 'Europa League'
    }
    
    all_matches = []
    total_requests = 0
    
    print(f"\n🔍 Élő és közelgő mérkőzések keresése {len(sports)} bajnokságban...")
    print("-"*70)
    
    for sport_key, league_name in sports.items():
        try:
            url = f'https://api.the-odds-api.com/v4/sports/{sport_key}/odds/'
            params = {
                'apiKey': api_key,
                'regions': 'eu',
                'markets': 'h2h',
                'oddsFormat': 'decimal',
                'bookmakers': 'bet365,williamhill,betfair'  # Top bookmakers
            }
            
            print(f"⚽ {league_name}...", end=' ', flush=True)
            response = requests.get(url, params=params, timeout=15)
            total_requests += 1
            
            if response.status_code == 200:
                matches = response.json()
                count = 0
                
                for match in matches:
                    home_team = match.get('home_team', '')
                    away_team = match.get('away_team', '')
                    commence_time = match.get('commence_time', '')
                    
                    # Csak 48 órán belüli mérkőzések
                    try:
                        match_time = datetime.fromisoformat(commence_time.replace('Z', '+00:00'))
                        hours_until = (match_time - datetime.now(match_time.tzinfo)).total_seconds() / 3600
                        
                        if hours_until > 48:
                            continue
                            
                        time_status = "🔴 ÉLŐ" if hours_until < 0 else f"⏰ {int(hours_until)}h"
                    except:
                        time_status = "⏰ Hamarosan"
                    
                    # Több bookmaker odds-ainak összegyűjtése
                    bookmakers_data = []
                    
                    if match.get('bookmakers'):
                        for bookmaker in match['bookmakers']:
                            bookie_name = bookmaker.get('title', 'Unknown')
                            market = bookmaker.get('markets', [{}])[0]
                            outcomes = market.get('outcomes', [])
                            
                            odds_home = None
                            odds_draw = None
                            odds_away = None
                            
                            for outcome in outcomes:
                                name = outcome.get('name', '')
                                price = outcome.get('price', 0)
                                
                                if name == home_team:
                                    odds_home = price
                                elif name == 'Draw':
                                    odds_draw = price
                                elif name == away_team:
                                    odds_away = price
                            
                            if odds_home and odds_draw and odds_away:
                                # Margin számítás
                                implied_home = 1 / odds_home
                                implied_draw = 1 / odds_draw
                                implied_away = 1 / odds_away
                                margin = (implied_home + implied_draw + implied_away - 1) * 100
                                
                                bookmakers_data.append({
                                    'bookmaker': bookie_name,
                                    'odds_home': round(odds_home, 2),
                                    'odds_draw': round(odds_draw, 2),
                                    'odds_away': round(odds_away, 2),
                                    'margin': round(margin, 2)
                                })
                    
                    if bookmakers_data:
                        # Átlag margin számítás
                        avg_margin = sum(b['margin'] for b in bookmakers_data) / len(bookmakers_data)
                        
                        # Dátum formázás
                        try:
                            date_str = match_time.strftime('%Y-%m-%d %H:%M')
                        except:
                            date_str = commence_time[:16]
                        
                        all_matches.append({
                            'date': date_str,
                            'status': time_status,
                            'league': league_name,
                            'home_team': home_team,
                            'away_team': away_team,
                            'bookmakers': bookmakers_data,
                            'avg_margin': round(avg_margin, 2),
                            'num_bookmakers': len(bookmakers_data)
                        })
                        count += 1
                
                if count > 0:
                    print(f"✅ {count} mérkőzés")
                else:
                    print(f"⚠️ Nincs élő/közelgő mérkőzés")
                
            elif response.status_code == 401:
                print(f"❌ API kulcs érvénytelen!")
                return False
            elif response.status_code == 429:
                print(f"⚠️ Rate limit!")
                break
            else:
                print(f"❌ Hiba: {response.status_code}")
        
        except Exception as e:
            print(f"❌ Hiba: {e}")
    
    print("-"*70)
    
    if not all_matches:
        print("\n❌ Nem található élő vagy közelgő mérkőzés!")
        print("💡 Próbáld újra később, amikor közelebb vannak a meccsek.")
        return False
    
    print(f"\n📊 ÖSSZESÍTÉS:")
    print(f"   ✅ Összes mérkőzés: {len(all_matches)}")
    print(f"   🌐 API kérések: {total_requests}")
    
    # Remaining requests
    if 'response' in locals() and response.headers.get('x-requests-remaining'):
        remaining = response.headers.get('x-requests-remaining')
        print(f"   🔢 Fennmaradó kérések: {remaining}")
    
    # Margin statisztikák
    margins = [m['avg_margin'] for m in all_matches]
    if margins:
        print(f"\n💰 MARGIN STATISZTIKÁK:")
        print(f"   Átlag: {sum(margins)/len(margins):.2f}%")
        print(f"   Min: {min(margins):.2f}%")
        print(f"   Max: {max(margins):.2f}%")
    
    # Mentés
    print("\n💾 Mentés...")
    os.makedirs('data', exist_ok=True)
    
    json_path = 'data/live_matches.json'
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump({
            'updated': datetime.now().isoformat(),
            'total_matches': len(all_matches),
            'matches': all_matches
        }, f, indent=2, ensure_ascii=False)
    
    print(f"   ✅ JSON: {json_path}")
    
    # Ligánként
    print(f"\n🏆 Bajnokságonként:")
    league_counts = {}
    for match in all_matches:
        league = match['league']
        league_counts[league] = league_counts.get(league, 0) + 1
    
    for league, count in sorted(league_counts.items(), key=lambda x: x[1], reverse=True):
        print(f"   {league}: {count} mérkőzés")
    
    # Élő vs Közelgő
    live_count = sum(1 for m in all_matches if '🔴' in m['status'])
    upcoming_count = len(all_matches) - live_count
    print(f"\n⏰ Státusz:")
    print(f"   🔴 Élő: {live_count}")
    print(f"   ⏰ Közelgő: {upcoming_count}")
    
    print("\n✅ KÉSZ! Az élő adatok frissítve!")
    print("🌐 Nyisd meg: http://localhost:8000/margins.html")
    
    return True


def main():
    print("⚽ ÉLŐ MÉRKŐZÉS LETÖLTŐ - The Odds API")
    print("="*70)
    print("Lekérdezi az élő és közelgő (48h) mérkőzéseket margin elemzéshez\n")
    
    api_key = input("🔑 Add meg az API kulcsodat: ").strip()
    
    if not api_key:
        print("\n❌ Nincs API kulcs!")
        print("📝 Regisztrálj: https://the-odds-api.com/")
        return
    
    success = fetch_live_matches(api_key)
    
    if success:
        print("\n" + "="*70)
        print("✨ Sikeres letöltés! Frissítsd a böngészőt (Ctrl+Shift+R)")
        print("💡 Futtasd újra 15-30 percenként a friss odds-okért!")
    else:
        print("\n" + "="*70)
        print("❌ Nem sikerült adatot letölteni")


if __name__ == "__main__":
    main()
