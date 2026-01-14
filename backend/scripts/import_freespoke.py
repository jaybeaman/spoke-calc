#!/usr/bin/env python3
"""
Import rim and hub data from Freespoke database.
Run this after initial database setup to populate reference data.

Uses Playwright for JavaScript-rendered pages (Freespoke uses Blazor).
"""

import sys
import os
import time

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, engine, Base
from app.models.rim import Rim
from app.models.hub import Hub

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

BASE_URL = "https://kstoerz.com/freespoke"

# Try to import Playwright, fall back to sample data only if not available
try:
    from playwright.sync_api import sync_playwright
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False
    print("Playwright not installed - will use sample data only")
    print("To enable web scraping: pip install playwright && playwright install chromium")


def scrape_rims_with_playwright(db, browser, max_pages=50):
    """Scrape rim data from Freespoke using Playwright."""
    print("Scraping rims from Freespoke...")

    page_num = 1
    total_imported = 0
    context = browser.new_context()
    page = context.new_page()

    while page_num <= max_pages:
        url = f"{BASE_URL}/rims?Page={page_num}"
        print(f"  Fetching page {page_num}...")

        try:
            page.goto(url, wait_until="networkidle", timeout=30000)
            # Give Blazor a moment to render after network idle
            page.wait_for_timeout(1000)
        except Exception as e:
            print(f"  Error loading page {page_num}: {e}")
            break

        # Get all data rows
        rows = page.query_selector_all("table tbody tr")
        if not rows:
            print("  No data rows found, stopping")
            break

        print(f"  Found {len(rows)} rows on page {page_num}")

        rows_processed = 0
        skipped_short = 0
        skipped_empty = 0
        for idx, row in enumerate(rows):
            cells = row.query_selector_all("td")
            if len(cells) < 8:
                skipped_short += 1
                if idx < 3:
                    print(f"    Row {idx}: only {len(cells)} cells")
                continue

            try:
                # Freespoke columns: Manufacturer, Model, ISO, ERD, Offset drilling, Offset (avg), Outer width, Inner width, Height, Weight, Action
                manufacturer = cells[0].inner_text().strip()
                model = cells[1].inner_text().strip()
                iso_size_text = cells[2].inner_text().strip()
                erd_text = cells[3].inner_text().strip()
                offset_text = cells[5].inner_text().strip() if len(cells) > 5 else "0"
                outer_width_text = cells[6].inner_text().strip() if len(cells) > 6 else ""
                inner_width_text = cells[7].inner_text().strip() if len(cells) > 7 else ""
                weight_text = cells[9].inner_text().strip() if len(cells) > 9 else ""

                if idx < 3:
                    print(f"    Row {idx}: {manufacturer} / {model} / ERD={erd_text}")

                if not manufacturer or not model or not erd_text:
                    skipped_empty += 1
                    continue

                # Check if already exists
                existing = db.query(Rim).filter(
                    Rim.manufacturer == manufacturer,
                    Rim.model == model,
                    Rim.is_reference == True
                ).first()

                if existing:
                    rows_processed += 1
                    continue

                # Parse numeric values
                iso_size = int(iso_size_text) if iso_size_text.isdigit() else None

                try:
                    erd = float(erd_text.replace(",", "."))
                except (ValueError, AttributeError):
                    erd = None

                try:
                    offset = float(offset_text.replace(",", ".")) if offset_text and offset_text != "-" else 0
                except ValueError:
                    offset = 0

                try:
                    outer_width = float(outer_width_text.replace(",", ".")) if outer_width_text and outer_width_text != "-" else None
                except ValueError:
                    outer_width = None

                try:
                    inner_width = float(inner_width_text.replace(",", ".")) if inner_width_text and inner_width_text != "-" else None
                except ValueError:
                    inner_width = None

                try:
                    weight_clean = weight_text.replace("g", "").replace(",", ".").strip()
                    weight = float(weight_clean) if weight_clean and weight_clean != "-" else None
                except ValueError:
                    weight = None

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
                rows_processed += 1

            except Exception as e:
                print(f"  Error parsing row: {e}")
                continue

        db.commit()
        print(f"  Page {page_num} complete: {total_imported} imported, {skipped_short} skipped (short), {skipped_empty} skipped (empty)")

        if rows_processed == 0 and skipped_short == len(rows):
            print("  All rows skipped (probably wrong page structure), stopping")
            break

        page_num += 1
        time.sleep(0.3)

    context.close()
    print(f"Finished importing {total_imported} rims")
    return total_imported


def parse_lr_value(text):
    """Parse values like '56 L, 47 R' or just '45' into (left, right) tuple."""
    if not text or text == "-":
        return None, None

    text = text.replace(",", ".").strip()

    # Check for "L" and "R" pattern (e.g., "56 L, 47 R" or "56L, 47R")
    import re
    lr_match = re.search(r'([\d.]+)\s*L.*?([\d.]+)\s*R', text, re.IGNORECASE)
    if lr_match:
        try:
            return float(lr_match.group(1)), float(lr_match.group(2))
        except ValueError:
            pass

    # Also try R...L pattern
    rl_match = re.search(r'([\d.]+)\s*R.*?([\d.]+)\s*L', text, re.IGNORECASE)
    if rl_match:
        try:
            return float(rl_match.group(2)), float(rl_match.group(1))
        except ValueError:
            pass

    # Single value - return same for both
    try:
        val = float(re.sub(r'[^\d.]', '', text))
        return val, val
    except ValueError:
        return None, None


def scrape_hubs_with_playwright(db, browser, max_pages=50):
    """Scrape hub data from Freespoke using Playwright."""
    print("Scraping hubs from Freespoke...")

    page_num = 1
    total_imported = 0
    context = browser.new_context()
    page = context.new_page()

    while page_num <= max_pages:
        url = f"{BASE_URL}/hubs?Page={page_num}"
        print(f"  Fetching page {page_num}...")

        try:
            page.goto(url, wait_until="networkidle", timeout=30000)
            # Give Blazor a moment to render after network idle
            page.wait_for_timeout(1000)
        except Exception as e:
            print(f"  Error loading page {page_num}: {e}")
            break

        rows = page.query_selector_all("table tbody tr")
        if not rows:
            print("  No data rows found, stopping")
            break

        print(f"  Found {len(rows)} rows on page {page_num}")

        rows_processed = 0
        for row in rows:
            cells = row.query_selector_all("td")
            if len(cells) < 6:
                continue

            try:
                # Freespoke hub columns: Manufacturer, Model, Position, OLN, Axle Type, Brake Type,
                #                        Drive Type, Flange Diameter, Mid-flange Offset, Weight
                manufacturer = cells[0].inner_text().strip()
                model = cells[1].inner_text().strip()
                position_text = cells[2].inner_text().strip().lower() if len(cells) > 2 else ""
                flange_dia_text = cells[7].inner_text().strip() if len(cells) > 7 else ""
                offset_text = cells[8].inner_text().strip() if len(cells) > 8 else ""

                if not manufacturer or not model:
                    continue

                position = None
                if "front" in position_text:
                    position = "front"
                elif "rear" in position_text:
                    position = "rear"

                existing = db.query(Hub).filter(
                    Hub.manufacturer == manufacturer,
                    Hub.model == model,
                    Hub.position == position,
                    Hub.is_reference == True
                ).first()

                if existing:
                    rows_processed += 1
                    continue

                flange_left, flange_right = parse_lr_value(flange_dia_text)
                offset_left, offset_right = parse_lr_value(offset_text)

                if flange_left is None and offset_left is None:
                    continue

                hub = Hub(
                    manufacturer=manufacturer,
                    model=model,
                    position=position,
                    flange_diameter_left=flange_left or 0,
                    flange_diameter_right=flange_right or flange_left or 0,
                    flange_offset_left=abs(offset_left) if offset_left else 0,
                    flange_offset_right=abs(offset_right) if offset_right else (abs(offset_left) if offset_left else 0),
                    is_reference=True
                )
                db.add(hub)
                total_imported += 1
                rows_processed += 1

            except Exception as e:
                print(f"  Error parsing row: {e}")
                continue

        db.commit()
        print(f"  Page {page_num} complete, {total_imported} hubs imported so far")

        if rows_processed == 0:
            break

        page_num += 1
        time.sleep(0.3)

    context.close()
    print(f"Finished importing {total_imported} hubs")
    return total_imported


def add_sample_data(db):
    """Add common sample data - comprehensive list of popular rims and hubs."""
    print("Adding sample reference data...")

    # Comprehensive sample rims - popular road, gravel, and MTB rims
    sample_rims = [
        # Velocity rims
        {"manufacturer": "Velocity", "model": "A23", "iso_size": 622, "erd": 600, "inner_width": 19},
        {"manufacturer": "Velocity", "model": "A23 OC", "iso_size": 622, "erd": 600, "inner_width": 19, "drilling_offset": 2.5},
        {"manufacturer": "Velocity", "model": "Blunt 35", "iso_size": 622, "erd": 596, "inner_width": 29},
        {"manufacturer": "Velocity", "model": "Quill", "iso_size": 622, "erd": 604, "inner_width": 18},
        {"manufacturer": "Velocity", "model": "Aileron", "iso_size": 622, "erd": 602, "inner_width": 17},
        {"manufacturer": "Velocity", "model": "Deep V", "iso_size": 622, "erd": 578, "inner_width": 14},
        {"manufacturer": "Velocity", "model": "Cliffhanger", "iso_size": 559, "erd": 535, "inner_width": 29},
        # DT Swiss rims
        {"manufacturer": "DT Swiss", "model": "R460", "iso_size": 622, "erd": 598, "inner_width": 18},
        {"manufacturer": "DT Swiss", "model": "R470", "iso_size": 622, "erd": 599, "inner_width": 19},
        {"manufacturer": "DT Swiss", "model": "RR411", "iso_size": 622, "erd": 599, "inner_width": 18},
        {"manufacturer": "DT Swiss", "model": "RR421", "iso_size": 622, "erd": 599, "inner_width": 21},
        {"manufacturer": "DT Swiss", "model": "RR511", "iso_size": 622, "erd": 597, "inner_width": 18},
        {"manufacturer": "DT Swiss", "model": "GR531", "iso_size": 622, "erd": 595, "inner_width": 25},
        {"manufacturer": "DT Swiss", "model": "XR331", "iso_size": 559, "erd": 535, "inner_width": 22.5},
        {"manufacturer": "DT Swiss", "model": "XM481", "iso_size": 584, "erd": 559, "inner_width": 30},
        {"manufacturer": "DT Swiss", "model": "EX511", "iso_size": 584, "erd": 559, "inner_width": 30},
        # H Plus Son rims
        {"manufacturer": "H Plus Son", "model": "Archetype", "iso_size": 622, "erd": 600, "inner_width": 18},
        {"manufacturer": "H Plus Son", "model": "TB14", "iso_size": 622, "erd": 602, "inner_width": 14},
        {"manufacturer": "H Plus Son", "model": "The Hydra", "iso_size": 622, "erd": 594, "inner_width": 25},
        {"manufacturer": "H Plus Son", "model": "Eero", "iso_size": 622, "erd": 595, "inner_width": 23},
        {"manufacturer": "H Plus Son", "model": "SL42", "iso_size": 622, "erd": 588, "inner_width": 18},
        {"manufacturer": "H Plus Son", "model": "Formation Face", "iso_size": 622, "erd": 592, "inner_width": 22},
        # Mavic rims
        {"manufacturer": "Mavic", "model": "Open Pro", "iso_size": 622, "erd": 602, "inner_width": 15},
        {"manufacturer": "Mavic", "model": "Open Pro UST", "iso_size": 622, "erd": 600, "inner_width": 17},
        {"manufacturer": "Mavic", "model": "A119", "iso_size": 622, "erd": 600, "inner_width": 19},
        {"manufacturer": "Mavic", "model": "A319", "iso_size": 622, "erd": 596, "inner_width": 21},
        {"manufacturer": "Mavic", "model": "XM819", "iso_size": 559, "erd": 535, "inner_width": 19},
        # Sun/Ringle rims
        {"manufacturer": "Sun", "model": "CR18", "iso_size": 622, "erd": 600, "inner_width": 18},
        {"manufacturer": "Sun Ringle", "model": "Rhyno Lite", "iso_size": 559, "erd": 535, "inner_width": 19},
        {"manufacturer": "Sun Ringle", "model": "MTX33", "iso_size": 559, "erd": 535, "inner_width": 28},
        {"manufacturer": "Sun Ringle", "model": "Duroc 50", "iso_size": 584, "erd": 560, "inner_width": 50},
        # Alex rims
        {"manufacturer": "Alex", "model": "DM18", "iso_size": 622, "erd": 600, "inner_width": 18},
        {"manufacturer": "Alex", "model": "DA22", "iso_size": 622, "erd": 596, "inner_width": 22},
        {"manufacturer": "Alex", "model": "DM24", "iso_size": 559, "erd": 535, "inner_width": 24},
        {"manufacturer": "Alex", "model": "Adventurer 2", "iso_size": 622, "erd": 600, "inner_width": 18},
        # WTB rims
        {"manufacturer": "WTB", "model": "KOM Light i25", "iso_size": 622, "erd": 600, "inner_width": 25},
        {"manufacturer": "WTB", "model": "KOM i23", "iso_size": 622, "erd": 600, "inner_width": 23},
        {"manufacturer": "WTB", "model": "Scraper i45", "iso_size": 584, "erd": 559, "inner_width": 45},
        {"manufacturer": "WTB", "model": "Asym i29", "iso_size": 584, "erd": 560, "inner_width": 29, "drilling_offset": 3},
        {"manufacturer": "WTB", "model": "ST i25", "iso_size": 559, "erd": 535, "inner_width": 25},
        # Stan's NoTubes rims
        {"manufacturer": "Stan's NoTubes", "model": "Arch S1", "iso_size": 584, "erd": 559, "inner_width": 26},
        {"manufacturer": "Stan's NoTubes", "model": "Crest S1", "iso_size": 584, "erd": 559, "inner_width": 21},
        {"manufacturer": "Stan's NoTubes", "model": "Flow S1", "iso_size": 584, "erd": 559, "inner_width": 29},
        {"manufacturer": "Stan's NoTubes", "model": "Grail S1", "iso_size": 622, "erd": 596, "inner_width": 24},
        # Ryde/Rigida rims
        {"manufacturer": "Ryde", "model": "Andra 40", "iso_size": 622, "erd": 590, "inner_width": 21},
        {"manufacturer": "Ryde", "model": "Zac 19", "iso_size": 622, "erd": 602, "inner_width": 19},
        {"manufacturer": "Ryde", "model": "Trace 25", "iso_size": 622, "erd": 596, "inner_width": 25},
        # Kinlin/Pacenti rims
        {"manufacturer": "Kinlin", "model": "XR31T", "iso_size": 622, "erd": 594, "inner_width": 21},
        {"manufacturer": "Kinlin", "model": "XR22T", "iso_size": 622, "erd": 600, "inner_width": 17},
        {"manufacturer": "Kinlin", "model": "XR27T", "iso_size": 622, "erd": 596, "inner_width": 19},
        {"manufacturer": "Pacenti", "model": "SL25", "iso_size": 622, "erd": 600, "inner_width": 25},
        {"manufacturer": "Pacenti", "model": "Brevet", "iso_size": 622, "erd": 596, "inner_width": 27},
        # Industry Nine rims
        {"manufacturer": "Industry Nine", "model": "Trail S", "iso_size": 584, "erd": 559, "inner_width": 28},
        {"manufacturer": "Industry Nine", "model": "Enduro S", "iso_size": 584, "erd": 559, "inner_width": 32},
        {"manufacturer": "Industry Nine", "model": "Grade", "iso_size": 622, "erd": 596, "inner_width": 24},
        # Spank rims
        {"manufacturer": "Spank", "model": "Oozy Trail 295", "iso_size": 584, "erd": 557, "inner_width": 29.5},
        {"manufacturer": "Spank", "model": "Spike 350", "iso_size": 584, "erd": 558, "inner_width": 35},
        # Enve rims
        {"manufacturer": "Enve", "model": "SES 3.4", "iso_size": 622, "erd": 590, "inner_width": 21},
        {"manufacturer": "Enve", "model": "M525", "iso_size": 584, "erd": 556, "inner_width": 25},
        {"manufacturer": "Enve", "model": "G23", "iso_size": 622, "erd": 598, "inner_width": 23},
    ]

    for rim_data in sample_rims:
        existing = db.query(Rim).filter(
            Rim.manufacturer == rim_data["manufacturer"],
            Rim.model == rim_data["model"]
        ).first()
        if not existing:
            rim = Rim(**rim_data, is_reference=True)
            db.add(rim)

    # Comprehensive sample hubs
    sample_hubs = [
        # Shimano road hubs
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
        {"manufacturer": "Shimano", "model": "Dura-Ace R9100 Front", "position": "front",
         "flange_diameter_left": 45, "flange_diameter_right": 45,
         "flange_offset_left": 35, "flange_offset_right": 35, "spoke_count": 28},
        {"manufacturer": "Shimano", "model": "Dura-Ace R9100 Rear", "position": "rear",
         "flange_diameter_left": 45, "flange_diameter_right": 45,
         "flange_offset_left": 18.5, "flange_offset_right": 37.5, "spoke_count": 28},
        {"manufacturer": "Shimano", "model": "Tiagra 4700 Front", "position": "front",
         "flange_diameter_left": 45, "flange_diameter_right": 45,
         "flange_offset_left": 35, "flange_offset_right": 35, "spoke_count": 32},
        {"manufacturer": "Shimano", "model": "Tiagra 4700 Rear", "position": "rear",
         "flange_diameter_left": 45, "flange_diameter_right": 45,
         "flange_offset_left": 21.5, "flange_offset_right": 37.5, "spoke_count": 32},
        # Shimano disc hubs
        {"manufacturer": "Shimano", "model": "RS470 Front Disc", "position": "front",
         "flange_diameter_left": 56, "flange_diameter_right": 60,
         "flange_offset_left": 30.3, "flange_offset_right": 37.3, "spoke_count": 32},
        {"manufacturer": "Shimano", "model": "RS470 Rear Disc", "position": "rear",
         "flange_diameter_left": 56, "flange_diameter_right": 56,
         "flange_offset_left": 20.5, "flange_offset_right": 37.5, "spoke_count": 32},
        {"manufacturer": "Shimano", "model": "XT M8100 Front", "position": "front",
         "flange_diameter_left": 58, "flange_diameter_right": 58,
         "flange_offset_left": 28, "flange_offset_right": 42, "spoke_count": 32},
        {"manufacturer": "Shimano", "model": "XT M8100 Rear", "position": "rear",
         "flange_diameter_left": 58, "flange_diameter_right": 56,
         "flange_offset_left": 24, "flange_offset_right": 36, "spoke_count": 32},
        {"manufacturer": "Shimano", "model": "Deore M6100 Front", "position": "front",
         "flange_diameter_left": 58, "flange_diameter_right": 58,
         "flange_offset_left": 28, "flange_offset_right": 42, "spoke_count": 32},
        {"manufacturer": "Shimano", "model": "Deore M6100 Rear", "position": "rear",
         "flange_diameter_left": 58, "flange_diameter_right": 56,
         "flange_offset_left": 24, "flange_offset_right": 36, "spoke_count": 32},
        # DT Swiss hubs
        {"manufacturer": "DT Swiss", "model": "350 Front", "position": "front",
         "flange_diameter_left": 52, "flange_diameter_right": 52,
         "flange_offset_left": 34.5, "flange_offset_right": 34.5, "spoke_count": 32},
        {"manufacturer": "DT Swiss", "model": "350 Rear", "position": "rear",
         "flange_diameter_left": 52, "flange_diameter_right": 52,
         "flange_offset_left": 19.4, "flange_offset_right": 37.8, "spoke_count": 32},
        {"manufacturer": "DT Swiss", "model": "350 Disc Front", "position": "front",
         "flange_diameter_left": 58, "flange_diameter_right": 54,
         "flange_offset_left": 31.6, "flange_offset_right": 38.4, "spoke_count": 32},
        {"manufacturer": "DT Swiss", "model": "370 Front", "position": "front",
         "flange_diameter_left": 52, "flange_diameter_right": 52,
         "flange_offset_left": 34.5, "flange_offset_right": 34.5, "spoke_count": 32},
        {"manufacturer": "DT Swiss", "model": "370 Rear", "position": "rear",
         "flange_diameter_left": 52, "flange_diameter_right": 52,
         "flange_offset_left": 19.4, "flange_offset_right": 37.8, "spoke_count": 32},
        {"manufacturer": "DT Swiss", "model": "240 Front", "position": "front",
         "flange_diameter_left": 44, "flange_diameter_right": 44,
         "flange_offset_left": 36.5, "flange_offset_right": 36.5, "spoke_count": 28},
        {"manufacturer": "DT Swiss", "model": "240 Rear", "position": "rear",
         "flange_diameter_left": 44, "flange_diameter_right": 44,
         "flange_offset_left": 17.5, "flange_offset_right": 35.5, "spoke_count": 28},
        # White Industries hubs
        {"manufacturer": "White Industries", "model": "T11 Front", "position": "front",
         "flange_diameter_left": 58, "flange_diameter_right": 58,
         "flange_offset_left": 32.5, "flange_offset_right": 32.5, "spoke_count": 32},
        {"manufacturer": "White Industries", "model": "T11 Rear", "position": "rear",
         "flange_diameter_left": 58, "flange_diameter_right": 58,
         "flange_offset_left": 19.5, "flange_offset_right": 36.5, "spoke_count": 32},
        {"manufacturer": "White Industries", "model": "CLD Front", "position": "front",
         "flange_diameter_left": 64, "flange_diameter_right": 58,
         "flange_offset_left": 27.5, "flange_offset_right": 36.5, "spoke_count": 32},
        {"manufacturer": "White Industries", "model": "CLD Rear", "position": "rear",
         "flange_diameter_left": 58, "flange_diameter_right": 58,
         "flange_offset_left": 20, "flange_offset_right": 37, "spoke_count": 32},
        # Phil Wood hubs
        {"manufacturer": "Phil Wood", "model": "High Flange Track", "position": "front",
         "flange_diameter_left": 66, "flange_diameter_right": 66,
         "flange_offset_left": 35, "flange_offset_right": 35, "spoke_count": 32},
        {"manufacturer": "Phil Wood", "model": "Low Flange Track", "position": "front",
         "flange_diameter_left": 46, "flange_diameter_right": 46,
         "flange_offset_left": 35, "flange_offset_right": 35, "spoke_count": 32},
        {"manufacturer": "Phil Wood", "model": "High Flange Rear Track", "position": "rear",
         "flange_diameter_left": 66, "flange_diameter_right": 66,
         "flange_offset_left": 22.5, "flange_offset_right": 22.5, "spoke_count": 32},
        # Chris King hubs
        {"manufacturer": "Chris King", "model": "R45 Front", "position": "front",
         "flange_diameter_left": 54, "flange_diameter_right": 54,
         "flange_offset_left": 33.65, "flange_offset_right": 33.65, "spoke_count": 32},
        {"manufacturer": "Chris King", "model": "R45 Rear", "position": "rear",
         "flange_diameter_left": 54, "flange_diameter_right": 54,
         "flange_offset_left": 18.6, "flange_offset_right": 37.7, "spoke_count": 32},
        {"manufacturer": "Chris King", "model": "R45D Front", "position": "front",
         "flange_diameter_left": 62, "flange_diameter_right": 54,
         "flange_offset_left": 26.5, "flange_offset_right": 38.5, "spoke_count": 28},
        {"manufacturer": "Chris King", "model": "R45D Rear", "position": "rear",
         "flange_diameter_left": 54, "flange_diameter_right": 54,
         "flange_offset_left": 18.6, "flange_offset_right": 37.7, "spoke_count": 28},
        # Hope hubs
        {"manufacturer": "Hope", "model": "RS4 Front", "position": "front",
         "flange_diameter_left": 58, "flange_diameter_right": 58,
         "flange_offset_left": 33.5, "flange_offset_right": 33.5, "spoke_count": 32},
        {"manufacturer": "Hope", "model": "RS4 Rear", "position": "rear",
         "flange_diameter_left": 58, "flange_diameter_right": 58,
         "flange_offset_left": 18.5, "flange_offset_right": 37.5, "spoke_count": 32},
        {"manufacturer": "Hope", "model": "Pro 4 Front", "position": "front",
         "flange_diameter_left": 64, "flange_diameter_right": 58,
         "flange_offset_left": 27, "flange_offset_right": 43, "spoke_count": 32},
        {"manufacturer": "Hope", "model": "Pro 4 Rear 148mm", "position": "rear",
         "flange_diameter_left": 58, "flange_diameter_right": 58,
         "flange_offset_left": 25, "flange_offset_right": 35, "spoke_count": 32},
        # Industry Nine hubs
        {"manufacturer": "Industry Nine", "model": "Torch Road Front", "position": "front",
         "flange_diameter_left": 54, "flange_diameter_right": 54,
         "flange_offset_left": 33, "flange_offset_right": 33, "spoke_count": 24},
        {"manufacturer": "Industry Nine", "model": "Torch Road Rear", "position": "rear",
         "flange_diameter_left": 54, "flange_diameter_right": 54,
         "flange_offset_left": 19, "flange_offset_right": 37, "spoke_count": 24},
        {"manufacturer": "Industry Nine", "model": "Hydra Front", "position": "front",
         "flange_diameter_left": 62, "flange_diameter_right": 58,
         "flange_offset_left": 24.75, "flange_offset_right": 45.25, "spoke_count": 32},
        {"manufacturer": "Industry Nine", "model": "Hydra Rear 148mm", "position": "rear",
         "flange_diameter_left": 58, "flange_diameter_right": 58,
         "flange_offset_left": 24, "flange_offset_right": 36, "spoke_count": 32},
        # Onyx hubs
        {"manufacturer": "Onyx", "model": "Vesper Front", "position": "front",
         "flange_diameter_left": 64, "flange_diameter_right": 54,
         "flange_offset_left": 24.8, "flange_offset_right": 45.2, "spoke_count": 32},
        {"manufacturer": "Onyx", "model": "Vesper Rear 148mm", "position": "rear",
         "flange_diameter_left": 58, "flange_diameter_right": 58,
         "flange_offset_left": 23, "flange_offset_right": 37, "spoke_count": 32},
        # Bitex hubs (affordable options)
        {"manufacturer": "Bitex", "model": "RAF12 Front", "position": "front",
         "flange_diameter_left": 54, "flange_diameter_right": 54,
         "flange_offset_left": 34.5, "flange_offset_right": 34.5, "spoke_count": 32},
        {"manufacturer": "Bitex", "model": "RAR12 Rear", "position": "rear",
         "flange_diameter_left": 54, "flange_diameter_right": 54,
         "flange_offset_left": 19.2, "flange_offset_right": 37.8, "spoke_count": 32},
        # Novatec hubs
        {"manufacturer": "Novatec", "model": "A291 Front", "position": "front",
         "flange_diameter_left": 54, "flange_diameter_right": 54,
         "flange_offset_left": 34.5, "flange_offset_right": 34.5, "spoke_count": 32},
        {"manufacturer": "Novatec", "model": "F482 Rear", "position": "rear",
         "flange_diameter_left": 54, "flange_diameter_right": 54,
         "flange_offset_left": 19, "flange_offset_right": 37, "spoke_count": 32},
        {"manufacturer": "Novatec", "model": "D791 Front Boost", "position": "front",
         "flange_diameter_left": 62, "flange_diameter_right": 58,
         "flange_offset_left": 27.5, "flange_offset_right": 42.5, "spoke_count": 32},
        {"manufacturer": "Novatec", "model": "D772 Rear Boost", "position": "rear",
         "flange_diameter_left": 58, "flange_diameter_right": 58,
         "flange_offset_left": 24, "flange_offset_right": 36, "spoke_count": 32},
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
        # Always add sample data first (skips duplicates)
        add_sample_data(db)

        # Try to scrape additional data from Freespoke using Playwright
        if PLAYWRIGHT_AVAILABLE:
            print("\nAttempting to scrape Freespoke with Playwright...")
            try:
                with sync_playwright() as p:
                    print("Launching browser...")
                    browser = p.chromium.launch(headless=True)

                    scrape_rims_with_playwright(db, browser)
                    scrape_hubs_with_playwright(db, browser)

                    browser.close()
            except Exception as e:
                print(f"Playwright scraping failed: {e}")
                print("Using sample data only.")
        else:
            print("\nPlaywright not available - using sample data only.")
            print("To enable full scraping:")
            print("  pip install playwright")
            print("  playwright install chromium")

        print("\nImport complete!")
        print(f"  Total rims in database: {db.query(Rim).count()}")
        print(f"  Total hubs in database: {db.query(Hub).count()}")

    finally:
        db.close()


if __name__ == "__main__":
    main()
