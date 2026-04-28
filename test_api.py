import urllib.request
import json
import sys
sys.stdout.reconfigure(encoding='utf-8')

test_cases = [
    ("Charminar, Hyderabad", "Gachibowli, Hyderabad"),
    ("Secunderabad Railway Station, Hyderabad", "HITEC City, Hyderabad"),
    ("Banjara Hills, Hyderabad", "Kukatpally, Hyderabad"),
    ("LB Nagar, Hyderabad", "Miyapur, Hyderabad"),
    ("Ameerpet, Hyderabad", "Uppal, Hyderabad"),
]

print("=" * 65)
print("  FLOWSYNC AI - LIVE END-TO-END ROUTE TEST")
print("=" * 65)

all_passed = True
for origin, dest in test_cases:
    req = urllib.request.Request('http://localhost:8000/routes/best-route', method='POST')
    req.add_header('Content-Type', 'application/json')
    data = json.dumps({'origin': origin, 'destination': dest}).encode()

    try:
        with urllib.request.urlopen(req, data=data, timeout=20) as f:
            res = json.loads(f.read().decode())

        all_routes = res.get('all_routes', [])
        best = res.get('best_route', {})
        orig = best.get('original_route', {})

        is_mock = orig.get('distance_km') in [18.5, 22.1, 27.3]
        source = "MOCK" if is_mock else "LIVE Google Maps"

        # Check waypoints exist
        waypoints = orig.get('waypoints', [])
        has_polyline = len(waypoints) > 2

        print(f"\n  {origin}")
        print(f"  -> {dest}")
        print(f"  Source:    [{source}]")
        print(f"  Routes:    {len(all_routes)} found")
        print(f"  Best:      {orig.get('label')} | {orig.get('distance_km')}km | {orig.get('duration_minutes')}min")
        print(f"  Traffic:   {orig.get('traffic_level')}")
        print(f"  Risk:      {best.get('risk')} | {best.get('action')}")
        print(f"  Polyline:  {'YES (' + str(len(waypoints)) + ' points)' if has_polyline else 'NO (only endpoints)'}")
        print(f"  AI Expl.:  {best.get('explanation', 'N/A')[:70]}")

        if is_mock:
            print("  !! WARNING: MOCK DATA - Google Directions API may have failed !!")
            all_passed = False
        print()
    except Exception as e:
        print(f"  ERROR: {e}")
        all_passed = False

print("=" * 65)
print(f"  RESULT: {'ALL LIVE - GOOGLE MAPS API ACTIVE' if all_passed else 'CHECK WARNINGS ABOVE'}")
print("=" * 65)
