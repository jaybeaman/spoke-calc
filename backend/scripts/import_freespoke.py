#!/usr/bin/env python3
"""
Import rim and hub data from Freespoke database.
Run this after initial database setup to populate reference data.
"""

import sys
import os
import time
import httpx
from bs4 import BeautifulSoup

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, engine, Base
from app.models.rim import Rim
from app.models.hub import Hub

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

BASE_URL = "https://kstoerz.com/freespoke"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; SpokeCalc/1.0; Scenic Routes Bicycle Center)"
}


def scrape_rims(db, limit_pages=None):
    """Scrape rim data from Freespoke."""
    print("Scraping rims from Freespoke...")

    page = 1
    total_imported = 0

    while True:
        if limit_pages and page > limit_pages:
            break

        url = f"{BASE_URL}/rims?page={page}"
        print(f"  Fetching page {page}...")

        try:
            response = httpx.get(url, headers=HEADERS, timeout=30)
            response.raise_for_status()
        except Exception as e:
            print(f"  Error fetching page {page}: {e}")
            break

        soup = BeautifulSoup(response.text, "html.parser")

        # Find the table rows
        table = soup.find("table")
        if not table:
            print("  No table found, stopping")
            break

        rows = table.find_all("tr")[1:]  # Skip header row
        if not rows:
            print("  No more rows found, stopping")
            break

        for row in rows:
            cells = row.find_all("td")
            if len(cells) < 8:
                continue

            try:
                # Parse the row data
                manufacturer = cells[0].get_text(strip=True)
                model = cells[1].get_text(strip=True)
                iso_size_text = cells[2].get_text(strip=True)
                erd_text = cells[3].get_text(strip=True)
                offset_text = cells[4].get_text(strip=True)
                outer_width_text = cells[5].get_text(strip=True)
                inner_width_text = cells[6].get_text(strip=True)
                weight_text = cells[7].get_text(strip=True) if len(cells) > 7 else ""

                # Skip if missing critical data
                if not manufacturer or not model or not erd_text:
                    continue

                # Check if already exists
                existing = db.query(Rim).filter(
                    Rim.manufacturer == manufacturer,
                    Rim.model == model,
                    Rim.is_reference == True
                ).first()

                if existing:
                    continue

                # Parse numeric values
                iso_size = int(iso_size_text) if iso_size_text.isdigit() else None
                erd = float(erd_text) if erd_text else None
                offset = float(offset_text) if offset_text and offset_text != "-" else 0
                outer_width = float(outer_width_text) if outer_width_text and outer_width_text != "-" else None
                inner_width = float(inner_width_text) if inner_width_text and inner_width_text != "-" else None
                weight = float(weight_text) if weight_text and weight_text != "-" else None

                if erd is None:
                    continue

                rim = Rim(
                    manufacturer=manufacturer,
                    model=model,
                    iso_size=iso_size,
                    erd=erd,
                    drilling_offset=offset,
                    outer_width=outer_width,
                    inner_width=inner_width,
                    weight=weight,
                    is_reference=True
                )
                db.add(rim)
                total_imported += 1

            except Exception as e:
                print(f"  Error parsing row: {e}")
                continue

        db.commit()
        print(f"  Page {page} complete, {total_imported} rims imported so far")

        # Check for next page
        next_link = soup.find("a", string="Next")
        if not next_link:
            break

        page += 1
        time.sleep(0.5)  # Be polite

    print(f"Finished importing {total_imported} rims")
    return total_imported


def scrape_hubs(db, limit_pages=None):
    """Scrape hub data from Freespoke."""
    print("Scraping hubs from Freespoke...")

    page = 1
    total_imported = 0

    while True:
        if limit_pages and page > limit_pages:
            break

        url = f"{BASE_URL}/hubs?page={page}"
        print(f"  Fetching page {page}...")

        try:
            response = httpx.get(url, headers=HEADERS, timeout=30)
            response.raise_for_status()
        except Exception as e:
            print(f"  Error fetching page {page}: {e}")
            break

        soup = BeautifulSoup(response.text, "html.parser")

        # Find the table rows
        table = soup.find("table")
        if not table:
            print("  No table found, stopping")
            break

        rows = table.find_all("tr")[1:]  # Skip header row
        if not rows:
            print("  No more rows found, stopping")
            break

        for row in rows:
            cells = row.find_all("td")
            if len(cells) < 6:
                continue

            try:
                # Parse the row data (adjust based on actual table structure)
                manufacturer = cells[0].get_text(strip=True)
                model = cells[1].get_text(strip=True)
                position = cells[2].get_text(strip=True).lower() if len(cells) > 2 else None

                # The table structure varies - try to get flange data
                # This may need adjustment based on actual HTML structure
                flange_diameter_text = cells[3].get_text(strip=True) if len(cells) > 3 else ""
                offset_left_text = cells[4].get_text(strip=True) if len(cells) > 4 else ""
                offset_right_text = cells[5].get_text(strip=True) if len(cells) > 5 else ""

                # Skip if missing critical data
                if not manufacturer or not model:
                    continue

                # Check if already exists
                existing = db.query(Hub).filter(
                    Hub.manufacturer == manufacturer,
                    Hub.model == model,
                    Hub.is_reference == True
                ).first()

                if existing:
                    continue

                # Parse numeric values - hub tables often have combined or split flange data
                flange_diameter = None
                offset_left = None
                offset_right = None

                try:
                    flange_diameter = float(flange_diameter_text) if flange_diameter_text and flange_diameter_text != "-" else None
                except:
                    pass

                try:
                    offset_left = float(offset_left_text) if offset_left_text and offset_left_text != "-" else None
                except:
                    pass

                try:
                    offset_right = float(offset_right_text) if offset_right_text and offset_right_text != "-" else None
                except:
                    pass

                # Only import if we have at least some useful data
                if flange_diameter is None and offset_left is None:
                    continue

                hub = Hub(
                    manufacturer=manufacturer,
                    model=model,
                    position=position if position in ["front", "rear"] else None,
                    flange_diameter_left=flange_diameter or 0,
                    flange_diameter_right=flange_diameter or 0,
                    flange_offset_left=offset_left or 0,
                    flange_offset_right=offset_right or offset_left or 0,
                    is_reference=True
                )
                db.add(hub)
                total_imported += 1

            except Exception as e:
                print(f"  Error parsing row: {e}")
                continue

        db.commit()
        print(f"  Page {page} complete, {total_imported} hubs imported so far")

        # Check for next page
        next_link = soup.find("a", string="Next")
        if not next_link:
            break

        page += 1
        time.sleep(0.5)  # Be polite

    print(f"Finished importing {total_imported} hubs")
    return total_imported


def add_sample_data(db):
    """Add some common sample data if scraping fails or for testing."""
    print("Adding sample reference data...")

    # Sample rims
    sample_rims = [
        {"manufacturer": "Velocity", "model": "A23", "iso_size": 622, "erd": 600, "inner_width": 19},
        {"manufacturer": "Velocity", "model": "Blunt 35", "iso_size": 622, "erd": 596, "inner_width": 29},
        {"manufacturer": "DT Swiss", "model": "R460", "iso_size": 622, "erd": 598, "inner_width": 18},
        {"manufacturer": "DT Swiss", "model": "R470", "iso_size": 622, "erd": 599, "inner_width": 19},
        {"manufacturer": "H Plus Son", "model": "Archetype", "iso_size": 622, "erd": 600, "inner_width": 18},
        {"manufacturer": "H Plus Son", "model": "TB14", "iso_size": 622, "erd": 602, "inner_width": 14},
        {"manufacturer": "Mavic", "model": "Open Pro", "iso_size": 622, "erd": 602, "inner_width": 15},
        {"manufacturer": "Sun", "model": "CR18", "iso_size": 622, "erd": 600, "inner_width": 18},
        {"manufacturer": "Alex", "model": "DM18", "iso_size": 622, "erd": 600, "inner_width": 18},
        {"manufacturer": "WTB", "model": "KOM i25", "iso_size": 622, "erd": 600, "inner_width": 25},
    ]

    for rim_data in sample_rims:
        existing = db.query(Rim).filter(
            Rim.manufacturer == rim_data["manufacturer"],
            Rim.model == rim_data["model"]
        ).first()
        if not existing:
            rim = Rim(**rim_data, is_reference=True)
            db.add(rim)

    # Sample hubs
    sample_hubs = [
        {"manufacturer": "Shimano", "model": "105 R7000 Front", "position": "front",
         "flange_diameter_left": 45, "flange_diameter_right": 45,
         "flange_offset_left": 35, "flange_offset_right": 35, "spoke_count": 32},
        {"manufacturer": "Shimano", "model": "105 R7000 Rear", "position": "rear",
         "flange_diameter_left": 45, "flange_diameter_right": 45,
         "flange_offset_left": 20.5, "flange_offset_right": 37.5, "spoke_count": 32},
        {"manufacturer": "Shimano", "model": "Ultegra R8000 Front", "position": "front",
         "flange_diameter_left": 45, "flange_diameter_right": 45,
         "flange_offset_left": 35, "flange_offset_right": 35, "spoke_count": 32},
        {"manufacturer": "Shimano", "model": "Ultegra R8000 Rear", "position": "rear",
         "flange_diameter_left": 45, "flange_diameter_right": 45,
         "flange_offset_left": 20.5, "flange_offset_right": 37.5, "spoke_count": 32},
        {"manufacturer": "DT Swiss", "model": "350 Front", "position": "front",
         "flange_diameter_left": 52, "flange_diameter_right": 52,
         "flange_offset_left": 34.5, "flange_offset_right": 34.5, "spoke_count": 32},
        {"manufacturer": "DT Swiss", "model": "350 Rear", "position": "rear",
         "flange_diameter_left": 52, "flange_diameter_right": 52,
         "flange_offset_left": 19.4, "flange_offset_right": 37.8, "spoke_count": 32},
        {"manufacturer": "White Industries", "model": "T11 Front", "position": "front",
         "flange_diameter_left": 58, "flange_diameter_right": 58,
         "flange_offset_left": 32.5, "flange_offset_right": 32.5, "spoke_count": 32},
        {"manufacturer": "Phil Wood", "model": "High Flange Track", "position": "front",
         "flange_diameter_left": 66, "flange_diameter_right": 66,
         "flange_offset_left": 35, "flange_offset_right": 35, "spoke_count": 32},
        {"manufacturer": "Chris King", "model": "R45 Front", "position": "front",
         "flange_diameter_left": 54, "flange_diameter_right": 54,
         "flange_offset_left": 33.65, "flange_offset_right": 33.65, "spoke_count": 32},
        {"manufacturer": "Hope", "model": "RS4 Front", "position": "front",
         "flange_diameter_left": 58, "flange_diameter_right": 58,
         "flange_offset_left": 33.5, "flange_offset_right": 33.5, "spoke_count": 32},
    ]

    for hub_data in sample_hubs:
        existing = db.query(Hub).filter(
            Hub.manufacturer == hub_data["manufacturer"],
            Hub.model == hub_data["model"]
        ).first()
        if not existing:
            hub = Hub(**hub_data, is_reference=True)
            db.add(hub)

    db.commit()
    print("Sample data added successfully")


def main():
    db = SessionLocal()

    try:
        # Try to scrape from Freespoke
        rims_count = scrape_rims(db, limit_pages=20)  # Limit for initial import
        hubs_count = scrape_hubs(db, limit_pages=20)

        # If scraping didn't get much data, add sample data
        if rims_count < 10 or hubs_count < 10:
            print("Scraping returned limited data, adding sample data...")
            add_sample_data(db)

        print("\nImport complete!")
        print(f"  Total rims in database: {db.query(Rim).count()}")
        print(f"  Total hubs in database: {db.query(Hub).count()}")

    finally:
        db.close()


if __name__ == "__main__":
    main()
