#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Válogatottak Gólstatisztika Elemző
Kiszámítja minden válogatott számára:
- Összes mérkőzés száma
- Összes lőtt gól
- Átlagos gólszám mérkőzésenként
"""

import csv
import json
from collections import defaultdict

def analyze_team_stats(csv_file='data/adatokfoci.csv'):
    """
    Elemzi a válogatottak statisztikáit a CSV fájlból
    
    Args:
        csv_file: Az adatokfoci.csv fájl elérési útja
        
    Returns:
        dict: Csapat statisztikák (meccsek, gólok, átlag)
    """
    
    # Statisztikák tárolása minden csapat számára
    team_stats = defaultdict(lambda: {'matches': 0, 'goals': 0})
    
    print(f"📊 Adatok beolvasása: {csv_file}")
    
    try:
        # Próbáljuk több kódolással is
        encodings = ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1']
        file_content = None
        
        for encoding in encodings:
            try:
                with open(csv_file, 'r', encoding=encoding) as file:
                    file_content = file.read()
                print(f"✅ Sikeres kódolás: {encoding}")
                break
            except UnicodeDecodeError:
                continue
        
        if file_content is None:
            print(f"❌ Nem sikerült dekódolni a fájlt")
            return {}
        
        # Most dolgozzuk fel a tartalmat
        csv_reader = csv.reader(file_content.splitlines())
        
        line_count = 0
        for row in csv_reader:
            line_count += 1
            
            # Ellenőrizzük, hogy van-e elég oszlop
            if len(row) < 5:
                print(f"⚠️  Sor {line_count}: Hiányos adat, kihagyva")
                continue
            
            try:
                # B oszlop: Hazai csapat (index 1)
                home_team = row[1].strip()
                # C oszlop: Vendég csapat (index 2)
                away_team = row[2].strip()
                # D oszlop: Hazai gólok (index 3)
                home_goals = int(row[3])
                # E oszlop: Vendég gólok (index 4)
                away_goals = int(row[4])
                
                # Hazai csapat statisztikái
                team_stats[home_team]['matches'] += 1
                team_stats[home_team]['goals'] += home_goals
                
                # Vendég csapat statisztikái
                team_stats[away_team]['matches'] += 1
                team_stats[away_team]['goals'] += away_goals
                
            except (ValueError, IndexError) as e:
                print(f"⚠️  Sor {line_count}: Hibás formátum - {e}")
                continue
        
        print(f"✅ {line_count} sor feldolgozva")
            
    except FileNotFoundError:
        print(f"❌ HIBA: A fájl nem található: {csv_file}")
        return {}
    except Exception as e:
        print(f"❌ HIBA az olvasás során: {e}")
        return {}
    
    # Átlagok számítása
    results = {}
    for team, stats in team_stats.items():
        if stats['matches'] > 0:
            average = stats['goals'] / stats['matches']
            results[team] = {
                'team_name': team,
                'total_matches': stats['matches'],
                'total_goals': stats['goals'],
                'average_goals_per_match': round(average, 2)
            }
    
    return results

def save_results(results, output_file='data/team_stats.json'):
    """
    Elmenti az eredményeket JSON fájlba
    
    Args:
        results: A csapat statisztikák dictionary
        output_file: Kimeneti fájl neve
    """
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
        print(f"💾 Eredmények mentve: {output_file}")
    except Exception as e:
        print(f"❌ HIBA a mentés során: {e}")

def print_top_teams(results, top_n=10):
    """
    Kiírja a top csapatokat átlagos gólszám alapján
    
    Args:
        results: A csapat statisztikák
        top_n: Hány csapatot mutasson
    """
    # Rendezés átlagos gólok szerint csökkenő sorrendben
    sorted_teams = sorted(
        results.values(), 
        key=lambda x: x['average_goals_per_match'], 
        reverse=True
    )
    
    print(f"\n🏆 TOP {top_n} CSAPAT (Átlagos gól/meccs alapján):")
    print("=" * 80)
    print(f"{'#':<4} {'Csapat':<30} {'Meccsek':<12} {'Össz Gól':<12} {'Átlag':<10}")
    print("-" * 80)
    
    for i, team in enumerate(sorted_teams[:top_n], 1):
        print(f"{i:<4} {team['team_name']:<30} {team['total_matches']:<12} "
              f"{team['total_goals']:<12} {team['average_goals_per_match']:<10.2f}")
    
    print("=" * 80)

def print_statistics(results):
    """
    Általános statisztikák kiírása
    
    Args:
        results: A csapat statisztikák
    """
    total_teams = len(results)
    total_matches = sum(team['total_matches'] for team in results.values()) // 2  # Minden meccs kétszer van számolva
    total_goals = sum(team['total_goals'] for team in results.values())
    avg_goals_per_match = total_goals / (total_matches * 2) if total_matches > 0 else 0
    
    print(f"\n📈 ÁLTALÁNOS STATISZTIKÁK:")
    print("=" * 80)
    print(f"Összes válogatott:           {total_teams}")
    print(f"Összes mérkőzés:             {total_matches}")
    print(f"Összes lőtt gól:             {total_goals}")
    print(f"Átlagos gól/meccs (global):  {avg_goals_per_match:.2f}")
    print("=" * 80)

def main():
    """
    Főprogram
    """
    print("⚽ VÁLOGATOTTAK GÓLSTATISZTIKA ELEMZŐ")
    print("=" * 80)
    
    # Statisztikák elemzése
    results = analyze_team_stats()
    
    if not results:
        print("❌ Nincs feldolgozható adat!")
        return
    
    # Eredmények mentése
    save_results(results)
    
    # Statisztikák kiírása
    print_statistics(results)
    print_top_teams(results, top_n=15)
    
    # Néhány példa csapat kiírása
    print(f"\n📋 PÉLDA CSAPATOK:")
    print("=" * 80)
    example_teams = ['Hungary', 'Germany', 'Brazil', 'England', 'Spain']
    for team_name in example_teams:
        if team_name in results:
            team = results[team_name]
            print(f"{team['team_name']:<20} - Meccsek: {team['total_matches']:<5} "
                  f"Gólok: {team['total_goals']:<5} Átlag: {team['average_goals_per_match']:.2f}")
    print("=" * 80)
    
    print(f"\n✅ Elkészült! Az adatok elérhetők: data/team_stats.json")

if __name__ == "__main__":
    main()
