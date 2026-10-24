"""
NASA POWER connectivity check script.

Run manually to verify live NASA POWER access:
  python scripts/check_nasa.py

Prints climate data for a test location in Morocco (Marrakech region).
"""

import sys
import os

# Add backend root to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'terrarota.settings')

import django
django.setup()

from data_services import nasa_power

TEST_LAT = 31.52
TEST_LON = -8.75
TEST_LOCATION = "Marrakech region"


def main():
    print("=" * 60)
    print("TerraRota -- NASA POWER Connectivity Check")
    print("=" * 60)
    print("Testing location: %s (%.2f, %.2f)" % (TEST_LOCATION, TEST_LAT, TEST_LON))
    print()

    # Quick connectivity check
    sys.stdout.write("Checking NASA POWER reachability... ")
    sys.stdout.flush()
    reachable = nasa_power.check_nasa_connectivity()
    if reachable:
        print("[OK] REACHABLE")
    else:
        print("[FAIL] UNREACHABLE")
        print()
        print("NASA POWER is not currently reachable.")
        print("The application will fall back to sample data.")
        return 1

    # Full data fetch
    sys.stdout.write("\nFetching 5-year climate data... ")
    sys.stdout.flush()
    try:
        result = nasa_power.fetch_climate_data(TEST_LAT, TEST_LON)
        print("[OK] %s" % result['status'].upper())
    except Exception as e:
        print("[FAIL] %s" % e)
        return 1

    prov = result.get("provenance", {})
    print()
    print("Source     : %s" % prov.get('source', '?'))
    print("Period     : %s -> %s" % (
        prov.get('period', {}).get('start', '?'),
        prov.get('period', {}).get('end', '?'),
    ))
    print("Resolution : ~%s degrees (~50 km grid)" % prov.get('spatial_resolution_deg', '?'))

    data = result.get("data", {})
    print()
    print("Variables retrieved: %s" % list(data.keys()))
    print()
    for var, vals in data.items():
        n = len(vals)
        if n > 0:
            avg = sum(vals.values()) / n
            print("   %-28s: %5d days,  mean = %.2f" % (var, n, avg))

    print()
    print("[OK] NASA POWER integration working correctly.")
    print("     Status: LIVE -- real data retrieved successfully.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
